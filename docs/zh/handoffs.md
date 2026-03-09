# Handoff 说明

## 为什么要分两种模式？

第一次跑通和每天稳定执行，解决的是不同问题：

- **首次模式**：建立并稳定这条 workflow
- **日常模式**：维持已批准的 workflow 正常运行

更直白地说：

- **首次模式**在问：这条链能不能建立、评审、稳定下来？
- **日常模式**在问：今天这条已批准的链有没有正常运行？

## 核心原则：数据可以流动，决策必须收口

RoleFlow Agents 把 **产物流** 和 **决策流** 分开。

### 产物流可以直接传
例如：
- Builder 产出数据给 Analyst
- Analyst 读取 Builder 的 approved artifact
- Operator 消费 approved artifact reference

### 决策流必须回到 orchestrator
例如：
- 当前结果够不够进入下一步
- 是否允许进入 daily
- 某个异常能不能忽略
- 是继续、重试还是升级

一句话：**数据可以直传，决策不要漂移。**

## 模式一：首次 handoff

### 目的
当 workflow 还在建立阶段时，用首次模式。

这时要回答的不是“跑没跑通”，而是：
- artifact 是否可复用？
- 分析是否足够支持决策？
- runbook 是否足够稳定？
- 这条链是否已经准备好 trial 或 daily？

### 常见控制路径

```text
Orchestrator -> Builder -> Orchestrator -> Analyst -> Orchestrator -> Operator (trial) -> Orchestrator
```

### Builder 首次 handoff

```yaml
task_id: <string>
status: completed | blocked
artifact: <path-or-ref>
validation: <short result>
assumptions:
  - <point>
risks:
  - <point>
setup_notes:
  - <point>
next_suggestion: <short text>
```

### Analyst 首次 handoff

```yaml
task_id: <string>
summary: <one-paragraph conclusion>
evidence:
  - <point>
risk:
  - <point>
confidence: low | medium | high
limits:
  - <point>
recommendation: revise | trial | approve_for_daily
```

### Operator 首次 trial handoff

```yaml
task_id: <string>
run_status: success | partial | failed
outputs:
  - <artifact-or-link>
anomalies:
  - <point>
mismatch_with_expected:
  - <point>
stabilization_notes:
  - <point>
need_escalation: true | false
```

### 首次评审规则

第一次成功不自动等于 daily。

orchestrator 应从这些状态中选一个：
- `accepted`
- `needs_revision`
- `blocked`
- `approved_for_trial`
- `approved_for_daily`

## 模式二：日常 handoff

### 目的
当 workflow 已被批准，目标变成稳定重复时，用日常模式。

这时 handoff 应更轻，关注偏差、异常和升级。

### 常见控制路径

```text
Orchestrator -> Operator -> Orchestrator
```

### 常见产物流路径

```text
Builder -> Analyst -> Orchestrator -> Operator
```

或者在规则已批准时：

```text
Builder -> Analyst -> Operator
```

但即使执行链缩短，控制逻辑仍来自 orchestrator 批准过的规则，而不是临时横向拍板。

### Builder 日常 handoff

```yaml
task_id: <string>
artifact: <path-or-ref>
validation: <short result>
anomalies:
  - <point>
```

### Analyst 日常 handoff

```yaml
task_id: <string>
summary: <short conclusion>
delta:
  - <what changed from normal>
risk_change:
  - <point>
confidence: low | medium | high
recommendation: continue | review | escalate
```

### Operator 日常 handoff

```yaml
task_id: <string>
run_status: success | partial | failed
run_time: <timestamp>
outputs:
  - <artifact-or-link>
anomalies:
  - <point>
need_escalation: true | false
```

### 日常升级规则

这些情况应从 daily 回到更重的 review 模式：
- 输入结构显著变化
- validation 不再稳定
- 分析逻辑不再适配当前数据
- 执行明显偏离已批准 runbook
- 策略规则需要改变

## 实用总结

### 首次模式
- 建立链路
- 更重评审
- 记录 assumptions 和 setup notes
- 决定能否进入 trial / daily

### 日常模式
- 维护链路
- handoff 更短
- 重点看 delta、异常和升级
- 不要每次运行都重新建流程
