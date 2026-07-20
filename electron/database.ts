/* electron/database.ts */
import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'ai-coding-learner.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createTables()
  seedData()
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_config (
      id INTEGER PRIMARY KEY,
      nickname TEXT DEFAULT '学习者',
      avatar TEXT,
      daily_goal_minutes INTEGER DEFAULT 30,
      reminder_enabled INTEGER DEFAULT 0,
      reminder_time TEXT DEFAULT '09:00',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('beginner','intermediate','advanced')) DEFAULT 'beginner',
      description TEXT,
      cover_image TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT CHECK(type IN ('theory','practice')) DEFAULT 'theory',
      estimated_minutes INTEGER DEFAULT 10,
      video_url TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      chapter_id INTEGER REFERENCES chapters(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      initial_code TEXT,
      solution_code TEXT,
      validation_type TEXT CHECK(validation_type IN ('exact','contains','regex','custom')) DEFAULT 'contains',
      validation_value TEXT,
      difficulty TEXT CHECK(difficulty IN ('easy','medium','hard')) DEFAULT 'easy',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS learning_records (
      id INTEGER PRIMARY KEY,
      chapter_id INTEGER NOT NULL REFERENCES chapters(id),
      task_id INTEGER REFERENCES tasks(id),
      status TEXT CHECK(status IN ('in_progress','completed','skipped')) DEFAULT 'in_progress',
      user_code TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      duration_seconds INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS learning_sessions (
      id INTEGER PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      total_seconds INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // 为旧数据库添加 video_url 列（如果不存在）
  try { db.exec(`ALTER TABLE chapters ADD COLUMN video_url TEXT`) } catch (_) { /* 列已存在 */ }
}

function seedData(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number }
  if (count.count > 0) return

  const insertCourse = db.prepare(
    'INSERT INTO courses (id, title, category, difficulty, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertChapter = db.prepare(
    'INSERT INTO chapters (id, course_id, title, content, type, estimated_minutes, video_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertTask = db.prepare(
    'INSERT INTO tasks (id, chapter_id, title, description, initial_code, solution_code, validation_type, validation_value, difficulty, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertUser = db.prepare(
    'INSERT INTO user_config (id, nickname, daily_goal_minutes) VALUES (1, ?, 30)'
  )

  const seed = db.transaction(() => {
    insertUser.run('学习者')

    // 课程 1: Agent 基础概念
    insertCourse.run(1, 'Agent 基础概念与架构', 'basics', 'beginner', '了解 AI Agent 的核心概念、组成部分和工作原理', 1)
    insertChapter.run(1, 1, '什么是 AI Agent', `# 什么是 AI Agent

AI Agent（智能体）是一种能够感知环境、做出决策并执行行动的自主系统。在 AI 编程领域，Agent 特指能够理解用户意图、自主规划任务、调用工具并生成代码的智能程序。

## 核心特征

1. **自主性**：Agent 能够独立做出决策，无需人类逐步指导
2. **感知能力**：能够理解上下文、读取代码、分析问题
3. **行动能力**：能够执行代码、调用 API、修改文件
4. **学习能力**：从反馈中不断优化行为

## Agent vs 传统 AI 助手

| 特性 | 传统 AI 助手 | AI Agent |
|------|-------------|----------|
| 交互方式 | 单轮问答 | 多轮自主执行 |
| 任务范围 | 单一任务 | 复合任务链 |
| 工具使用 | 有限 | 丰富的工具集成 |
| 记忆能力 | 无 | 有上下文记忆 |

## 实践思考

想象你要开发一个"自动生成 API 文档"的 Agent，它需要哪些能力？`, 'theory', 15, 'https://www.bilibili.com/video/BV19tZPYpE1S/', 1)

    insertChapter.run(2, 1, 'Agent 的核心架构', `# Agent 的核心架构

一个典型的 AI Agent 由以下四个核心模块组成：

## 1. 大脑（LLM）
- 负责理解、推理和规划
- 通常使用 GPT-4、Claude 等大语言模型
- 决定"做什么"和"怎么做"

## 2. 记忆系统
- **短期记忆**：当前对话上下文
- **长期记忆**：向量数据库存储的历史知识
- **工作记忆**：当前任务的状态信息

## 3. 工具集
- 代码执行器
- 文件系统操作
- API 调用
- 网页搜索
- 数据库查询

## 4. 规划与执行
- 任务分解
- 步骤排序
- 执行监控
- 错误恢复

\`\`\`
┌─────────────────────────────────┐
│           AI Agent              │
│  ┌──────┐  ┌──────────────┐    │
│  │ LLM  │  │   记忆系统    │    │
│  │ 大脑 │  │ 短/长/工作   │    │
│  └──┬───┘  └──────┬───────┘    │
│     │             │            │
│  ┌──┴─────────────┴──────┐    │
│  │     规划与执行引擎     │    │
│  └──────────┬────────────┘    │
│             │                 │
│  ┌──────────┴────────────┐    │
│  │       工具集           │    │
│  │ 代码|文件|API|搜索|DB  │    │
│  └───────────────────────┘    │
└─────────────────────────────────┘
\`\`\``, 'theory', 15, 'https://www.bilibili.com/video/BV19tZPYpE1S/?p=2', 2)

    insertChapter.run(3, 1, '构建你的第一个 Agent', `# 构建你的第一个 Agent

让我们通过一个简单的示例来理解 Agent 的工作方式。

## 场景：代码审查 Agent

假设我们要构建一个自动审查代码的 Agent，它需要：

1. 读取代码文件
2. 分析代码质量
3. 提出改进建议
4. 生成审查报告

## Agent 的思考过程

\`\`\`
用户: 请审查 src/utils.ts 文件

Agent 思考:
1. 我需要先读取文件内容
2. 分析代码结构、命名规范、潜在问题
3. 整理成结构化的审查报告
4. 输出报告给用户

Agent 行动:
→ 调用 read_file("src/utils.ts")
→ 分析内容...
→ 生成报告
→ 输出结果
\`\`\`

## 关键要点

- Agent 不是一次性给出答案，而是分步执行
- 每个步骤可能调用不同的工具
- Agent 会根据中间结果调整后续步骤
- 良好的 prompt 设计是 Agent 效果的关键`, 'theory', 15, 'https://www.bilibili.com/video/BV19tZPYpE1S/?p=3', 3)

    // 课程 2: Prompt Engineering
    insertCourse.run(2, 'Prompt Engineering 进阶', 'basics', 'beginner', '掌握编写高质量 Prompt 的技巧，让 Agent 更精准地理解你的意图', 2)
    insertChapter.run(4, 2, 'Prompt 基础原则', `# Prompt 基础原则

Prompt 是你与 AI Agent 沟通的桥梁。一个好的 Prompt 能让 Agent 准确理解你的需求。

## 核心原则

### 1. 明确具体
\`\`\`
❌ 差: "写个函数"
✅ 好: "写一个 TypeScript 函数，接收用户 ID 数组，返回对应的用户名称列表，需要处理空数组和无效 ID 的情况"
\`\`\`

### 2. 提供上下文
\`\`\`
❌ 差: "修复这个 bug"
✅ 好: "在 src/auth.ts 第 42 行，登录函数在 token 过期时没有正确处理 401 错误，请修复"
\`\`\`

### 3. 指定格式
\`\`\`
❌ 差: "解释这段代码"
✅ 好: "用三点列表解释这段代码的核心逻辑，每点不超过两句话"
\`\`\`

### 4. 分步引导
\`\`\`
❌ 差: "帮我重构整个项目"
✅ 好: "先分析 src/ 目录结构，找出重复代码，然后逐步重构，每步确认后再继续"
\`\`\``, 'theory', 15, 'https://search.bilibili.com/all?keyword=Prompt+Engineering+提示词工程', 1)

    insertChapter.run(5, 2, '高级 Prompt 技巧', `# 高级 Prompt 技巧

## Chain of Thought（思维链）

要求 Agent 在给出答案前展示推理过程：

\`\`\`
请逐步分析以下问题：
1. 先理解需求
2. 列出实现步骤
3. 分析每个步骤的潜在问题
4. 给出最终方案

需求：实现一个带缓存的 API 请求函数
\`\`\`

## Few-Shot Prompting

通过示例引导 Agent 的行为：

\`\`\`
按照以下格式生成 Git 提交信息：

示例1:
改动: 修复登录页面 token 刷新逻辑
类型: fix
描述: 在 token 过期时自动使用 refresh_token 获取新 token

示例2:
改动: 新增用户头像上传组件
类型: feat
描述: 支持拖拽上传和裁剪功能

现在请为以下改动生成提交信息：
改动: 优化数据库查询性能，添加索引
\`\`\`

## Role Prompting

为 Agent 设定角色和约束：

\`\`\`
你是一位资深前端架构师，专注于 React 和 TypeScript。

审查代码时请关注：
- 组件设计是否合理
- 类型定义是否完整
- 性能是否有优化空间
- 是否存在安全隐患

请以专业但友好的语气给出建议。
\`\`\``, 'theory', 15, 'https://search.bilibili.com/all?keyword=Prompt+Engineering+高级技巧', 2)

    insertChapter.run(6, 2, 'Prompt 实战练习', '编写 Agent 指令是你的核心技能。以下任务将帮助你练习。', 'practice', 20, 'https://search.bilibili.com/all?keyword=Prompt+Engineering+实战', 3)

    // 课程 3: Tool Calling
    insertCourse.run(3, 'Tool Calling 与 Function Calling', 'agent', 'intermediate', '深入理解 Agent 如何调用工具，掌握 Function Calling 的核心机制', 3)
    insertChapter.run(7, 3, 'Tool Calling 概述', `# Tool Calling 概述

Tool Calling 是 Agent 最核心的能力之一——让 AI 能够像人类一样使用各种工具。

## 什么是 Tool Calling

Tool Calling 允许 Agent：
- 调用外部 API
- 执行代码
- 操作文件系统
- 查询数据库
- 发送网络请求

## 工作流程

\`\`\`
用户输入 → LLM 分析 → 决定调用工具 → 执行工具 → 获取结果 → LLM 整合 → 输出响应
\`\`\`

## 工具定义示例

\`\`\`typescript
const tools = [
  {
    name: "read_file",
    description: "读取指定路径的文件内容",
    parameters: {
      path: "string - 文件路径"
    }
  },
  {
    name: "search_code",
    description: "在代码库中搜索",
    parameters: {
      query: "string - 搜索关键词",
      fileTypes: "string[] - 文件类型过滤"
    }
  }
]
\`\`\``, 'theory', 15, 'https://search.bilibili.com/all?keyword=Function+Calling+工具调用+Agent', 1)

    insertChapter.run(8, 3, '实现 Tool Calling', `# 实现 Tool Calling

## 工具注册

\`\`\`typescript
class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  register(tool: Tool) {
    this.tools.set(tool.name, tool)
  }

  async execute(name: string, params: any) {
    const tool = this.tools.get(name)
    if (!tool) throw new Error(\`Unknown tool: \${name}\`)
    return tool.handler(params)
  }

  getDefinitions() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }))
  }
}
\`\`\`

## 执行流程

1. LLM 返回 function_call 响应
2. 解析工具名称和参数
3. 执行对应工具
4. 将结果返回给 LLM
5. LLM 基于结果继续推理或生成最终答案`, 'theory', 15, 'https://search.bilibili.com/all?keyword=Function+Calling+Agent+实现', 2)

    insertChapter.run(9, 3, 'Tool Calling 实战', '编写一个带工具调用的 Agent 系统', 'practice', 20, 'https://search.bilibili.com/all?keyword=Function+Calling+实战', 3)

    // 课程 4: Agent 工作流
    insertCourse.run(4, 'Agent 工作流设计', 'agent', 'intermediate', '学习 Plan-Execute-Review 工作流模式，设计高效的 Agent 执行流程', 4)
    insertChapter.run(10, 4, 'Plan-Execute-Review 模式', `# Plan-Execute-Review 模式

这是最经典的 Agent 工作流模式。

## Plan（规划）
Agent 接收任务后，先制定执行计划：
- 分析任务目标
- 分解为子任务
- 确定依赖关系
- 排定执行顺序

## Execute（执行）
按照计划逐步执行：
- 每个子任务独立执行
- 记录执行结果
- 处理异常情况

## Review（审查）
执行完成后进行审查：
- 对照目标检查结果
- 发现遗漏或错误
- 必要时重新规划和执行

\`\`\`
Plan → Execute → Review
  ↑                 ↓
  └─── 调整 ←───────┘
\`\`\``, 'theory', 15, 'https://search.bilibili.com/all?keyword=AI+Agent+工作流+Plan+Execute', 1)

    insertChapter.run(11, 4, '工作流实战', '设计并实现一个完整的 Agent 工作流', 'practice', 20, 'https://search.bilibili.com/all?keyword=AI+Agent+工作流+实战', 2)

    // 课程 5: 多 Agent 协作
    insertCourse.run(5, '多 Agent 协作模式', 'advanced', 'advanced', '探索多个 Agent 协同工作的模式与最佳实践', 5)
    insertChapter.run(12, 5, '多 Agent 协作概述', `# 多 Agent 协作概述

当单个 Agent 无法高效完成任务时，多 Agent 协作是自然的解决方案。

## 协作模式

### 1. 层级模式
一个主 Agent 分配任务给多个子 Agent

### 2. 对等模式
多个 Agent 平等协作，互相审查

### 3. 流水线模式
Agent 按顺序处理任务的不同阶段

### 4. 辩论模式
多个 Agent 讨论并达成共识

## 适用场景
- 大型项目开发
- 代码审查 + 修复
- 前后端协作开发
- 测试用例生成`, 'theory', 15, 'https://search.bilibili.com/all?keyword=Multi-Agent+多智能体', 1)

    insertChapter.run(13, 5, '多 Agent 实战', '模拟多 Agent 协作完成项目', 'practice', 20, 'https://search.bilibili.com/all?keyword=Multi-Agent+实战', 2)

    // 课程 6: RAG Agent
    insertCourse.run(6, 'RAG 在 Agent 中的应用', 'advanced', 'advanced', '掌握检索增强生成技术，让 Agent 拥有强大的知识检索能力', 6)
    insertChapter.run(14, 6, 'RAG 基础', `# RAG 基础

RAG（Retrieval-Augmented Generation）让 Agent 能够检索外部知识。

## 核心流程

\`\`\`
用户提问 → 向量检索 → 获取相关文档 → 拼接上下文 → LLM 生成回答
\`\`\`

## 关键组件

1. **文档处理**：分块、向量化
2. **向量数据库**：存储和检索
3. **检索策略**：相似度搜索、混合搜索
4. **上下文拼接**：将检索结果注入 Prompt

## 在 Agent 中的应用

- 代码库问答
- 文档检索
- 知识库查询
- 历史对话回顾`, 'theory', 15, 'https://www.bilibili.com/video/BV1LCgWzqE7d/', 1)

    insertChapter.run(15, 6, 'RAG 实战', '构建一个带 RAG 能力的代码问答 Agent', 'practice', 20, 'https://www.bilibili.com/video/BV14vXyYGEZF/', 2)

    // 实操任务
    insertTask.run(1, 6, '编写 Agent 指令', '为一个代码审查 Agent 编写完整的系统指令（System Prompt），要求包含角色设定、行为规范、输出格式。', '// 在这里编写你的 Agent 指令\n// 提示：\n// 1. 设定角色（你是一个...）\n// 2. 定义能力（你可以...）\n// 3. 规范行为（你应该...）\n// 4. 指定输出格式', '', 'contains', '角色', 'easy', 1)

    insertTask.run(2, 9, '实现工具注册器', '实现一个 ToolRegistry 类，支持注册工具、执行工具、获取工具定义。', 'class ToolRegistry {\n  // TODO: 实现工具注册器\n  \n  register(tool) {\n    // 注册工具\n  }\n\n  async execute(name, params) {\n    // 执行工具\n  }\n\n  getDefinitions() {\n    // 获取工具定义列表\n  }\n}', '', 'contains', 'class ToolRegistry', 'medium', 1)

    insertTask.run(3, 11, '实现工作流引擎', '实现一个支持 Plan-Execute-Review 的工作流引擎，能分解任务、执行步骤、汇总结果。', 'class WorkflowEngine {\n  // TODO: 实现工作流引擎\n  \n  async plan(task) {\n    // 分解任务为步骤\n  }\n\n  async execute(steps) {\n    // 执行步骤序列\n  }\n\n  async review(results) {\n    // 审查执行结果\n  }\n}', '', 'contains', 'class WorkflowEngine', 'hard', 1)

    insertTask.run(4, 13, '多 Agent 通信模拟', '实现一个简单的多 Agent 消息传递系统，支持 Agent 之间的消息发送和接收。', 'class AgentMessageBus {\n  // TODO: 实现多 Agent 消息总线\n  \n  send(from, to, message) {\n    // 发送消息\n  }\n\n  receive(agentId) {\n    // 接收消息\n  }\n}', '', 'contains', 'class AgentMessageBus', 'hard', 1)

    insertTask.run(5, 15, 'RAG 检索器实现', '实现一个简单的向量检索器，支持文档添加和相似度搜索。', 'class VectorRetriever {\n  // TODO: 实现向量检索器\n  \n  addDocument(doc) {\n    // 添加文档\n  }\n\n  search(query, topK) {\n    // 搜索相似文档\n  }\n}', '', 'contains', 'class VectorRetriever', 'hard', 1)
  })

  seed()
}

export function getDatabase(): Database.Database {
  return db
}

export function closeDatabase(): void {
  if (db) db.close()
}