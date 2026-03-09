# RoleFlow Agents

中文说明（当前） | [English section](#english)

RoleFlow Agents 是一套面向长期运行 AI 系统的 multi-agent workflow 设计，重点解决**角色串味、上下文膨胀、memory 污染和执行失控**问题。

> Source note: inspired by practical OpenClaw multi-agent experiments and generalized into a public, privacy-safe template.

## 为什么是这套设计

常见 multi-agent 方案的问题通常不是“agent 不够多”，而是：

- 角色很多，但职责重叠
- agent 横向串话，导致上下文越来越胖
- 主 agent 越用越像第二个全能 agent
- 专家交付缺少统一验收口
- daily 执行直接接草稿，流程容易失控

RoleFlow Agents 的设计重点，是把 **角色边界、handoff、验收、memory 边界** 一次说清。

## 核心优点

- **Clear role boundaries**：角色各司其职，不互相抢活
- **Controlled handoffs**：信息受控流动，减少上下文污染
- **Single decision hub**：决策统一收口到 orchestrator，便于审计和回溯
- **Workflow-first experts**：专家靠 workflow skill 工作，不只靠 prompt 硬压
- **Low-memory orchestration**：主 agent 只维护状态和摘要，不吞专家细节
- **Production-friendly**：适合从首次试跑平滑过渡到稳定 daily 执行

## 四个角色

- **Orchestrator**：理解目标、拆任务、验收交付、决定下一跳
- **Analyst**：基于数据给结论、风险和置信度，不直接下执行命令
- **Builder**：开发与验证数据/代码产物，没跑通不算完成
- **Operator**：按批准版本稳定执行 daily 流程，异常立即上报

## 设计原则

1. **专家只对主 agent 交付，不横向自由指挥**
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

RoleFlow Agents is a multi-agent workflow design for long-running AI systems, built to reduce **role drift, context pollution, memory bloat, and execution chaos**.

> Source note: inspired by practical OpenClaw multi-agent experiments and generalized into a public, privacy-safe template.

## Why this design

Many multi-agent systems fail not because they lack agents, but because they lack boundaries:

- too many overlapping roles
- uncontrolled lateral conversations
- an orchestrator that slowly becomes a second generalist
- no consistent acceptance gate for expert outputs
- daily execution fed by drafts instead of approved artifacts

RoleFlow Agents focuses on making **role boundaries, handoffs, acceptance, and memory boundaries** explicit.

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
