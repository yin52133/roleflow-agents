# Workflow Registry

## 目的

RoleFlow Agents 把 workflow 当成受管对象，而不是松散聊天历史。

registry 给 orchestrator 提供稳定依据，用来：
- 选择 `first_run` 还是 `daily`
- 判断是 `repair`、`revise`、`derive`、`create` 还是 `retire`
- 理解这条 workflow 需要哪些角色
- 确认当前批准的 runbook 和 artifact 是什么

## 最小 schema

```yaml
workflow_id: wf-0001
slug: macro-daily
name: Macro Daily Analysis
purpose: Produce a daily macro report from approved data sources
role_sequence:
  - builder
  - analyst
  - operator
workflow_state: drafting | trial | approved_daily | suspended | retired
current_mode: first_run | daily
approved_artifacts:
  data_source: artifacts/macro/latest.json
  analysis_template: templates/macro-report-v1.md
approved_runbook: runbooks/macro-daily-v1.md
lifecycle_intent: repair | revise | derive | create | retire
origin:
  type: created | derived
  parent_workflow_id: wf-0000
  reason: <short text>
```

## 命名规则

推荐文件名：
- `0001-macro-daily.yaml`
- `0002-market-brief.yaml`

推荐内部 ID：
- `wf-0001`
- `wf-0002`

为什么两者都要有？
- 文件名方便人排序和快速扫目录
- 内部 ID 方便系统保持稳定引用，即使 slug 将来变化也不怕

## 生命周期含义

### repair
workflow 设计没变，但执行坏了。

### revise
还是同一条 workflow，但批准规则、模板或资产要更新。

### derive
从现有 workflow 派生新 workflow。父流程相似，但已不再相同。

### create
没有合适父流程，直接创建新 workflow。

### retire
停止把这条 workflow 当成活跃路径使用。

## orchestrator 判断规则

按顺序问三个问题：

1. 目标还是不是同一条 workflow 的目标？
2. 角色结构是不是仍然大体一致？
3. 当前 daily 组织方式还能不能复用？

判断结果：
- 同目标 + 同结构 + 执行坏了 -> `repair`
- 同目标 + 同结构 + 批准逻辑要变 -> `revise`
- 有相近父流程，但节奏/结构/目标已不同 -> `derive`
- 没有合适父流程 -> `create`
- 不再安全或不再有意义 -> `retire`

## mode 强制规则

mode 不应靠 prompt 临时指定，而应来自 workflow state：

- `drafting` -> `first_run`
- `trial` -> `first_run`
- `approved_daily` -> `daily`
- `suspended` -> `first_run`
- `retired` -> 不应进入活跃执行路径

当这些 daily guard 失败时，应回到重评审模式：
- 输入结构显著变化
- validation 不再可靠
- 分析逻辑不再适配
- operator 输出不再符合 runbook

## 控制面 vs 运行态

workflow 定义文件不等于 daily 执行状态。

### 控制面（`workflows/*.yaml`）
这里放慢变化、已批准的定义：
- workflow 身份
- purpose
- role sequence
- workflow state
- approved runbook 和 artifact 引用
- guard / retry / escalation policy

这些文件只应在 workflow 本身发生变化时改。

### 运行态（`runtime/workflow-runs/...`）
这里放快变化的执行状态：
- 当前 run 状态
- 当前阶段
- 时间戳
- retries
- outputs
- anomalies
- escalation state

这是 operator 应该写入的地方。

## Operator 规则

operator 更新的是 execution state，不是 workflow definition。

也就是说：
- operator 可以更新 run record
- operator 可以上报 outputs 和 anomalies
- operator 不该在日常执行时改 workflow identity、approved runbook 或 lifecycle policy

## 推荐目录布局

```text
workflows/
  0001-macro-daily.yaml
runtime/
  workflow-runs/
    wf-0001/
      latest.json
      history/
        2026-03-09T09-00-00.json
```

## 运行态字段示例

```yaml
run_id: run-20260309-0900
workflow_id: wf-0001
status: running | completed | failed | timed_out
current_stage: builder | analyst | operator
started_at: <timestamp>
last_progress_at: <timestamp>
retry_count: 0
outputs:
  - <artifact-or-link>
anomalies:
  - <point>
need_escalation: false
```
