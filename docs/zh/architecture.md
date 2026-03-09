# 架构说明

## 目标

设计一套 multi-agent 系统，让 orchestrator 保持轻量，专家保持聚焦，日常执行不会悄悄继承草稿级决策。

这套架构不是靠“agent 越多越强”，而是靠几条明确约束，去减少角色串味、上下文污染和 memory 膨胀。

## 四个核心取舍

1. **单一决策中心**  
   专家可以产出结果，但只有 orchestrator 推进 workflow 状态。

2. **摘要优先交接**  
   专家交付结构化摘要，而不是长篇内部过程。

3. **先验收，再重复**  
   一次性成功不等于可以进入 daily。

4. **轻量 orchestrator memory**  
   orchestrator 记录状态和引用，不吞专家长文本细节。

## 拓扑

```text
User -> Orchestrator -> Expert
User <- Orchestrator <- Expert
                |
                -> Operator
```

这不只是消息流，更是控制流。orchestrator 是决策中心。

## 为什么默认不让专家自由横向路由

横向协作看起来高效，但长期通常会导致：

- 角色边界变模糊
- 专家开始混入彼此上下文
- 控制决策没有清晰归属
- orchestrator 反而要吞更多历史来复原全局

所以默认规则是：

- 专家向 orchestrator 交付
- 专家之间可以引用或传递产物
- 但不要让专家变成独立控制中心

## 产物流 vs 决策流

### 产物流可以移动
例如：
- Builder 产出的数据集
- Analyst 产出的分析卡片
- Operator 产出的运行结果

### 决策流必须收口
例如：
- 是否进入下一阶段
- 是否接受风险
- 是否批准进入 daily
- 是否停止、重试或升级

一句话：**产物可以流动，控制不要漂移。**

## 为什么 orchestrator 要保持轻量

如果 orchestrator 开始吸收：
- 专家完整推理
- 实现细节 dump
- 长篇分析正文
- 全量专家转录

那它就不再是路由层，而会变成第二个全能 agent。

### orchestrator 应记录
- task id
- 当前阶段
- 当前有效 artifact 引用
- 验收状态
- 下一责任角色

### orchestrator 应避免记录
- 专家完整推理
- 冗长实现细节
- 原始专家聊天历史
- 非升级场景下的深度领域上下文

## 控制面 vs 运行态

RoleFlow Agents 应把 workflow 定义和执行状态分开。

### 控制面
- workflow 身份
- 批准的 runbook
- 批准的 artifact 引用
- 生命周期规则
- mode 选择规则

### 运行态
- 当前 run 状态
- 步骤推进
- 重试次数
- 输出
- 异常
- 升级状态

这样可以避免 daily 执行噪音污染批准后的 workflow 定义。

## workflow registry 与 mode 选择

orchestrator 不应只靠当前对话上下文拍板，还应维护 workflow registry。

每条 workflow 应至少记录：
- `workflow_id`
- `slug`
- `name`
- `purpose`
- `role_sequence`
- `workflow_state`
- `current_mode`
- 批准的 artifact 引用
- 批准的 runbook 引用
- 生命周期动作

推荐文件命名：
- `0001-macro-daily.yaml`
- `0002-market-brief.yaml`

推荐内部标识：
- `wf-0001`
- `wf-0002`

## 生命周期动作

- `repair`：设计没变，实现坏了
- `revise`：还是同一条 workflow，但批准逻辑或资产要改
- `derive`：基于现有 workflow 派生新分支
- `create`：没有合适父流程，直接新建
- `retire`：停止作为活跃流程使用

## mode 强制规则

mode 选择不是描述性标签，而是由 workflow state 控制：

- `workflow_state != approved_daily` -> `first_run`
- `workflow_state == approved_daily` -> `daily`
- 如果 daily guard 失败 -> 切到 `suspended`，回到重验收模式

## 首次验收模型

一条 workflow 只跑成功一次，并不等于可以日常重复。

真正要回答的问题不是：
- 某个专家是不是完成了一次任务

而是：
- 这条链是否足够稳定，可以进入重复执行

## 验收状态

- `accepted`
- `needs_revision`
- `blocked`
- `approved_for_trial`
- `approved_for_daily`

这些状态由 orchestrator 施加，专家不能自己批准上线。

## 角色契约

### Orchestrator
- 负责拆分
- 负责验收
- 负责路由
- 负责批准进入 daily
- 不把专家实现细节吞进长期记忆

### Analyst
- 负责解释
- 交付结论、证据、风险、置信度
- 不直接下执行命令

### Builder
- 负责实现与验证
- 交付 artifact、验证结果、已知风险
- 不负责业务上线判断

### Operator
- 负责可重复执行
- 只读批准输入和 runbook
- 异常上报，不临场改策略
