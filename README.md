# RoleFlow Agents

中文说明（当前） | [English section](#english)

RoleFlow Agents 是一套面向长期运行 AI 系统的 multi-agent workflow 设计。它不是靠“多几个 agent”来解决问题，而是靠一组明确的结构取舍，去解决更常见的失败模式：**角色串味、上下文膨胀、memory 污染，以及草稿直接滑进 daily 执行**。

> Source note: inspired by practical OpenClaw multi-agent experiments and generalized into a public, privacy-safe template.

## 这套设计到底好在哪

很多 multi-agent 系统的问题，不是能力不够，而是结构没收口。典型表现是：

- 专家之间横向自由对话，彼此吞上下文
- 主 agent 为了理解全局，被迫读取越来越多细节，最后变成第二个“全能 agent”
- 分析、开发、执行之间缺少统一验收口，草稿容易直接升级成重复执行
- memory 记录的是聊天过程，而不是稳定的工作流状态

RoleFlow Agents 不是回避这些问题，而是正面做了 4 个明确取舍。

## 四个核心设计取舍

### 1. Single Decision Hub
**只有 orchestrator 推进工作流状态。**

专家可以产出数据、代码、分析卡片和执行结果，但“是否进入下一步”“是否允许 daily 执行”“是否接受风险”这类决策，统一经过 orchestrator。这样做的结果是：

- 决策口径只有一个
- 回溯和审计更容易
- 专家不会偷偷扩张成新的控制中心

### 2. Summary-First Handoff
**专家交付摘要，不交付整段内部过程。**

Builder 交付 artifact、validation、risk；Analyst 交付 summary、evidence、confidence；Operator 交付 run status、outputs、anomalies。主 agent 优先接收结构化 handoff，而不是专家长对话全文。

这样做的好处是：

- 主 agent 不必吞完整专家上下文
- handoff 更短，更像“决策材料”而不是“聊天记录”
- 专家细节仍然保留在专家自己的工作空间里

### 3. Acceptance Before Repetition
**第一次跑通，不等于可以进入 daily。**

RoleFlow Agents 默认认为：单次交付成功，只说明专家完成了一个任务；但是否能升级成稳定工作流，必须先经过验收 gate。也就是说，这套设计把“完成一次”与“可重复执行”明确分开。

### 4. Thin Orchestrator Memory
**主 agent 只维护状态，不维护专家长文本细节。**

orchestrator 主要保存：

- 当前任务处于哪个 stage
- 哪个 artifact 是当前有效版本
- 验收状态是什么
- 下一步交给谁

而不是保存：

- 专家完整推理过程
- 长篇分析正文
- 技术实现细节 dump
- 多轮专家聊天历史

这保证主 agent 负责调度，而不是慢慢长成第二个 analyst 或 builder。

## 为什么不是让专家横向自由协作

这是这套设计里一个很刻意的选择。

横向自由协作看起来高效，但现实里通常会带来：

- 角色边界变模糊
- 专家开始学习彼此职责
- 上下文在多个 agent 之间反复扩散
- orchestrator 为了补全全局，不得不吸收更多历史消息

所以 RoleFlow Agents 的默认策略是：

- **信息可以被引用**
- **产物可以被转交**
- **但决策必须回到 orchestrator 收口**

换句话说，**artifact 可以流动，control 不应该失控。**

## 核心优点

- **Clear role boundaries**：角色分工稳定，不互相抢活
- **Controlled handoffs**：信息流有格式、有边界，不靠自由聊天传递
- **Single decision hub**：决策统一经过 orchestrator，降低系统歧义
- **Workflow-first experts**：专家靠默认 workflow skill 工作，不只靠 prompt 自觉
- **Low-memory orchestration**：主 agent 保持轻量，更适合长期运行
- **Production-friendly execution**：适合从首次试跑平滑升级到稳定 daily 执行

## 四个角色

- **Orchestrator**：理解目标、拆任务、验收交付、决定下一跳
- **Analyst**：基于数据给结论、风险和置信度，不直接下执行命令
- **Builder**：开发与验证数据/代码产物，没跑通不算完成
- **Operator**：按批准版本稳定执行 daily 流程，异常立即上报

## 设计原则

1. **专家只对 orchestrator 交付，不横向自由指挥**
2. **第一次上线必须有验收**
3. **产物可以引用，决策必须收口**
4. **主 agent 只记状态，不记专家长文本细节**
5. **SOUL 管角色，RULE 管边界，SKILL 管 workflow**

## 默认语言策略

- 面向用户的默认输出：**中文**
- 明确要求英文时：切英文
- 代码、字段名、文件名、schema 名：保留英文
- README 提供中英双入口；规范文件默认英文 canonical

## 仓库结构

```text
roleflow-agents/
├─ agents/
│  ├─ orchestrator/
│  ├─ analyst/
│  ├─ builder/
│  └─ operator/
├─ skills/
│  ├─ orchestrator-core/
│  ├─ analyst-core/
│  ├─ builder-core/
│  └─ operator-core/
├─ docs/
│  ├─ architecture.md
│  └─ handoffs.md
└─ README.md
```

## 适用场景

- 需要一个主 agent 编排多个专家 agent
- 需要控制上下文污染和 memory 边界
- 需要把“试跑成功”升级成“可 daily 执行”
- 需要 public-friendly 的角色模板，而不是私人 deployment 配置

## 注意

本仓库是**公开模板仓库**，不包含：

- 任何 token、license key、OAuth 凭据
- 真实 chat / group / user ID
- 私人 memory、私有 runbook、生产 secrets
- 特定个人环境路径或 runtime 产物

---

# English

RoleFlow Agents is a multi-agent workflow design for long-running AI systems. It does not try to solve coordination problems by simply adding more agents. Instead, it makes a few explicit structural choices to reduce common failure modes: **role drift, context pollution, memory bloat, and drafts slipping into repeated execution**.

> Source note: inspired by practical OpenClaw multi-agent experiments and generalized into a public, privacy-safe template.

## Why this design is useful

Many multi-agent systems do not fail because the agents are weak. They fail because the structure is loose:

- experts talk laterally and keep leaking context into each other
- the coordinator absorbs too much detail and slowly becomes a second generalist
- analysis, implementation, and execution have no consistent acceptance gate
- memory stores conversations instead of durable workflow state

RoleFlow Agents responds with four explicit design choices.

## Four core design choices

### 1. Single Decision Hub
**Only the orchestrator advances workflow state.**

Experts may produce data, code, analyses, and execution results, but decisions such as “move to the next step,” “approve for daily execution,” or “accept this risk” always flow through the orchestrator.

This keeps:

- one decision surface
- easier auditability and rollback
- experts from turning into new control centers

### 2. Summary-First Handoff
**Experts deliver structured summaries instead of raw internal process.**

Builders return artifact, validation, and risk. Analysts return summary, evidence, and confidence. Operators return run status, outputs, and anomalies. The orchestrator consumes decision-ready handoffs instead of expert transcript dumps.

This keeps the system lighter because:

- the orchestrator does not need the full expert context
- handoffs stay short and actionable
- expert detail remains inside the expert workspace when needed

### 3. Acceptance Before Repetition
**A successful one-off run is not the same as a repeatable workflow.**

RoleFlow Agents separates “an expert finished a task once” from “this workflow is safe enough to enter daily execution.” The first release passes an acceptance gate before it becomes repetition.

### 4. Thin Orchestrator Memory
**The orchestrator stores state, not expert long-form detail.**

The orchestrator mainly stores:

- current task stage
- active artifact reference
- acceptance status
- next owner

It avoids storing:

- full expert reasoning
- long analytical prose
- implementation detail dumps
- entire expert transcripts

This keeps the orchestrator focused on routing instead of slowly becoming a second analyst or builder.

## Why not let experts collaborate laterally by default?

This is an intentional trade-off.

Lateral collaboration looks efficient at first, but it usually causes:

- weaker role boundaries
- experts learning and mixing each other’s responsibilities
- context spreading across multiple agents
- the orchestrator needing even more history to reconstruct the workflow

So the default rule is:

- **information may be referenced**
- **artifacts may be passed along**
- **but decisions must be re-centered through the orchestrator**

In short: **artifacts may flow; control should not drift.**

## Core advantages

- **Clear role boundaries**
- **Controlled handoffs**
- **Single decision hub**
- **Workflow-first experts**
- **Low-memory orchestration**
- **Production-friendly execution**

## Roles

- **Orchestrator**: decomposes work, validates deliverables, and controls the next step
- **Analyst**: turns data into conclusions, risks, and confidence levels
- **Builder**: develops and validates data/code artifacts
- **Operator**: runs approved daily workflows and escalates anomalies

## Principles

1. Experts report to the orchestrator instead of freely commanding each other.
2. The first release of a workflow must be reviewed.
3. Artifacts may flow laterally; decisions must flow through the orchestrator.
4. The orchestrator stores states and summaries, not expert long-form reasoning.
5. **SOUL defines role, RULE defines boundary, SKILL defines workflow.**

## Default language policy

- Default end-user output: **Chinese**
- Switch to English when explicitly requested
- Keep code, identifiers, file names, and schema names in English
- README is bilingual; canonical operational files stay in English

## Public template policy

This repository is a **public template repo**. It should not contain secrets, private IDs, personal memory files, environment-specific runtime artifacts, or deployment credentials.
