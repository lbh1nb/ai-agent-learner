/* electron/database.ts */
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

let db: Database.Database

// 错误日志：写入 userData 目录的 init-error.log，便于 release 版本排查问题
function logError(stage: string, err: unknown): void {
  const msg = err instanceof Error ? `${err.message}\n${err.stack || ''}` : String(err)
  const line = `[${new Date().toISOString()}] [${stage}] ${msg}\n`
  try {
    const logPath = path.join(app.getPath('userData'), 'init-error.log')
    fs.appendFileSync(logPath, line, 'utf-8')
  } catch { /* 日志写入失败时静默 */ }
}

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'ai-coding-learner.db')
  try {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    createTables()
    seedData()
    // 验证数据是否真的写入了
    const tableList = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]
    const courseCount = db.prepare('SELECT COUNT(*) as c FROM courses').get() as any
    const taskCount = db.prepare('SELECT COUNT(*) as c FROM tasks').get() as any
    // 记录成功日志（含验证结果）
    try {
      const logPath = path.join(app.getPath('userData'), 'init-error.log')
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] [init] DB OK at ${dbPath}\n  tables: ${JSON.stringify(tableList.map(t => t.name))}\n  courses: ${courseCount.c}, tasks: ${taskCount.c}\n`, 'utf-8')
    } catch { /* */ }
  } catch (err) {
    logError('initDatabase', err)
    throw err
  }
}

function createTables(): void {
  // 迁移：检查 tasks 表是否为旧结构（缺少 test_cases 列），如果是则删除以便重建
  try {
    const taskCols = db.prepare("PRAGMA table_info(tasks)").all() as any[]
    if (taskCols.length > 0 && !taskCols.some(c => c.name === 'test_cases')) {
      db.exec('DROP TABLE tasks')
    }
  } catch (_) { /* 表不存在，忽略 */ }

  // 迁移：检查 chapters 表是否为旧结构（缺少 resources 列），如果是则删除以便重建
  try {
    const chapterCols = db.prepare("PRAGMA table_info(chapters)").all() as any[]
    if (chapterCols.length > 0 && !chapterCols.some(c => c.name === 'resources')) {
      db.exec('DROP TABLE chapters')
    }
  } catch (_) { /* 表不存在，忽略 */ }

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
      resources TEXT,
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
      validation_type TEXT CHECK(validation_type IN ('exact','contains','regex','custom','tests')) DEFAULT 'contains',
      validation_value TEXT,
      difficulty TEXT CHECK(difficulty IN ('easy','medium','hard')) DEFAULT 'easy',
      sort_order INTEGER DEFAULT 0,
      steps TEXT,
      test_cases TEXT,
      function_name TEXT,
      hint TEXT,
      is_guided_project INTEGER DEFAULT 0
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

  // 为旧数据库添加 resources 列（如果不存在）
  try { db.exec(`ALTER TABLE chapters ADD COLUMN resources TEXT`) } catch (_) { /* 列已存在 */ }

  // 为旧数据库添加 LLM 配置列（如果不存在）
  const userCols = db.prepare("PRAGMA table_info(user_config)").all() as any[]
  if (!userCols.some(c => c.name === 'llm_api_key')) {
    try { db.exec(`ALTER TABLE user_config ADD COLUMN llm_api_key TEXT`) } catch (_) { /* */ }
  }
  if (!userCols.some(c => c.name === 'llm_base_url')) {
    try { db.exec(`ALTER TABLE user_config ADD COLUMN llm_base_url TEXT DEFAULT 'https://api.openai.com'`) } catch (_) { /* */ }
  }
  if (!userCols.some(c => c.name === 'llm_model')) {
    try { db.exec(`ALTER TABLE user_config ADD COLUMN llm_model TEXT DEFAULT 'gpt-3.5-turbo'`) } catch (_) { /* */ }
  }
}

function seedData(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number }
  if (count.count > 0) return

  const insertCourse = db.prepare(
    'INSERT INTO courses (id, title, category, difficulty, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertChapter = db.prepare(
    'INSERT INTO chapters (id, course_id, title, content, type, estimated_minutes, video_url, sort_order, resources) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertTask = db.prepare(
    'INSERT INTO tasks (id, chapter_id, title, description, initial_code, solution_code, validation_type, validation_value, difficulty, sort_order, steps, test_cases, function_name, hint, is_guided_project) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertUser = db.prepare(
    'INSERT INTO user_config (id, nickname, daily_goal_minutes) VALUES (1, ?, 30)'
  )

  const seed = db.transaction(() => {
    insertUser.run('学习者')

    // 课程 1: Agent 基础概念
    insertCourse.run(1, 'Agent 基础概念与架构', 'basics', 'beginner', '了解 AI Agent 的核心概念、组成部分和工作原理', 1)
    insertChapter.run(1, 1, '什么是 AI Agent', `# 什么是 AI Agent

AI Agent（人工智能智能体）是一种能够**感知环境、自主决策并执行行动**的系统。在 AI 编程领域，Agent 特指能够理解用户意图、自主规划任务、调用工具并生成代码的智能程序。

## 从传统程序到 Agent

传统程序按照预先编写好的指令执行，每一步都是确定的。而 Agent 则像人类工程师一样工作：拿到一个模糊的需求，先理解、再规划、然后执行、遇到问题会调整方案。

\`\`\`
传统程序：  输入 → 固定逻辑 → 输出
Agent：     输入 → 理解 → 规划 → 执行(可多步) → 检查 → 输出
                        ↑                     ↓
                        └───── 反馈调整 ←──────┘
\`\`\`

## Agent 的核心特征

### 1. 自主性（Autonomy）
Agent 能够独立做出决策，无需人类逐步指导。你给出"帮我修复登录bug"这样的模糊指令，Agent 会自己找到代码、分析问题、实施修复。

### 2. 感知能力（Perception）
Agent 能够理解上下文环境：
- 读取和理解代码文件
- 分析项目结构和依赖关系
- 理解错误日志和堆栈信息
- 感知用户的反馈和意图

### 3. 行动能力（Action）
Agent 可以实际操作环境：
- 执行代码和命令
- 读写文件系统
- 调用外部 API
- 修改代码和配置

### 4. 学习与适应
Agent 能从执行结果中学习：
- 记住之前成功的策略
- 避免重复犯过的错误
- 根据反馈调整后续行为

## Agent vs 传统 AI 助手

| 特性 | 传统 AI 助手（如 ChatGPT） | AI Agent（如 Cursor、Trae） |
|------|-------------|----------|
| 交互方式 | 单轮问答 | 多轮自主执行 |
| 任务范围 | 单一任务 | 复合任务链 |
| 工具使用 | 有限或无 | 丰富的工具集成 |
| 记忆能力 | 仅当前对话 | 有长期上下文记忆 |
| 执行能力 | 只能给建议 | 能直接修改文件、运行代码 |
| 错误处理 | 无 | 能识别错误并自我修正 |

## 真实案例对比

**任务**：项目里有个 API 返回 500 错误，需要修复。

**传统 AI 助手的回答**：
> 可能是服务器端代码有问题，建议检查后端日志，查看数据库连接是否正常...

**AI Agent 的执行过程**：
\`\`\`
1. [读取日志] → 定位到 src/api/user.ts 第 42 行报错
2. [读取文件] → 发现 SQL 查询缺少参数校验
3. [分析问题] → userId 为 undefined 时导致 SQL 异常
4. [修改代码] → 添加参数校验逻辑
5. [运行测试] → 执行 npm test 验证修复
6. [输出报告] → 修复完成，问题原因：...
\`\`\`

## Agent 的典型应用场景

- **代码开发**：自动生成、重构、修复代码
- **代码审查**：自动发现 bug、安全漏洞、代码异味
- **文档生成**：根据代码自动生成 API 文档
- **测试编写**：自动生成单元测试和集成测试
- **运维自动化**：监控、诊断、修复系统问题
- **数据分析**：自动查询、分析、可视化数据

## 关键概念小结

- Agent ≠ 聊天机器人，它能**实际执行**任务
- Agent 的核心是**自主规划 + 工具调用**
- Agent 能根据执行结果**自我修正**
- 现代 AI 编程工具（Cursor、Trae、Copilot）都在向 Agent 化发展

## 实践思考

想象你要开发一个"自动生成 API 文档"的 Agent，它需要哪些能力？
- 需要哪些工具？（文件读取、代码分析、文档模板...）
- 如何规划任务步骤？
- 如何保证生成文档的准确性？

> 推荐进一步阅读：[Anthropic - Building effective agents](https://www.anthropic.com/research/building-effective-agents)`, 'theory', 15, 'https://www.bilibili.com/video/BV1XiTkzVE4X/', 1, JSON.stringify([
    {title: 'Anthropic - Building effective agents', url: 'https://www.anthropic.com/research/building-effective-agents'},
    {title: 'Lilian Weng - LLM Powered Autonomous Agents', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/'},
    {title: 'OpenAI - Building agents with the OpenAI API', url: 'https://platform.openai.com/docs/guides/agents'},
    {title: 'LangChain - Agent 概念文档', url: 'https://python.langchain.com/docs/modules/agents/'}
  ]))

    insertChapter.run(2, 1, 'Agent 的核心架构', `# Agent 的核心架构

一个典型的 AI Agent 由四个核心模块组成：**大脑、记忆、工具、规划执行引擎**。它们协同工作，让 Agent 能像人类工程师一样处理复杂任务。

## 架构总览

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
\`\`\`

## 1. 大脑（LLM - 大语言模型）

LLM 是 Agent 的决策核心，负责理解、推理和规划。

**主流 LLM 对比**：
| 模型 | 厂商 | 特点 | 适用场景 |
|------|------|------|----------|
| GPT-4 / GPT-4o | OpenAI | 综合能力强 | 通用 Agent |
| Claude 3.5 Sonnet | Anthropic | 长文本理解强 | 代码 Agent |
| DeepSeek V3 | DeepSeek | 开源、性价比 | 国内场景 |
| Gemini 1.5 Pro | Google | 多模态 | 图文混合任务 |

**LLM 在 Agent 中的职责**：
- 理解用户意图（"修复登录bug" → 需要找代码、分析、修复）
- 规划任务步骤（分解为可执行的子任务）
- 决策调用哪个工具（需要读文件？执行命令？搜索代码？）
- 整合工具返回的结果
- 生成最终响应

## 2. 记忆系统（Memory）

记忆让 Agent 能"记住"过去的信息，而不是每次都从零开始。

### 三种记忆类型

**短期记忆（Short-term Memory）**
- 内容：当前对话的上下文
- 容量：有限（受 LLM 上下文窗口限制，如 8K-200K tokens）
- 生命周期：单次会话
- 示例：用户说"修复这个bug"，Agent 记住这个目标直到完成

**长期记忆（Long-term Memory）**
- 内容：历史对话、用户偏好、学到的知识
- 存储：向量数据库（如 Pinecone、ChromaDB）
- 生命周期：永久（跨会话）
- 示例：用户上次说"我用 React 18"，下次自动记住

**工作记忆（Working Memory）**
- 内容：当前任务的状态、中间结果
- 存储：内存中的数据结构
- 生命周期：任务执行期间
- 示例：任务步骤列表、已读取的文件内容、已执行的命令结果

### 记忆管理策略
\`\`\`typescript
class AgentMemory {
  private shortTerm: Message[] = []      // 最近对话
  private workingMemory: Map<string, any> // 任务状态
  private longTerm: VectorStore           // 向量数据库

  // 滑动窗口：保留最近 N 条消息
  addToShortTerm(msg: Message) {
    this.shortTerm.push(msg)
    if (this.shortTerm.length > 20) {
      this.shortTerm.shift()
    }
  }

  // 检索相关历史记忆
  recall(query: string): Memory[] {
    return this.longTerm.search(query, { topK: 5 })
  }
}
\`\`\`

## 3. 工具集（Tools）

工具是 Agent 与外部世界交互的接口。没有工具，Agent 只能"说"不能"做"。

### 常见工具类型
| 工具类别 | 示例 | 用途 |
|---------|------|------|
| 代码执行 | shell、node、python | 运行代码、执行命令 |
| 文件操作 | read_file、write_file | 读写项目文件 |
| 代码搜索 | grep、glob、ast_search | 在代码库中查找 |
| 网络请求 | http_get、api_call | 调用外部 API |
| 数据库 | sql_query | 查询数据库 |
| 版本控制 | git_status、git_diff | 管理 Git |

### 工具定义示例
\`\`\`typescript
const tools = [
  {
    name: "read_file",
    description: "读取指定路径的文件内容",
    parameters: {
      path: { type: "string", description: "文件路径" }
    }
  },
  {
    name: "search_code",
    description: "在代码库中搜索关键词",
    parameters: {
      query: { type: "string", description: "搜索关键词" },
      fileTypes: { type: "array", items: { type: "string" } }
    }
  }
]
\`\`\`

## 4. 规划与执行引擎（Planning & Execution）

这是 Agent 的"指挥官"，决定任务的执行顺序和方式。

### 任务分解示例
\`\`\`
用户需求："给我的项目添加单元测试"

Agent 规划：
├── 1. 分析项目结构
│   └── 调用 list_files("src/")
├── 2. 识别核心模块
│   └── 调用 read_file("src/utils.ts")
├── 3. 生成测试用例
│   └── 调用 write_file("tests/utils.test.ts", ...)
├── 4. 运行测试
│   └── 调用 run_command("npm test")
└── 5. 修复失败的测试
    └── 根据测试输出调整代码
\`\`\`

### 错误恢复机制
- **重试**：工具调用失败时重试
- **回退**：尝试替代方案（如 npm 失败用 yarn）
- **降级**：无法解决时向用户求助
- **记录**：把错误存入记忆避免重复

## 各模块协作流程

\`\`\`
1. 用户输入 → LLM 理解意图
2. LLM → 规划引擎：制定任务步骤
3. 规划引擎 → 工具：调用相应工具
4. 工具 → 工作记忆：保存中间结果
5. 工作记忆 → LLM：基于结果继续推理
6. 遇到错误 → 规划引擎调整方案
7. 任务完成 → LLM 生成最终报告
8. 清理工作记忆，重要信息存入长期记忆
\`\`\`

## 小结

- **大脑（LLM）**：理解、推理、决策
- **记忆**：让 Agent 有"经验"
- **工具**：让 Agent 能"行动"
- **规划引擎**：让 Agent 会"思考"

这四个模块缺一不可，共同构成了一个完整的 AI Agent。

> 推荐阅读：[Lilian Weng - LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/)`, 'theory', 15, 'https://www.bilibili.com/video/BV1XiTkzVE4X/?p=2', 2, JSON.stringify([
    {title: 'Lilian Weng - LLM Powered Autonomous Agents', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/'},
    {title: 'LangChain - Agent 架构', url: 'https://python.langchain.com/docs/modules/agents/concepts/'},
    {title: 'AutoGen - 多Agent框架', url: 'https://microsoft.github.io/autogen/'},
    {title: 'CrewAI - Agent 协作框架', url: 'https://docs.crewai.com/'}
  ]))

    insertChapter.run(3, 1, '构建你的第一个 Agent', `# 构建你的第一个 Agent

让我们通过一个完整的示例，理解 Agent 是如何工作的。我们将构建一个"代码审查 Agent"，它能读取代码、分析问题、给出改进建议。

## 场景：代码审查 Agent

假设我们要构建一个自动审查代码的 Agent，它需要：
1. 读取用户指定的代码文件
2. 分析代码质量（命名、结构、潜在 bug）
3. 提出改进建议
4. 生成结构化的审查报告

## 第一步：定义工具

工具是 Agent 的"手"，让 Agent 能与外界交互。

\`\`\`typescript
// 定义 Agent 可用的工具
const tools = [
  {
    name: "read_file",
    description: "读取指定路径的文件内容",
    parameters: {
      path: { type: "string", description: "文件路径，如 src/utils.ts" }
    }
  },
  {
    name: "search_pattern",
    description: "在文件中搜索代码模式",
    parameters: {
      pattern: { type: "string", description: "正则表达式" },
      path: { type: "string", description: "搜索范围" }
    }
  }
]
\`\`\`

## 第二步：定义系统 Prompt

系统 Prompt 告诉 Agent 它的角色和行为规范。

\`\`\`typescript
const systemPrompt = \\\`你是一个专业的代码审查 Agent。

你的职责：
1. 读取用户指定的代码文件
2. 从以下维度分析代码：
   - 命名规范（变量、函数、类）
   - 代码结构（职责单一、可复用性）
   - 潜在 Bug（空指针、类型错误、异常处理）
   - 性能问题（不必要的循环、内存泄漏）
   - 安全隐患（注入、XSS、敏感信息）

输出格式：
## 审查报告
- 文件：xxx
- 总体评分：x/10
- 问题列表：...
- 改进建议：...\\\`
\`\`\`

## 第三步：Agent 的思考过程

当用户说"请审查 src/utils.ts"时，Agent 的内部流程：

\`\`\`
用户: 请审查 src/utils.ts 文件

Agent 思考过程：
[1] 理解意图 → 用户要审查代码文件
[2] 规划步骤 → 需要先读取文件，再分析，最后生成报告
[3] 调用工具 → read_file("src/utils.ts")
[4] 获得结果 → 文件内容：
    export function getUser(id) {
      return db.query('SELECT * FROM users WHERE id=' + id)
    }

[5] 分析问题：
    - 安全：SQL 注入风险（字符串拼接）
    - 类型：缺少 TypeScript 类型
    - 命名：函数名不够具体
    - 错误处理：没有 try-catch

[6] 生成报告：
    ## 审查报告
    - 文件：src/utils.ts
    - 总体评分：4/10
    - 问题：
      1. [严重] SQL 注入：使用参数化查询
      2. [中等] 缺少类型定义
      3. [轻微] 函数名改为 getUserById
    - 改进建议：
      export async function getUserById(id: number): Promise<User> {
        return await db.query('SELECT * FROM users WHERE id = ?', [id])
      }
\`\`\`

## 第四步：实现 Agent 主循环

\`\`\`typescript
class CodeReviewAgent {
  async run(userInput: string) {
    // 1. 理解用户意图
    const plan = await this.llm.plan(userInput)
    // plan = { steps: ["read_file", "analyze", "report"] }

    // 2. 执行每一步
    for (const step of plan.steps) {
      if (step === "read_file") {
        const filePath = await this.llm.extractFilePath(userInput)
        const content = await this.tools.readFile(filePath)
        this.memory.set("fileContent", content)
      }
      if (step === "analyze") {
        const analysis = await this.llm.analyze(this.memory.get("fileContent"))
        this.memory.set("analysis", analysis)
      }
      if (step === "report") {
        const report = await this.llm.generateReport(this.memory.get("analysis"))
        return report
      }
    }
  }
}
\`\`\`

## Agent 的核心特征回顾

从这个例子可以看到 Agent 的几个关键特征：

### 1. 分步执行
Agent 不是一次性给出答案，而是分步执行：
\`\`\`
读文件 → 分析 → 生成报告
\`\`\`

### 2. 工具调用
每个步骤可能调用不同的工具：
\`\`\`
read_file() → 拿到文件内容
llm.analyze() → AI 分析
llm.generateReport() → 生成报告
\`\`\`

### 3. 状态管理
Agent 在步骤间维护状态（工作记忆）：
\`\`\`
memory.set("fileContent", content)  // 第1步存
memory.get("fileContent")           // 第2步取
\`\`\`

### 4. 自适应
Agent 会根据中间结果调整后续步骤。比如读到的文件是空的，Agent 会告诉用户而不是继续分析。

## ReAct 模式（推理+行动）

这是 Agent 最经典的运行模式：

\`\`\`
Thought: 我需要读取 src/utils.ts 文件
Action: read_file("src/utils.ts")
Observation: 文件内容是 ...

Thought: 我发现 SQL 拼接的安全问题
Action: search_pattern("SELECT.*\\\\+", "src/")
Observation: 找到 3 处类似代码

Thought: 现在可以生成审查报告了
Action: generate_report(...)
Observation: 报告已生成
\`\`\`

每一步都是"思考 → 行动 → 观察"的循环。

## 关键要点

- Agent = LLM + 工具 + 规划 + 记忆
- Agent 通过**多步执行**完成任务，不是一次性输出
- 每一步可以调用**不同的工具**
- Agent 会根据**中间结果**调整后续步骤
- 良好的 **Prompt 设计** 是 Agent 效果的关键
- ReAct 模式（思考-行动-观察）是最经典的 Agent 运行模式

## 动手实践

试试在实操练习中构建一个简单的 Agent 指令。想一想：
- 你的 Agent 要解决什么问题？
- 它需要哪些工具？
- 它的思考流程是怎样的？

> 推荐阅读：[OpenAI - Building agents with the OpenAI API](https://platform.openai.com/docs/guides/agents)`, 'theory', 15, 'https://www.bilibili.com/video/BV1XiTkzVE4X/?p=3', 3, JSON.stringify([
    {title: 'OpenAI - Building agents with the OpenAI API', url: 'https://platform.openai.com/docs/guides/agents'},
    {title: 'LangChain - 快速开始', url: 'https://python.langchain.com/docs/get_started/quickstart'},
    {title: 'Anthropic - Tool use guide', url: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use'},
    {title: 'Smolagents - 极简Agent框架', url: 'https://github.com/huggingface/smolagents'}
  ]))

    // 课程 2: Prompt Engineering
    insertCourse.run(2, 'Prompt Engineering 进阶', 'basics', 'beginner', '掌握编写高质量 Prompt 的技巧，让 Agent 更精准地理解你的意图', 2)
    insertChapter.run(4, 2, 'Prompt 基础原则', `# Prompt 基础原则

Prompt（提示词）是你与 AI Agent 沟通的桥梁。同样的 AI 模型，不同的 Prompt 能产生天差地别的效果。掌握 Prompt 编写技巧是用好 Agent 的第一步。

## 为什么 Prompt 如此重要

AI Agent 的能力是固定的，但 Prompt 决定了它**如何使用**这些能力。

\`\`\`
糟糕的 Prompt → AI 不知道要做什么 → 输出模糊、不实用
优秀的 Prompt → AI 准确理解需求 → 输出精准、可直接使用
\`\`\`

类比：就像给实习生安排任务。说"做个功能"，他可能做出你完全不想要的东西；说"用 React 写一个登录表单，包含邮箱密码字段，有表单校验，提交后调用 /api/login"，他才能做出你要的东西。

## 核心原则

### 1. 明确具体（Specificity）

\`\`\`
❌ 差: "写个函数"
✅ 好: "写一个 TypeScript 函数，接收用户 ID 数组，返回对应的用户名称列表，
      需要处理空数组和无效 ID 的情况"
\`\`\`

**差的 Prompt** 的问题：
- 不知道用什么语言
- 不知道输入输出格式
- 不知道异常情况怎么处理

**好的 Prompt** 包含：
- 语言：TypeScript
- 输入：用户 ID 数组
- 输出：用户名称列表
- 边界条件：空数组、无效 ID

### 2. 提供上下文（Context）

\`\`\`
❌ 差: "修复这个 bug"
✅ 好: "在 src/auth.ts 第 42 行，登录函数在 token 过期时
      没有正确处理 401 错误，请使用 refresh_token 刷新，
      刷新失败则跳转登录页"
\`\`\`

上下文包括：
- **文件位置**：哪个文件、哪一行
- **问题描述**：什么现象、预期是什么
- **相关代码**：函数签名、调用关系
- **技术栈**：使用的框架、库版本

### 3. 指定格式（Format）

\`\`\`
❌ 差: "解释这段代码"
✅ 好: "用三点列表解释这段代码的核心逻辑，每点不超过两句话，
      最后用一句话总结它的用途"
\`\`\`

常见的格式要求：
- 列表/段落/表格
- 字数限制
- 代码 + 注释的形式
- Markdown 格式

### 4. 分步引导（Step by Step）

\`\`\`
❌ 差: "帮我重构整个项目"
✅ 好: "先分析 src/ 目录结构，找出重复代码，
      列出可重构的点，等我确认后再逐步重构，
      每步确认后再继续下一步"
\`\`\`

分步引导的好处：
- 避免 Agent 一次改动太多导致失控
- 可以在中间环节纠正方向
- 更容易定位问题

## 完整 Prompt 的结构

一个完整的 Prompt 通常包含以下部分：

\`\`\`
[角色设定]
你是一个资深的 TypeScript 开发者。

[任务描述]
请实现一个用户认证模块。

[具体要求]
1. 支持邮箱密码登录
2. 密码使用 bcrypt 加密
3. 登录成功返回 JWT token
4. token 有效期 7 天

[输入格式]
- email: string
- password: string

[输出格式]
返回 { token: string, user: UserInfo }

[约束条件]
- 使用 Express.js
- TypeScript 严格模式
- 包含错误处理
\`\`\`

## 实战对比

### 案例一：生成 API 接口

\`\`\`
❌ 差: "写个用户查询接口"

✅ 好: "用 Express + TypeScript 写一个 GET /api/users/:id 接口：
- 从 MySQL 数据库查询用户信息
- 用户不存在返回 404
- 数据库错误返回 500
- 返回格式：{ id, name, email, createdAt }
- 添加请求日志中间件"
\`\`\`

### 案例二：修复 Bug

\`\`\`
❌ 差: "登录页面有 bug，帮我修一下"

✅ 好: "登录页面 src/pages/Login.tsx 的 handleSubmit 函数中，
当 API 返回 401 时没有给用户提示，直接跳转了。
请添加错误提示：用户名密码错误时显示红色警告，
网络错误时显示'网络异常请重试'。
使用 antd 的 message 组件提示。"
\`\`\`

### 案例三：代码重构

\`\`\`
❌ 差: "重构这个组件"

✅ 好: "重构 src/components/UserList.tsx：
1. 把列表项抽取为独立组件 UserItem
2. 把数据获取逻辑抽到 useUsers hook
3. 添加加载状态和错误状态处理
4. 保持现有功能不变
5. 先列出重构计划，我确认后再执行"
\`\`\`

## 常见错误

| 错误 | 示例 | 改进 |
|------|------|------|
| 太模糊 | "优化一下" | "把首屏加载从 3s 优化到 1s 以内" |
| 太宽泛 | "写个网站" | "用 Next.js 写一个博客首页，展示文章列表" |
| 缺约束 | "写排序算法" | "用 TypeScript 写快速排序，处理空数组和重复元素" |
| 一次太多 | "重构整个项目+加测试+写文档" | 拆分成多个小任务，逐步进行 |

## 小结

写好 Prompt 的关键是**像给实习生安排任务一样**：
1. **明确**：说清楚要做什么
2. **具体**：给出技术细节、输入输出
3. **有上下文**：告知背景、约束
4. **分步骤**：复杂任务要分解
5. **有示例**：必要时给出参考格式

> 推荐阅读：[OpenAI - Prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering)`, 'theory', 15, 'https://www.bilibili.com/video/BV1Z7ZwYHENT/', 1, JSON.stringify([
    {title: 'OpenAI - Prompt engineering guide', url: 'https://platform.openai.com/docs/guides/prompt-engineering'},
    {title: 'Prompt Engineering Guide (中文)', url: 'https://www.promptingguide.ai/zh'},
    {title: 'Anthropic - Prompt engineering overview', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview'},
    {title: 'Learn Prompting (免费课程)', url: 'https://learnprompting.org/zh-Hans/'}
  ]))

    insertChapter.run(5, 2, '高级 Prompt 技巧', `# 高级 Prompt 技巧

掌握了基础原则后，我们来学习让 Prompt 更强大的进阶技巧。这些技巧能让 Agent 处理更复杂的任务，输出更高质量的结果。

## 1. Chain of Thought（思维链）

让 Agent 在给出答案前**展示推理过程**，避免直接跳到结论。这对复杂问题特别有效。

### 普通提问 vs 思维链

\`\`\`
❌ 普通: "用户反馈登录失败，可能是什么原因？"
→ Agent 直接列出一堆可能原因，泛泛而谈

✅ 思维链: "用户反馈登录失败，请逐步分析：
1. 先理解问题现象（登录失败的具体表现）
2. 列出可能的原因层级（前端→网络→后端→数据库）
3. 对每个原因给出排查方法
4. 给出最可能的 3 个原因和修复建议"
→ Agent 给出结构化、有逻辑的排查方案
\`\`\`

### 思维链的神奇效果

\`\`\`
任务：判断代码是否有 bug

普通 Prompt:
"这段代码有 bug 吗？"
→ Agent 可能直接说"没有"（因为表面上看起来正常）

思维链 Prompt:
"请逐步分析这段代码：
1. 先理解代码意图
2. 逐行检查逻辑
3. 考虑边界情况
4. 最后给出结论"
→ Agent 会发现 "i < arr.length" 应该是 "i <= arr.length" 这样的细节bug
\`\`\`

### 经典句式

- "Let's think step by step"（让我们一步步思考）
- "请先分析，再给出答案"
- "请展示你的推理过程"

## 2. Few-Shot Prompting（少样本提示）

通过**给出示例**来教 Agent 你想要的输出格式和行为。

### 示例：生成 Git 提交信息

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

示例3:
改动: 优化数据库查询性能，添加索引
类型: perf
描述: 为 users 表的 email 字段添加索引，查询速度提升 80%

现在请为以下改动生成提交信息：
改动: 重构用户认证模块
\`\`\`

### Few-Shot 的关键

- **示例要典型**：覆盖常见情况
- **格式要统一**：Agent 会模仿你的格式
- **3-5 个示例最佳**：太少学不会，太多浪费 token

## 3. Role Prompting（角色设定）

为 Agent 设定一个**专业角色**，它会以该角色的专业水平回答。

### 常见角色设定

\`\`\`
"你是一位资深前端架构师，专注于 React 和 TypeScript。
有 10 年经验，擅长性能优化和组件设计。"

"你是一位安全工程师，专注于 Web 安全，
熟悉 OWASP Top 10，擅长渗透测试和代码审计。"

"你是一位 Code Review 专家，
审查严格但友好，关注代码质量、可维护性、安全性。"
\`\`\`

### 角色设定的效果对比

\`\`\`
无角色: "审查这段代码"
→ 简单指出几个问题

有角色: "你是安全工程师，请审查这段代码的安全隐患"
→ 深入分析 SQL 注入、XSS、CSRF、权限绕过等安全问题
\`\`\`

## 4. Self-Consistency（自洽性）

让 Agent **生成多个答案**，然后选择最一致的结果。

\`\`\`
请用 3 种不同的方法解决这个问题，
然后比较 3 种方法的结果，
选择最可靠的方案并解释原因。
\`\`\`

## 5. 分解任务（Decomposition）

把复杂任务**拆解成多个小任务**，逐个解决。

\`\`\`
任务: 重构一个 1000 行的 UserService 类

分解:
1. 先分析类的职责，列出所有方法
2. 按职责分组（认证、查询、修改、删除）
3. 为每个职责创建独立类
4. 提取公共逻辑到工具类
5. 更新调用方代码
6. 运行测试验证

请一步一步执行，每步完成后等我确认。
\`\`\`

## 6. 约束与负面提示

明确告诉 Agent **不要做什么**，避免常见错误。

\`\`\`
请实现一个 React 组件，要求：
✅ 必须使用 TypeScript
✅ 必须处理加载和错误状态
✅ 必须添加 JSDoc 注释

❌ 不要使用 any 类型
❌ 不要使用内联样式
❌ 不要在组件内直接调用 fetch（用 props 传入的 fetcher）
❌ 不要超过 100 行
\`\`\`

## 7. 结构化输出

要求 Agent 输出**结构化格式**（JSON、表格），方便程序处理。

\`\`\`
请分析以下代码的问题，以 JSON 格式输出：
{
  "issues": [
    {
      "type": "security" | "performance" | "style",
      "severity": "high" | "medium" | "low",
      "line": 42,
      "description": "问题描述",
      "suggestion": "修复建议"
    }
  ],
  "score": 8,
  "summary": "总体评价"
}
\`\`\`

## 实战：组合使用多种技巧

\`\`\`
[角色] 你是一位资深的安全工程师

[任务] 审查以下代码的安全问题

[思维链] 请逐步分析：
1. 识别输入点
2. 检查输入校验
3. 分析数据流向
4. 评估潜在风险

[Few-Shot] 参考以下问题分类：
- 示例1: SQL 拼接 → SQL 注入
- 示例2: 未转义输出 → XSS
- 示例3: 明文存储密码 → 凭证泄露

[约束] 只报告真实问题，不要臆测

[输出] JSON 格式
\`\`\`

## 小结

| 技巧 | 适用场景 | 效果 |
|------|---------|------|
| 思维链 | 复杂推理问题 | 提高准确率 |
| Few-Shot | 需要特定格式 | 统一输出 |
| 角色设定 | 需要专业视角 | 提升专业度 |
| 自洽性 | 需要高可靠性 | 减少错误 |
| 分解任务 | 复杂大任务 | 提高可控性 |
| 约束提示 | 避免特定错误 | 减少返工 |
| 结构化输出 | 程序处理 | 方便集成 |

> 推荐阅读：[Prompt Engineering Guide - 高级技巧](https://www.promptingguide.ai/zh/techniques/cot)`, 'theory', 15, 'https://www.bilibili.com/video/BV1Z7ZwYHENT/?p=2', 2, JSON.stringify([
    {title: 'Prompt Engineering Guide - 思维链', url: 'https://www.promptingguide.ai/zh/techniques/cot'},
    {title: 'Prompt Engineering Guide - Few-Shot', url: 'https://www.promptingguide.ai/zh/techniques/fewshot'},
    {title: 'LangChain - Prompt 模板', url: 'https://python.langchain.com/docs/modules/model_io/prompts/'},
    {title: 'DeepSeek - Prompt 最佳实践', url: 'https://api-docs.deepseek.com/zh-cn/guides/prompt'}
  ]))

    insertChapter.run(6, 2, 'Prompt 实战练习', `# Prompt 实战练习

理论知识学完了，现在该动手实践了。本章将通过几个具体的练习任务，帮助你把前面学到的 Prompt 技巧应用到实际场景中。

## 练习目标

通过本章练习，你将能够：
1. 编写出明确、具体、有上下文的 Prompt
2. 运用思维链、Few-Shot、角色设定等高级技巧
3. 针对不同任务选择合适的 Prompt 策略
4. 评估和优化 Prompt 的效果

## 练习 1：编写功能实现 Prompt

**任务背景**：你需要让 Agent 帮你实现一个用户注册功能。

**练习要求**：
请编写一个完整的 Prompt，让 Agent 实现以下功能：
- 邮箱密码注册
- 密码强度校验（至少 8 位，包含字母数字）
- 邮箱格式校验
- 密码加密存储（bcrypt）
- 注册成功后发送欢迎邮件

**参考答案结构**：
\`\`\`
[角色设定]
你是一位资深 Node.js 后端工程师

[任务描述]
实现用户注册 API

[具体要求]
1. POST /api/register 接口
2. 使用 Express + TypeScript
3. 密码校验：至少8位，含字母和数字
4. 邮箱校验：标准邮箱格式
5. 密码加密：bcrypt，salt rounds = 10
6. 发送邮件：使用 nodemailer

[输入格式]
{ email: string, password: string }

[输出格式]
成功：{ code: 0, message: "注册成功" }
失败：{ code: 1, message: "邮箱已存在" | "密码强度不够" | ... }

[约束]
- 必须有错误处理
- 必须有日志
- 不要使用 any 类型
\`\`\`

## 练习 2：编写 Bug 修复 Prompt

**任务背景**：用户反馈购物车数量不能正确更新。

**练习要求**：
编写一个 Prompt，让 Agent 高效地定位并修复这个 bug。

**关键要素**：
- 提供文件位置
- 描述问题现象
- 提供相关代码片段
- 指定期望的排查方式（思维链）
- 要求输出修复方案

**示例 Prompt**：
\`\`\`
[问题描述]
购物车页面 src/pages/Cart.tsx 的 updateQuantity 函数有 bug：
当用户快速点击 + 按钮时，数量会跳变（如从 1 直接到 3）。

[相关代码]
const updateQuantity = (id: string, delta: number) => {
  setItems(prev => prev.map(item =>
    item.id === id ? { ...item, quantity: item.quantity + delta } : item
  ))
}

[排查要求] 请逐步分析：
1. 分析问题原因（可能是异步更新导致的状态覆盖）
2. 提出至少 2 种解决方案
3. 选择最优方案并实现
4. 说明修复原理

[约束]
- 保持函数签名不变
- 添加防抖或函数式更新
\`\`\`

## 练习 3：编写代码审查 Prompt

**任务背景**：你作为 Tech Lead，需要审查团队成员提交的代码。

**练习要求**：
编写一个 Prompt，让 Agent 扮演代码审查专家，从多个维度审查代码。

**参考结构**：
\`\`\`
[角色]
你是资深代码审查专家，审查严格但友好

[审查维度]
1. 功能正确性：逻辑是否正确，边界条件是否处理
2. 代码质量：命名、结构、可读性
3. 性能：是否有性能问题
4. 安全：是否有安全漏洞
5. 可维护性：是否易于理解和扩展

[输出格式]
## 代码审查报告
### 总体评分：x/10
### 优点：
1. ...
### 问题：
| 严重度 | 位置 | 问题 | 建议 |
|--------|------|------|------|
| 高 | line 42 | SQL 拼接 | 改用参数化查询 |
### 改进建议：
1. ...
\`\`\`

## 练习 4：编写重构 Prompt

**任务背景**：有一个 500 行的 UserService 类需要重构。

**练习要求**：
编写一个 Prompt，让 Agent 分步骤完成重构。

**关键技巧**：
- 使用**分解任务**技巧
- 每一步要求确认
- 明确重构目标
- 保持功能不变

**示例结构**：
\`\`\`
[任务]
重构 src/services/UserService.ts（500 行）

[目标]
1. 拆分为多个职责单一的类
2. 提取公共逻辑
3. 提高可测试性

[执行步骤]
请按以下顺序执行，每步完成后等我确认：
Step 1: 分析现有代码，列出所有方法和职责
Step 2: 提出重构方案（哪些方法该分到哪个类）
Step 3: 创建新的类文件
Step 4: 迁移代码
Step 5: 更新调用方
Step 6: 运行测试验证

[约束]
- 保持公开 API 不变
- 每个新类不超过 200 行
- 必须有单元测试
\`\`\`

## 练习 5：编写文档生成 Prompt

**任务背景**：项目缺少 API 文档，需要自动生成。

**练习要求**：
编写一个 Prompt，让 Agent 读取代码并生成规范的 API 文档。

**提示**：
- 使用 Few-Shot 给出文档格式示例
- 指定输出为 Markdown
- 要求包含请求/响应示例
- 要求标注必填字段

## 评估标准

你的 Prompt 应该满足：
- [ ] 明确具体：任务描述清晰
- [ ] 有上下文：提供必要背景
- [ ] 有约束：限定范围和规范
- [ ] 有格式：指定输出格式
- [ ] 可验证：有明确的验收标准

## 常见误区

1. **一次要求太多**：不要在一个 Prompt 里塞入太多任务
2. **缺少验收标准**：Agent 不知道什么叫"完成"
3. **过于限制**：约束太死会限制 Agent 的创造力
4. **没有示例**：对于复杂输出，Few-Shot 比文字描述更有效

## 动手实践

请在实操练习区尝试以下任务：
1. 编写一个"生成单元测试"的 Prompt
2. 编写一个"代码优化"的 Prompt
3. 编写一个"技术方案设计"的 Prompt

实践时注意观察：什么样的 Prompt 能让 Agent 输出更好的结果？

> 推荐阅读：[Anthropic - Prompt engineering with Claude](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)`, 'practice', 20, 'https://www.bilibili.com/video/BV1Z7ZwYHENT/?p=3', 3, JSON.stringify([
    {title: 'Prompt Engineering Guide - 实例', url: 'https://www.promptingguide.ai/zh/examples'},
    {title: 'Anthropic - Prompt engineering with Claude', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview'},
    {title: 'OpenAI - Cookbook prompts', url: 'https://cookbook.openai.com/articles/related_resources'},
    {title: 'LangChain - Prompt hub', url: 'https://smith.langchain.com/hub'}
  ]))

    // 课程 3: Tool Calling
    insertCourse.run(3, 'Tool Calling 与 Function Calling', 'agent', 'intermediate', '深入理解 Agent 如何调用工具，掌握 Function Calling 的核心机制', 3)
    insertChapter.run(7, 3, 'Tool Calling 概述', `# Tool Calling 概述

Tool Calling（工具调用）是 Agent 与外部世界交互的核心机制。没有工具，Agent 只能"说"不能"做"；有了工具，Agent 就能读写文件、执行代码、调用 API，真正"动手"完成任务。

## 为什么需要 Tool Calling

LLM 本身只能生成文本，它**没有能力**：
- 读取你的项目文件
- 执行代码查看运行结果
- 调用外部 API 获取数据
- 修改系统配置

Tool Calling 就是解决这个问题的桥梁。

\`\`\`
没有 Tool Calling:
用户: "帮我看看 src/index.ts 有没有 bug"
Agent: "请把代码贴给我，我帮你看看" (无法自己读文件)

有 Tool Calling:
用户: "帮我看看 src/index.ts 有没有 bug"
Agent: [调用 read_file("src/index.ts")] → 拿到内容 → 分析 → 发现bug
\`\`\`

## 工具的三大类型

### 1. 信息获取类
\`\`\`
- read_file: 读取文件内容
- search_code: 在代码库搜索
- list_files: 列出目录文件
- web_search: 搜索网络
- api_call: 调用外部 API
\`\`\`

### 2. 操作执行类
\`\`\`
- write_file: 写入文件
- run_command: 执行命令
- git_commit: Git 提交
- install_package: 安装依赖
\`\`\`

### 3. 数据处理类
\`\`\`
- parse_json: 解析 JSON
- transform_data: 数据转换
- query_database: 查询数据库
\`\`\`

## 工具定义结构

每个工具都需要明确定义名称、描述和参数：

\`\`\`typescript
const tool = {
  name: "read_file",
  description: "读取指定路径的文件内容。支持文本文件，二进制文件返回 base64。",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "文件路径，相对于项目根目录，如 src/utils.ts"
      },
      encoding: {
        type: "string",
        enum: ["utf-8", "base64"],
        description: "文件编码，默认 utf-8"
      }
    },
    required: ["path"]
  }
}
\`\`\`

**好工具的定义原则**：
- **name**：动词_名词，见名知意（read_file、search_code）
- **description**：说清楚做什么、什么时候用
- **parameters**：类型明确、描述详细、标明必填

## Tool Calling 工作流程

\`\`\`
1. 用户请求
   "帮我看下 package.json 用了哪些依赖"

2. Agent (LLM) 分析
   "我需要读取 package.json 文件"

3. Agent 选择工具
   选择: read_file
   参数: { path: "package.json" }

4. 执行工具
   read_file("package.json") → 返回文件内容

5. Agent 处理结果
   "分析依赖列表，整理给用户"

6. Agent 返回响应
   "你的项目有以下依赖：react, vue, express..."
\`\`\`

## 完整调用示例

\`\`\`typescript
// 1. 定义工具
const tools = [
  {
    name: "read_file",
    description: "读取文件内容",
    parameters: { path: { type: "string" } }
  },
  {
    name: "run_command",
    description: "执行 shell 命令",
    parameters: { command: { type: "string" } }
  }
]

// 2. 用户消息
const messages = [
  { role: "user", content: "运行 npm test 看看测试结果" }
]

// 3. 调用 LLM
const response = await llm.chat({ messages, tools })

// 4. LLM 决定调用工具
// response.tool_calls = [{
//   id: "call_xxx",
//   name: "run_command",
//   arguments: { command: "npm test" }
// }]

// 5. 执行工具
const result = await executeTool(response.tool_calls[0])
// result = "All 10 tests passed"

// 6. 把结果返回给 LLM
messages.push({
  role: "tool",
  tool_call_id: "call_xxx",
  content: result
})

// 7. LLM 生成最终回复
const finalResponse = await llm.chat({ messages, tools })
// "测试全部通过，共 10 个测试用例"
\`\`\`

## Function Calling vs Tool Calling

这两个词经常混用，但有细微差别：

| 概念 | 含义 | 起源 |
|------|------|------|
| Function Calling | OpenAI 早期术语，特指调用预定义函数 | OpenAI |
| Tool Calling | 更通用的术语，包括函数、API、服务等 | 通用 |

现在主流趋势用 **Tool Calling**，因为它更准确——工具不只是函数，还可以是 API、服务、甚至其他 Agent。

## 主流模型的 Tool Calling 支持

| 模型 | 支持情况 | 特点 |
|------|---------|------|
| GPT-4 / GPT-4o | ✅ 原生支持 | 并行调用多个工具 |
| Claude 3.5 | ✅ 原生支持 | 工具调用稳定 |
| DeepSeek V3 | ✅ 支持 | 兼容 OpenAI 格式 |
| Gemini 1.5 | ✅ 支持 | 支持 Google 生态工具 |

## 关键要点

- Tool Calling 让 Agent 从"只能说"变成"能动手"
- 工具要定义清楚 name、description、parameters
- 工作流程：用户请求 → LLM 选择工具 → 执行 → 返回结果 → LLM 生成回复
- 现代 LLM 都原生支持 Tool Calling
- 好的工具描述能大幅提升调用准确率

> 推荐阅读：[OpenAI - Function calling guide](https://platform.openai.com/docs/guides/function-calling)`, 'theory', 15, 'https://www.bilibili.com/video/BV1z95LzaE39/', 1, JSON.stringify([
    {title: 'OpenAI - Function calling guide', url: 'https://platform.openai.com/docs/guides/function-calling'},
    {title: 'LangChain - Tools and ToolCalling', url: 'https://python.langchain.com/docs/modules/agents/tools/'},
    {title: 'Anthropic - Tool use guide', url: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use'},
    {title: 'MCP - Model Context Protocol', url: 'https://modelcontextprotocol.io/'}
  ]))

    insertChapter.run(8, 3, '实现 Tool Calling', `# 实现 Tool Calling

理解了原理，现在我们动手实现一个完整的 Tool Calling 系统。本章将从工具注册、执行到与 LLM 集成，构建一个可运行的 Agent 工具系统。

## 架构总览

\`\`\`
┌─────────────────────────────────────┐
│          Agent 主循环               │
│  ┌──────────────────────────────┐  │
│  │      LLM 决策层              │  │
│  │  分析用户意图 → 选择工具      │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────┴───────────────────┐  │
│  │     工具注册表 (Registry)     │  │
│  │  read_file | write_file | ... │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────┴───────────────────┐  │
│  │      工具执行器              │  │
│  │  执行工具 → 返回结果          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
\`\`\`

## 第一步：定义工具接口

\`\`\`typescript
// 工具的基础接口
interface Tool {
  name: string
  description: string
  parameters: JSONSchema  // 参数的 JSON Schema
  handler: (params: any) => Promise<string>
}

// JSON Schema 示例
type JSONSchema = {
  type: "object"
  properties: Record<string, {
    type: "string" | "number" | "boolean" | "array"
    description: string
    enum?: any[]
  }>
  required: string[]
}
\`\`\`

## 第二步：工具注册表

工具注册表负责管理所有可用工具，是 Agent 的"工具箱"。

\`\`\`typescript
class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  // 注册工具
  register(tool: Tool) {
    if (this.tools.has(tool.name)) {
      throw new Error(\`Tool \${tool.name} already registered\`)
    }
    this.tools.set(tool.name, tool)
  }

  // 执行工具
  async execute(name: string, params: any): Promise<string> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(\`Unknown tool: \${name}\`)
    }

    // 参数校验
    this.validateParams(params, tool.parameters)

    try {
      const result = await tool.handler(params)
      return result
    } catch (error) {
      return \`Error executing \${name}: \${error.message}\`
    }
  }

  // 获取所有工具定义（给 LLM 用）
  getDefinitions() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }))
  }

  private validateParams(params: any, schema: JSONSchema) {
    for (const requiredField of schema.required) {
      if (!(requiredField in params)) {
        throw new Error(\`Missing required parameter: \${requiredField}\`)
      }
    }
  }
}
\`\`\`

## 第三步：实现具体工具

\`\`\`typescript
// 读取文件工具
const readFileTool: Tool = {
  name: "read_file",
  description: "读取指定路径的文件内容",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "文件路径，如 src/index.ts"
      }
    },
    required: ["path"]
  },
  handler: async (params) => {
    const fs = await import('fs/promises')
    const content = await fs.readFile(params.path, 'utf-8')
    return content
  }
}

// 执行命令工具
const runCommandTool: Tool = {
  name: "run_command",
  description: "执行 shell 命令并返回输出",
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "要执行的命令，如 npm test"
      }
    },
    required: ["command"]
  },
  handler: async (params) => {
    const { exec } = await import('child_process')
    return new Promise((resolve) => {
      exec(params.command, (error, stdout, stderr) => {
        if (error) {
          resolve(\`Error: \${error.message}\\n\${stderr}\`)
        } else {
          resolve(stdout)
        }
      })
    })
  }
}

// 搜索代码工具
const searchCodeTool: Tool = {
  name: "search_code",
  description: "在项目代码中搜索关键词",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "搜索关键词" },
      glob: { type: "string", description: "文件类型，如 *.ts" }
    },
    required: ["query"]
  },
  handler: async (params) => {
    // 实现搜索逻辑
    const result = await searchInFiles(params.query, params.glob)
    return JSON.stringify(result)
  }
}
\`\`\`

## 第四步：注册工具

\`\`\`typescript
const registry = new ToolRegistry()

registry.register(readFileTool)
registry.register(runCommandTool)
registry.register(searchCodeTool)
\`\`\`

## 第五步：Agent 主循环

\`\`\`typescript
class Agent {
  constructor(
    private llm: LLMClient,
    private registry: ToolRegistry
  ) {}

  async run(userInput: string): Promise<string> {
    const messages = [
      { role: "system", content: "你是一个编程助手" },
      { role: "user", content: userInput }
    ]

    const tools = this.registry.getDefinitions()

    // Agent 循环：最多 10 轮，防止无限循环
    for (let i = 0; i < 10; i++) {
      const response = await this.llm.chat({ messages, tools })

      // 如果 LLM 决定调用工具
      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const call of response.tool_calls) {
          console.log(\`调用工具: \${call.name}(\${call.arguments})\`)

          // 执行工具
          const result = await this.registry.execute(call.name, call.arguments)

          // 把工具结果加入消息历史
          messages.push({
            role: "assistant",
            content: null,
            tool_calls: [call]
          })
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: result
          })
        }
        // 继续下一轮，让 LLM 处理工具结果
        continue
      }

      // LLM 没有调用工具，说明任务完成
      return response.content
    }

    return "达到最大循环次数，任务未完成"
  }
}
\`\`\`

## 第六步：完整运行

\`\`\`typescript
async function main() {
  const llm = new OpenAIClient({ apiKey: "..." })
  const agent = new Agent(llm, registry)

  const result = await agent.run("帮我看下 package.json 有哪些依赖，并运行 npm outdated 看哪些需要更新")

  console.log(result)
}

main()
\`\`\`

## 安全性考虑

实现 Tool Calling 时要注意安全：

### 1. 命令执行安全
\`\`\`typescript
// 危险：直接执行用户/LLM 提供的命令
exec(command)  // 可能执行 rm -rf /

// 安全：白名单 + 沙箱
const ALLOWED_COMMANDS = ['npm', 'git', 'ls', 'cat']
if (!ALLOWED_COMMANDS.some(cmd => command.startsWith(cmd))) {
  throw new Error('Command not allowed')
}
\`\`\`

### 2. 文件访问限制
\`\`\`typescript
// 限制只能访问项目目录
const PROJECT_ROOT = '/path/to/project'
const fullPath = path.resolve(PROJECT_ROOT, params.path)
if (!fullPath.startsWith(PROJECT_ROOT)) {
  throw new Error('Access denied: path outside project')
}
\`\`\`

### 3. 超时控制
\`\`\`typescript
handler: async (params) => {
  return Promise.race([
    execCommand(params.command),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 30000)
    )
  ])
}
\`\`\`

## 错误处理策略

\`\`\`typescript
async execute(name: string, params: any) {
  try {
    const result = await tool.handler(params)
    return result
  } catch (error) {
    // 返回友好的错误信息给 LLM，让它能自我修正
    return \`工具 \${name} 执行失败：\${error.message}\`
  }
}
\`\`\`

## 关键要点

- 工具要明确定义接口（name、description、parameters）
- 工具注册表统一管理所有工具
- Agent 主循环要限制最大轮次，防止无限循环
- 工具执行要有错误处理和超时控制
- 安全性至关重要：命令白名单、路径限制、超时控制
- 工具的错误信息要返回给 LLM，让它能自我修正

> 推荐阅读：[LangChain - Tools and ToolCalling](https://python.langchain.com/docs/modules/agents/tools/)`, 'theory', 15, 'https://www.bilibili.com/video/BV1z95LzaE39/?p=2', 2, JSON.stringify([
    {title: 'LangChain - Custom Tools', url: 'https://python.langchain.com/docs/modules/agents/tools/custom_tools'},
    {title: 'LangChain - Tool calling', url: 'https://python.langchain.com/docs/how_to/tool_calling/'},
    {title: 'OpenAI - Function calling cookbook', url: 'https://cookbook.openai.com/examples/how_to_call_functions_with_chat_models'},
    {title: 'CrewAI - Tools', url: 'https://docs.crewai.com/concepts/tools'}
  ]))

    insertChapter.run(9, 3, 'Tool Calling 实战', `# Tool Calling 实战

理论学完了，现在让我们通过实战练习，真正掌握 Tool Calling 的设计与实现。本章包含多个练习任务，从简单到复杂，循序渐进。

## 练习目标

通过本章练习，你将能够：
1. 设计合理的工具定义
2. 实现安全的工具执行逻辑
3. 构建带工具调用的完整 Agent
4. 处理工具调用中的各种边界情况

## 练习 1：设计文件管理工具

**任务背景**：你要构建一个代码管理 Agent，需要文件操作能力。

**练习要求**：设计一组文件管理工具，包括：
- 读取文件
- 写入文件
- 列出目录
- 搜索文件

**参考答案**：
\`\`\`typescript
// 1. 读取文件
const readFileTool = {
  name: "read_file",
  description: "读取文本文件内容。路径相对于项目根目录。",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "文件路径，如 src/index.ts"
      }
    },
    required: ["path"]
  }
}

// 2. 写入文件
const writeFileTool = {
  name: "write_file",
  description: "写入内容到文件。如果文件存在则覆盖，不存在则创建。",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "文件路径" },
      content: { type: "string", description: "文件内容" }
    },
    required: ["path", "content"]
  }
}

// 3. 列出目录
const listDirTool = {
  name: "list_dir",
  description: "列出指定目录下的文件和文件夹",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "目录路径，默认为项目根目录" }
    },
    required: []
  }
}

// 4. 搜索文件
const searchFilesTool = {
  name: "search_files",
  description: "按名称模式搜索文件",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "glob 模式，如 **/*.ts" },
      content: { type: "string", description: "可选：文件内容关键词" }
    },
    required: ["pattern"]
  }
}
\`\`\`

## 练习 2：设计 Git 操作工具

**任务背景**：Agent 需要能进行 Git 操作来管理版本。

**练习要求**：设计一组 Git 工具，包括：
- 查看状态（status）
- 查看差异（diff）
- 提交代码（commit）
- 查看日志（log）

**思考题**：
- 为什么不直接用一个 \`run_git_command\` 工具？
- 分开设计有什么好处？（提示：安全性、可控制性、LLM 选择准确度）

**参考思路**：
\`\`\`typescript
// 分开设计比统一命令更安全
// LLM 只能调用预定义的操作，不能执行 git push --force

const gitStatusTool = {
  name: "git_status",
  description: "查看 Git 工作区状态",
  parameters: { type: "object", properties: {} }
}

const gitDiffTool = {
  name: "git_diff",
  description: "查看文件改动",
  parameters: {
    type: "object",
    properties: {
      staged: { type: "boolean", description: "是否查看暂存区的改动" }
    }
  }
}

const gitCommitTool = {
  name: "git_commit",
  description: "提交代码",
  parameters: {
    type: "object",
    properties: {
      message: { type: "string", description: "提交信息" }
    },
    required: ["message"]
  }
}
\`\`\`

## 练习 3：实现带校验的工具执行器

**任务背景**：工具执行器不仅要能执行，还要能处理各种异常情况。

**练习要求**：实现一个健壮的工具执行器，需要：
1. 参数校验
2. 权限检查
3. 超时控制
4. 错误处理

**参考实现**：
\`\`\`typescript
class SafeToolExecutor {
  private timeouts = new Map<string, NodeJS.Timeout>()

  async execute(tool: Tool, params: any): Promise<string> {
    // 1. 参数校验
    this.validateParams(params, tool.parameters)

    // 2. 权限检查
    await this.checkPermission(tool.name, params)

    // 3. 超时控制
    const timeoutId = setTimeout(() => {
      throw new Error(\`工具 \${tool.name} 执行超时\`)
    }, 30000)

    try {
      const result = await tool.handler(params)
      clearTimeout(timeoutId)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      // 返回错误信息给 LLM，让它能自我修正
      return \`执行失败：\${error.message}\`
    }
  }

  private validateParams(params: any, schema: any) {
    // 检查必填字段
    for (const field of schema.required || []) {
      if (!(field in params)) {
        throw new Error(\`缺少必填参数：\${field}\`)
      }
    }
    // 检查类型
    for (const [key, value] of Object.entries(params)) {
      const propSchema = schema.properties[key]
      if (propSchema && typeof value !== propSchema.type) {
        throw new Error(\`参数 \${key} 类型错误\`)
      }
    }
  }

  private async checkPermission(toolName: string, params: any) {
    // 例如：写文件操作需要确认
    if (toolName === 'write_file' && params.path.includes('node_modules')) {
      throw new Error('不允许修改 node_modules 目录')
    }
  }
}
\`\`\`

## 练习 4：构建多工具协作流程

**任务背景**：用户给一个复杂任务："分析我的项目，找出所有 TODO 注释，生成报告"。

**练习要求**：设计 Agent 的工作流程，让它通过多个工具协作完成任务。

**参考流程**：
\`\`\`
任务：找出所有 TODO 注释

Agent 执行流程：
1. [list_dir] 列出项目目录结构
   → 得到: src/, tests/, docs/

2. [search_files] 搜索所有 .ts 和 .js 文件
   → 得到: src/index.ts, src/utils.ts, ...

3. [search_code] 在这些文件中搜索 "TODO"
   → 得到:
   - src/index.ts:15  // TODO: 添加错误处理
   - src/utils.ts:42  // TODO: 优化算法

4. [read_file] 读取相关上下文（可选）
   → 了解每个 TODO 的背景

5. 生成报告
   "找到 2 处 TODO：
    1. src/index.ts:15 - 添加错误处理
    2. src/utils.ts:42 - 优化算法"
\`\`\`

## 练习 5：错误恢复场景

**任务背景**：工具调用可能失败，Agent 需要有错误恢复能力。

**练习要求**：设计 Prompt 和工具，让 Agent 能处理以下错误：
1. 文件不存在
2. 命令执行失败
3. 网络请求超时

**参考策略**：
\`\`\`
错误恢复 Prompt：

你是一个有经验的编程助手。当工具调用失败时：
1. 分析错误原因
2. 尝试替代方案
3. 如果无法解决，告诉用户具体问题和建议

示例：
- 文件不存在 → 检查路径是否正确，搜索相似文件名
- 命令失败 → 查看错误信息，尝试修复（如缺少依赖则安装）
- 网络超时 → 重试一次，仍失败则告知用户
\`\`\`

## 评估标准

你的工具设计应该满足：
- [ ] **描述清晰**：LLM 能根据描述正确选择工具
- [ ] **参数完整**：必填参数标注清楚
- [ ] **粒度合理**：既不过细（太多工具难选择），也不过粗（一个工具做太多事）
- [ ] **安全可控**：危险操作有保护机制
- [ ] **错误友好**：错误信息能帮助 LLM 自我修正

## 常见设计误区

### 1. 工具粒度太细
\`\`\`
❌ read_file, read_json_file, read_csv_file, read_yaml_file
✅ read_file（一个工具 + 参数控制格式）
\`\`\`

### 2. 工具描述太简单
\`\`\`
❌ name: "search", description: "搜索"
✅ name: "search_code", description: "在项目代码中搜索关键词，支持正则表达式"
\`\`\`

### 3. 缺少错误处理
\`\`\`
❌ 文件不存在直接抛异常，Agent 不知道怎么办
✅ 返回 "文件 xxx 不存在，请检查路径" 让 Agent 能理解并调整
\`\`\`

## 动手实践

请在实操练习区尝试：
1. 设计一组数据库操作工具（查询、插入、更新、删除）
2. 设计一个代码分析工具（分析代码复杂度、重复代码）
3. 设计一个测试运行工具（运行测试并解析结果）

实践时思考：
- 这个工具的 description 够清晰吗？
- LLM 能根据描述正确使用吗？
- 错误信息友好吗？

> 推荐阅读：[LangChain - Custom Tools](https://python.langchain.com/docs/modules/agents/tools/custom_tools)`, 'practice', 20, 'https://www.bilibili.com/video/BV1z95LzaE39/?p=3', 3, JSON.stringify([
    {title: 'LangChain - Custom Tools', url: 'https://python.langchain.com/docs/modules/agents/tools/custom_tools'},
    {title: 'MCP - 快速开始', url: 'https://modelcontextprotocol.io/quickstart'},
    {title: 'Hugging Face - Tools', url: 'https://huggingface.co/docs/transformers/main_classes/tools'},
    {title: 'GitHub - Awesome MCP Servers', url: 'https://github.com/modelcontextprotocol/servers'}
  ]))

    // 课程 4: Agent 工作流
    insertCourse.run(4, 'Agent 工作流设计', 'agent', 'intermediate', '学习 Plan-Execute-Review 工作流模式，设计高效的 Agent 执行流程', 4)
    insertChapter.run(10, 4, 'Plan-Execute-Review 模式', `# Plan-Execute-Review 模式

Plan-Execute-Review（规划-执行-审查）是最经典的 Agent 工作流模式。它模仿了人类工程师的工作方式：先想清楚怎么做，再动手做，最后检查做得对不对。

## 为什么需要工作流

没有工作流的 Agent 像无头苍蝇：

\`\`\`
用户: "帮我重构用户模块"
无工作流的 Agent:
  → 直接开始改代码
  → 改到一半发现漏了功能
  → 回头补，又改乱别的
  → 最后测试失败，不知道哪里错了
\`\`\`

有工作流的 Agent 井井有条：

\`\`\`
用户: "帮我重构用户模块"
有工作流的 Agent:
  [Plan] 先分析现有代码 → 列出重构方案 → 等用户确认
  [Execute] 按方案逐步重构 → 每步验证 → 记录改动
  [Review] 对比重构前后 → 运行测试 → 生成报告
\`\`\`

## Plan（规划阶段）

Agent 接收任务后，**先不急着动手**，而是制定详细计划。

### 规划的内容
- **分析任务目标**：用户真正想要什么
- **分解子任务**：把大任务拆成小步骤
- **确定依赖关系**：哪些步骤有先后顺序
- **评估风险**：哪些步骤可能出问题
- **制定验收标准**：怎么判断任务完成

### 规划示例
\`\`\`
任务: "给项目添加单元测试"

Plan:
1. 分析项目结构，识别核心模块
2. 查看现有测试配置（jest/vitest？）
3. 为 utils 模块编写测试（5 个函数）
4. 为 api 模块编写测试（3 个接口）
5. 运行测试，修复失败的用例
6. 生成测试覆盖率报告

依赖关系: 1→2→3,4→5→6
风险: 测试可能覆盖不到边界情况
验收: 覆盖率 > 80%，所有测试通过
\`\`\`

### 规划的 Prompt 技巧
\`\`\`
请分析以下任务并制定执行计划：
1. 不要立即执行，先规划
2. 列出所有步骤（不超过 7 步）
3. 标明步骤间的依赖关系
4. 指出可能的风险点
5. 给出验收标准

任务: {用户需求}
\`\`\`

## Execute（执行阶段）

按照计划**逐步执行**，每一步都要验证。

### 执行的原则
- **一步一验证**：每步完成后立即检查
- **记录中间结果**：方便回溯
- **异常处理**：出错时不要硬扛，调整计划
- **用户确认**：关键步骤前征得同意

### 执行示例
\`\`\`
Step 1: 分析项目结构
  → 调用 list_dir("src/")
  → 结果: utils/, api/, components/
  → 状态: ✅ 完成

Step 2: 查看测试配置
  → 调用 read_file("package.json")
  → 结果: 使用 vitest
  → 状态: ✅ 完成

Step 3: 为 utils 编写测试
  → 调用 read_file("src/utils.ts")
  → 调用 write_file("tests/utils.test.ts", ...)
  → 调用 run_command("npx vitest run tests/utils.test.ts")
  → 结果: 4/5 通过，1 个失败
  → 状态: ⚠️ 需要修复
  → 调整: 修复失败的测试用例
  → 状态: ✅ 完成

...
\`\`\`

### 执行的 Prompt 技巧
\`\`\`
请按照以下计划逐步执行：
1. 每执行一步，报告结果
2. 如果某步失败，分析原因并调整
3. 关键操作（删除、修改）前需确认
4. 每步完成后等我确认再继续

计划: {之前制定的计划}
\`\`\`

## Review（审查阶段）

执行完成后，**不要急于结束**，要进行全面审查。

### 审查的内容
- **目标对比**：是否完成了用户的需求
- **副作用检查**：是否影响了其他功能
- **质量评估**：代码质量、性能、安全
- **测试验证**：运行测试，确保没有破坏
- **文档更新**：相关文档是否需要更新

### 审查示例
\`\`\`
Review:
1. ✅ 为 utils 和 api 模块添加了测试
2. ✅ 测试覆盖率从 0% 提升到 85%
3. ✅ 所有 12 个测试用例通过
4. ⚠️ components 模块未添加测试（非本次范围）
5. ✅ 未修改任何源代码，无副作用

改进建议:
- 建议下次为 components 模块添加测试
- 可以添加 CI 自动运行测试
\`\`\`

## 完整工作流循环

\`\`\`
┌─────────────────────────────────────┐
│           用户需求                   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Plan: 制定计划                     │
│  - 分解任务                         │
│  - 评估风险                         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Execute: 逐步执行                  │
│  - Step 1 → 验证                    │
│  - Step 2 → 验证                    │
│  - Step 3 → 失败 → 调整             │
│  - Step 4 → 验证                    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Review: 审查结果                   │
│  - 对比目标                         │
│  - 检查副作用                       │
│  - 运行测试                         │
└──────────────┬──────────────────────┘
               ↓
        ┌──────┴──────┐
        │  达成目标？  │
        └──────┬──────┘
           ↓        ↓
         是        否
           ↓        ↓
       完成     回到 Plan
\`\`\`

## 不同工作流模式对比

| 模式 | 特点 | 适用场景 |
|------|------|---------|
| Plan-Execute-Review | 规划-执行-审查循环 | 大多数任务（推荐） |
| ReAct | 思考-行动-观察 | 简单任务、快速响应 |
| Reflexion | 执行-反思-改进 | 需要自我提升的任务 |
| Tree of Thought | 树状探索多方案 | 复杂决策问题 |

## 实践建议

1. **始终先规划**：不要让 Agent 直接动手
2. **小步快跑**：每步完成后验证
3. **关键点确认**：重要决策前让用户确认
4. **接受失败**：失败时回到规划阶段
5. **做完整审查**：不要执行完就结束

## 小结

- **Plan**：先想清楚，分解任务，评估风险
- **Execute**：逐步执行，一步一验证，及时调整
- **Review**：对照目标，检查副作用，总结改进
- 这三个阶段形成闭环，必要时循环执行

> 推荐阅读：[Anthropic - Building effective agents](https://www.anthropic.com/research/building-effective-agents)`, 'theory', 15, 'https://www.bilibili.com/video/BV1mXZyYtEZS/', 1, JSON.stringify([
    {title: 'Anthropic - Building effective agents', url: 'https://www.anthropic.com/research/building-effective-agents'},
    {title: 'LangGraph - Build Stateful Agents', url: 'https://langchain-ai.github.io/langgraph/'},
    {title: 'LangChain - Agent executors', url: 'https://python.langchain.com/docs/modules/agents/agent_types/'},
    {title: 'CrewAI - Flows', url: 'https://docs.crewai.com/concepts/flows'}
  ]))

    insertChapter.run(11, 4, '工作流实战', `# 工作流实战

理解了 Plan-Execute-Review 模式，现在通过实战练习，设计并实现完整的 Agent 工作流。

## 练习目标

通过本章练习，你将能够：
1. 为不同任务设计合适的工作流
2. 编写规范的工作流 Prompt
3. 实现工作流引擎的核心逻辑
4. 处理工作流中的异常情况

## 练习 1：设计"Bug 修复"工作流

**任务背景**：用户反馈一个 bug，需要 Agent 系统化地修复。

**练习要求**：设计一个 Bug 修复工作流，包括：
- 问题定位
- 原因分析
- 修复方案
- 验证测试

**参考工作流**：
\`\`\`
[Plan]
1. 复现问题：运行用户提供的复现步骤
2. 定位代码：根据错误日志找到相关文件
3. 分析原因：读取代码，理解逻辑
4. 制定修复方案：列出可能的修复方法
5. 选择方案：评估风险，选择最优
6. 实施修复：修改代码
7. 验证：运行测试，确认修复

[Execute]
Step 1: 运行复现脚本 → 确认 bug 存在
Step 2: 搜索错误信息 → 定位到 src/api/user.ts:42
Step 3: 读取代码 → 发现 SQL 拼接问题
Step 4: 方案 a) 参数化查询 b) ORM 转义
Step 5: 选择 a，风险更低
Step 6: 修改代码
Step 7: 运行测试 → 通过

[Review]
- ✅ Bug 已修复
- ✅ 所有测试通过
- ✅ 未影响其他功能
- 改进建议：添加输入校验作为防御性编程
\`\`\`

## 练习 2：设计"功能开发"工作流

**任务背景**：用户要开发一个新功能，需要完整的设计-开发-测试流程。

**练习要求**：设计功能开发工作流，包括：
- 需求分析
- 技术方案
- 编码实现
- 测试验证
- 文档更新

**参考 Prompt**：
\`\`\`
[角色] 你是资深全栈工程师

[任务] 开发用户头像上传功能

[工作流]
请按以下步骤执行，每步完成后等我确认：

Plan 阶段:
1. 分析需求（前端、后端、存储）
2. 设计技术方案
3. 列出实现步骤

Execute 阶段:
4. 后端：实现上传 API
5. 前端：实现上传组件
6. 集成：前后端联调
7. 测试：编写测试用例

Review 阶段:
8. 代码审查
9. 测试覆盖率检查
10. 文档更新

[约束]
- 每步完成后报告结果
- 出错时回到 Plan 阶段
- 关键决策需确认
\`\`\`

## 练习 3：实现工作流引擎

**任务背景**：需要一个可复用的工作流引擎来管理 Plan-Execute-Review 流程。

**练习要求**：实现一个 WorkflowEngine 类，支持：
- 任务分解
- 步骤执行
- 结果审查
- 异常处理

**参考实现**：
\`\`\`typescript
class WorkflowEngine {
  private steps: WorkflowStep[] = []
  private results: Map<string, any> = new Map()

  // Plan: 规划任务
  async plan(task: string): Promise<WorkflowStep[]> {
    const plan = await this.llm.chat({
      messages: [{
        role: "user",
        content: \`请分解任务为步骤: \${task}\`
      }]
    })
    this.steps = JSON.parse(plan)
    return this.steps
  }

  // Execute: 执行步骤
  async execute(): Promise<void> {
    for (const step of this.steps) {
      try {
        console.log(\`执行: \${step.name}\`)
        const result = await this.executeStep(step)
        this.results.set(step.id, result)
        step.status = "completed"

        // 验证步骤结果
        const valid = await this.validateStep(step, result)
        if (!valid) {
          step.status = "failed"
          await this.handleFailure(step, result)
        }
      } catch (error) {
        step.status = "error"
        await this.handleFailure(step, error)
      }
    }
  }

  // Review: 审查结果
  async review(): Promise<ReviewReport> {
    const report = {
      totalSteps: this.steps.length,
      completed: this.steps.filter(s => s.status === "completed").length,
      failed: this.steps.filter(s => s.status === "failed").length,
      results: Object.fromEntries(this.results),
      summary: await this.generateSummary()
    }
    return report
  }

  private async handleFailure(step: WorkflowStep, error: any) {
    // 1. 分析错误原因
    // 2. 尝试重试或调整
    // 3. 必要时回到 plan 阶段
    console.error(\`步骤 \${step.name} 失败:\`, error)
  }
}
\`\`\`

## 练习 4：设计"代码重构"工作流

**任务背景**：需要重构一个 1000 行的大类。

**练习要求**：设计一个安全的重构工作流，确保：
- 重构过程可回滚
- 功能保持不变
- 测试覆盖完整

**参考流程**：
\`\`\`
[Plan]
1. 分析现有代码：列出所有方法和职责
2. 识别问题：职责混乱、重复代码、长方法
3. 设计目标：拆分为哪些类
4. 制定步骤：每步保持可运行
5. 准备测试：先补充测试用例

[Execute]
Step 1: 补充测试用例（保护现有行为）
Step 2: 运行测试，确保通过
Step 3: 提取方法到新类（每次一个）
Step 4: 每次提取后运行测试
Step 5: 更新调用方代码
Step 6: 删除原类中的旧代码

[Review]
- 测试全部通过？
- 功能保持不变？
- 代码行数是否减少？
- 可读性是否提升？
\`\`\`

## 练习 5：工作流异常处理

**任务背景**：工作流执行中可能遇到各种异常。

**练习要求**：设计异常处理策略，处理以下情况：
1. 工具调用失败
2. 步骤间依赖断裂
3. 测试失败
4. 超时

**参考策略**：
\`\`\`
异常处理策略：

1. 工具失败 → 重试 3 次 → 仍失败则降级
2. 依赖断裂 → 跳过该步骤 → 后续步骤标记为 blocked
3. 测试失败 → 分析原因 → 修复 → 重试
4. 超时 → 终止当前步骤 → 记录状态 → 可恢复

恢复机制：
- 保存工作流状态
- 支持从失败点恢复
- 保留中间结果
\`\`\`

## 评估标准

你的工作流设计应该满足：
- [ ] **有规划**：执行前先制定计划
- [ ] **可验证**：每步有明确的验证标准
- [ ] **可回滚**：失败时能恢复
- [ ] **有审查**：完成后做全面检查
- [ ] **可复用**：工作流能应用于类似任务

## 常见问题

### 1. 何时需要工作流？
- 任务复杂度高（多步骤）
- 有明确的目标和验收标准
- 需要可控的执行过程

### 2. 何时不需要工作流？
- 简单的一次性任务
- 没有明确的步骤
- 探索性的对话

### 3. 工作流太死板怎么办？
- 允许 Agent 在步骤内灵活处理
- 设置"异常处理"分支
- 关键点允许人工介入

## 动手实践

请在实操练习区尝试：
1. 设计一个"API 文档生成"工作流
2. 设计一个"性能优化"工作流
3. 实现一个简单的工作流引擎

实践时思考：
- 工作流是否覆盖了所有必要步骤？
- 异常处理是否完善？
- 是否有明确的验收标准？

> 推荐阅读：[LangGraph - Build Stateful Agents](https://langchain-ai.github.io/langgraph/)`, 'practice', 20, 'https://www.bilibili.com/video/BV1mXZyYtEZS/?p=2', 2, JSON.stringify([
    {title: 'LangGraph - 实战教程', url: 'https://langchain-ai.github.io/langgraph/tutorials/'},
    {title: 'LangChain - Plan and execute', url: 'https://python.langchain.com/docs/modules/agents/agent_types/plan_and_execute'},
    {title: 'AutoGen - Workflow', url: 'https://microsoft.github.io/autogen/docs/Use-Cases/agent-chat/'},
    {title: 'CrewAI - 流程编排', url: 'https://docs.crewai.com/concepts/flows'}
  ]))

    // 课程 5: 多 Agent 协作
    insertCourse.run(5, '多 Agent 协作模式', 'advanced', 'advanced', '探索多个 Agent 协同工作的模式与最佳实践', 5)
    insertChapter.run(12, 5, '多 Agent 协作概述', `# 多 Agent 协作概述

随着任务复杂度的提升，单个 Agent 往往力不从心。多 Agent 协作就像组建一个团队，让多个专业化的 Agent 各司其职，协同完成复杂任务。

## 为什么需要多 Agent 协作

单个 Agent 的局限：

\`\`\`
单 Agent 的问题:
- 上下文太长，容易遗忘前面的信息
- 角色混乱，既要写代码又要审查
- 无法并行处理多个子任务
- 单点失败，一个错误影响全局

多 Agent 的优势:
- 专业分工：每个 Agent 专注一个领域
- 上下文隔离：各自的对话不会互相干扰
- 并行执行：多个 Agent 同时工作
- 互相审查：Agent 之间可以互相校验
\`\`\`

类比：就像软件开发团队
- 前端工程师（专注 UI）
- 后端工程师（专注 API）
- 测试工程师（专注质量）
- 产品经理（专注需求）

## 四大协作模式

### 1. 层级模式（Hierarchical）

一个主 Agent 负责任务分解和分配，多个子 Agent 执行具体任务。

\`\`\`
        ┌──────────────┐
        │  主 Agent    │
        │  (协调者)    │
        └──────┬───────┘
               │ 分配任务
    ┌──────────┼──────────┐
    ↓          ↓          ↓
┌───────┐ ┌───────┐ ┌───────┐
│子Agent│ │子Agent│ │子Agent│
│(前端) │ │(后端) │ │(测试) │
└───────┘ └───────┘ └───────┘
    ↓          ↓          ↓
    └──────────┼──────────┘
               ↑ 汇报结果
        ┌──────┴───────┐
        │  主 Agent    │
        │  (整合结果)  │
        └──────────────┘
\`\`\`

**适用场景**：大型项目开发、复杂任务分解

**示例**：
\`\`\`
主Agent: "开发一个博客系统"
  → 分配给前端Agent: "实现博客列表页和详情页"
  → 分配给后端Agent: "实现文章 CRUD API"
  → 分配给测试Agent: "为 API 编写测试"
  ← 各子Agent汇报结果
  ← 主Agent整合，生成最终交付
\`\`\`

### 2. 对等模式（Peer-to-Peer）

多个 Agent 地位平等，互相协作、互相审查。

\`\`\`
┌──────────┐  审查代码  ┌──────────┐
│  Agent A │ ────────→ │  Agent B │
│ (编码者) │ ←──────── │ (审查者) │
└──────────┘   反馈    └──────────┘
\`\`\`

**适用场景**：代码审查、方案讨论、质量保证

**示例**：
\`\`\`
Agent A: 写了一段代码
Agent B: 审查发现安全问题
Agent A: 根据反馈修改
Agent B: 确认修复
\`\`\`

### 3. 流水线模式（Pipeline）

多个 Agent 按顺序处理任务的不同阶段，前一个的输出是后一个的输入。

\`\`\`
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Agent 1  │ ──→ │ Agent 2  │ ──→ │ Agent 3  │
│ (需求分析)│     │ (编码)   │     │ (测试)   │
└──────────┘     └──────────┘     └──────────┘
\`\`\`

**适用场景**：软件开发流程、数据处理流水线

**示例**：
\`\`\`
需求Agent → 分析需求，输出规格文档
编码Agent → 根据规格，编写代码
测试Agent → 根据规格，编写测试
审查Agent → 审查代码和测试
\`\`\`

### 4. 辩论模式（Debate）

多个 Agent 针对同一问题各抒己见，通过讨论达成最优方案。

\`\`\`
┌──────────┐
│  Agent A │ ──┐
│ (方案一) │   │
└──────────┘   │
               ↓
┌──────────┐          ┌──────────┐
│  Agent B │ ←──────→ │  仲裁者  │
│ (方案二) │   讨论    │ (决策)   │
└──────────┘          └──────────┘
               ↑
┌──────────┐   │
│  Agent C │ ──┘
│ (方案三) │
└──────────┘
\`\`\`

**适用场景**：技术选型、架构设计、复杂决策

**示例**：
\`\`\`
任务：选择前端框架
Agent A: 推 React，生态丰富
Agent B: 推 Vue，易学易用
Agent C: 推 Svelte，性能优秀
仲裁者: 综合团队情况，选择 React
\`\`\`

## 多 Agent 系统的核心组件

\`\`\`
┌─────────────────────────────────┐
│        多 Agent 系统             │
│                                 │
│  ┌─────────────────────────┐   │
│  │     通信层 (消息总线)    │   │
│  │  Agent ←→ Agent 通信     │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │     协调器 ( Orchestrator)│   │
│  │  任务分配、结果整合       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │     状态管理             │   │
│  │  共享状态、任务进度       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │     Agent 实例           │   │
│  │  Agent A | B | C | ...   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
\`\`\`

## 主流多 Agent 框架

| 框架 | 特点 | 适用场景 |
|------|------|---------|
| AutoGen | 微软出品，支持多 Agent 对话 | 通用多 Agent |
| CrewAI | 角色化 Agent，简洁易用 | 团队协作模拟 |
| LangGraph | 基于图的工作流 | 复杂工作流 |
| MetaGPT | 软件公司模拟 | 软件开发 |

## 适用场景

- **大型项目开发**：前端、后端、测试分工
- **代码审查 + 修复**：一个写代码，一个审查
- **技术方案设计**：多个 Agent 提案，择优
- **数据处理**：采集、清洗、分析流水线
- **内容创作**：写作、编辑、校对

## 关键要点

- 多 Agent 解决单 Agent 的上下文混乱、角色冲突问题
- 四种模式：层级、对等、流水线、辩论
- 核心组件：通信层、协调器、状态管理
- 选择模式要根据任务特点
- 框架选择：AutoGen / CrewAI / LangGraph / MetaGPT

> 推荐阅读：[AutoGen - Multi-agent framework](https://microsoft.github.io/autogen/)`, 'theory', 15, 'https://www.bilibili.com/video/BV17XP5eBE15/', 1, JSON.stringify([
    {title: 'AutoGen - Multi-agent framework', url: 'https://microsoft.github.io/autogen/'},
    {title: 'CrewAI - Multi-agent framework', url: 'https://docs.crewai.com/'},
    {title: 'LangGraph - Multi-agent systems', url: 'https://langchain-ai.github.io/langgraph/tutorials/multi_agent/multi-agent-collaboration/'},
    {title: 'MetaGPT - 多Agent框架', url: 'https://github.com/FoundationAgents/MetaGPT'}
  ]))

    insertChapter.run(13, 5, '多 Agent 实战', `# 多 Agent 实战

理论学完了，现在通过实战练习，设计并实现多 Agent 协作系统。本章将通过具体的场景，帮助你掌握多 Agent 协作的设计与实现。

## 练习目标

通过本章练习，你将能够：
1. 根据任务特点选择合适的协作模式
2. 设计多 Agent 系统的通信机制
3. 实现任务分配和结果整合
4. 处理多 Agent 协作中的冲突和异常

## 练习 1：设计"软件开发团队"

**任务背景**：用多 Agent 模拟一个软件开发团队，完成一个功能开发。

**练习要求**：使用层级模式，设计：
- 1 个主 Agent（项目经理）
- 3 个子 Agent（前端、后端、测试）

**参考设计**：
\`\`\`
主 Agent (项目经理) 职责:
- 分析用户需求
- 分配任务给子 Agent
- 整合子 Agent 的成果
- 向用户报告进度

前端 Agent 职责:
- 接收 UI 需求
- 实现 React 组件
- 与后端 API 联调
- 报告实现结果

后端 Agent 职责:
- 接收 API 需求
- 实现 Express 接口
- 设计数据库 schema
- 报告实现结果

测试 Agent 职责:
- 接收测试需求
- 编写单元测试
- 运行测试用例
- 报告测试结果
\`\`\`

## 练习 2：实现 Agent 通信

**任务背景**：多 Agent 协作的核心是通信机制。

**练习要求**：实现一个 Agent 通信总线，支持：
- 点对点消息
- 广播消息
- 消息队列
- 消息确认

**参考实现**：
\`\`\`typescript
class AgentMessageBus {
  private queues: Map<string, Message[]> = new Map()
  private handlers: Map<string, (msg: Message) => void> = new Map()

  // 注册 Agent
  register(agentId: string, handler: (msg: Message) => void) {
    this.queues.set(agentId, [])
    this.handlers.set(agentId, handler)
  }

  // 发送点对点消息
  send(from: string, to: string, message: any) {
    const msg: Message = {
      id: generateId(),
      from,
      to,
      content: message,
      timestamp: Date.now()
    }
    this.queues.get(to)?.push(msg)
    this.handlers.get(to)?.(msg)
  }

  // 广播消息
  broadcast(from: string, message: any) {
    for (const agentId of this.queues.keys()) {
      if (agentId !== from) {
        this.send(from, agentId, message)
      }
    }
  }

  // 接收消息
  receive(agentId: string): Message[] {
    const msgs = this.queues.get(agentId) || []
    this.queues.set(agentId, [])
    return msgs
  }
}
\`\`\`

## 练习 3：设计"代码审查流水线"

**任务背景**：使用流水线模式，让多个 Agent 协作完成代码审查。

**练习要求**：设计流水线：
1. Agent A：静态分析（检查语法、类型）
2. Agent B：安全审查（检查漏洞）
3. Agent C：性能审查（检查性能问题）
4. Agent D：风格审查（检查代码规范）

**参考流程**：
\`\`\`
代码 → [静态分析] → [安全审查] → [性能审查] → [风格审查] → 综合报告

每个 Agent 的输出:
{
  agent: "security",
  issues: [
    { severity: "high", line: 42, issue: "SQL 注入", fix: "..." }
  ],
  passed: false
}

最终综合:
{
  totalIssues: 5,
  high: 1,
  medium: 3,
  low: 1,
  overallScore: 7.5,
  recommendation: "需修复高危问题后合并"
}
\`\`\`

## 练习 4：实现层级模式的协调器

**任务背景**：层级模式需要一个协调器来分配任务和整合结果。

**练习要求**：实现一个 Coordinator 类，支持：
- 任务分解
- 子任务分配
- 结果收集
- 最终整合

**参考实现**：
\`\`\`typescript
class Coordinator {
  private subAgents: Map<string, Agent> = new Map()
  private results: Map<string, any> = new Map()

  // 注册子 Agent
  registerAgent(role: string, agent: Agent) {
    this.subAgents.set(role, agent)
  }

  // 分配并执行任务
  async executeTask(task: string): Promise<any> {
    // 1. 分解任务
    const subtasks = await this.decompose(task)

    // 2. 分配给子 Agent（并行）
    const promises = subtasks.map(subtask => {
      const agent = this.subAgents.get(subtask.role)!
      return agent.run(subtask.description).then(result => {
        this.results.set(subtask.role, result)
      })
    })

    await Promise.all(promises)

    // 3. 整合结果
    return await this.synthesize()
  }

  private async decompose(task: string): Promise<SubTask[]> {
    // 用 LLM 分解任务
    // 返回 [{role: "frontend", description: "..."}, ...]
  }

  private async synthesize(): Promise<any> {
    // 整合各 Agent 的结果
    // 生成最终报告
  }
}
\`\`\`

## 练习 5：处理 Agent 间的冲突

**任务背景**：多 Agent 协作可能出现意见冲突，需要解决机制。

**练习要求**：设计冲突解决策略，处理：
1. 两个 Agent 给出矛盾的建议
2. 一个 Agent 的输出导致另一个失败
3. 任务依赖循环

**参考策略**：
\`\`\`
冲突解决策略:

1. 矛盾建议 → 投票/仲裁
   - 多数决：3 个 Agent 中 2 个同意则通过
   - 仲裁者：由主 Agent 决策
   - 升级：让用户决定

2. 依赖失败 → 降级/重试
   - 重试：重新执行失败的 Agent
   - 降级：跳过该步骤，标注未完成
   - 回滚：恢复到之前的状态

3. 依赖循环 → 检测并打破
   - 检测：构建依赖图，发现环
   - 打破：合并为一个 Agent 执行
   - 重构：重新设计任务分解
\`\`\`

## 评估标准

你的多 Agent 设计应该满足：
- [ ] **职责清晰**：每个 Agent 有明确的职责
- [ ] **通信规范**：Agent 间通信有标准格式
- [ ] **冲突处理**：有冲突解决机制
- [ ] **可扩展**：能方便添加新 Agent
- [ ] **容错性**：单个 Agent 失败不影响整体

## 常见设计误区

### 1. Agent 太多
\`\`\`
❌ 10 个 Agent 各做一小步 → 通信成本高，效率低
✅ 3-5 个 Agent，每个负责完整职责
\`\`\`

### 2. 职责重叠
\`\`\`
❌ Agent A 和 Agent B 都负责写代码 → 谁写？冲突
✅ Agent A 写后端，Agent B 写前端 → 职责清晰
\`\`\`

### 3. 缺少协调
\`\`\`
❌ 所有 Agent 平等，没人整合 → 各做各的，结果混乱
✅ 有主 Agent 协调，整合结果 → 输出统一
\`\`\`

## 动手实践

请在实操练习区尝试：
1. 设计一个"内容创作团队"（写作、编辑、校对）
2. 实现 Agent 之间的消息传递
3. 设计一个简单的冲突解决机制

实践时思考：
- 每个 Agent 的职责是否清晰？
- Agent 间如何通信？
- 冲突如何解决？

> 推荐阅读：[CrewAI - Multi-agent framework](https://docs.crewai.com/)`, 'practice', 20, 'https://www.bilibili.com/video/BV17XP5eBE15/?p=2', 2, JSON.stringify([
    {title: 'CrewAI - 快速开始', url: 'https://docs.crewai.com/quickstart'},
    {title: 'AutoGen - 群聊示例', url: 'https://microsoft.github.io/autogen/docs/Use-Cases/agent_chat_group_chat/'},
    {title: 'LangGraph - 多Agent协作', url: 'https://langchain-ai.github.io/langgraph/tutorials/multi_agent/multi-agent-collaboration/'},
    {title: 'CAMEL - 角色扮演Agent', url: 'https://github.com/camel-ai/camel'}
  ]))

    // 课程 6: RAG Agent
    insertCourse.run(6, 'RAG 在 Agent 中的应用', 'advanced', 'advanced', '掌握检索增强生成技术，让 Agent 拥有强大的知识检索能力', 6)
    insertChapter.run(14, 6, 'RAG 基础', `# RAG 基础

RAG（Retrieval-Augmented Generation，检索增强生成）让 Agent 能够**检索外部知识**，然后基于检索到的信息生成回答。这是让 Agent 拥有"专业知识"的核心技术。

## 为什么需要 RAG

LLM 的知识有局限：

\`\`\`
LLM 的问题:
- 知识截止：训练数据有截止日期，不知道最新信息
- 领域限制：通用模型不懂你的业务代码、内部文档
- 幻觉：不知道答案时会编造，看起来很自信
- 上下文有限：不能把整个代码库塞进 Prompt

RAG 的解决方案:
- 检索：从你的知识库找相关信息
- 增强：把找到的信息注入 Prompt
- 生成：基于检索到的信息生成回答
\`\`\`

## RAG 核心流程

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    RAG 完整流程                          │
│                                                         │
│  ┌──────────┐                                          │
│  │ 用户提问  │ "这个函数是做什么的？"                   │
│  └────┬─────┘                                          │
│       ↓                                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐        │
│  │ 向量化   │ ──→ │ 向量检索  │ ──→ │ 获取文档  │        │
│  │ (Embedding)│   │ (Search) │     │ (Top-K)  │        │
│  └──────────┘     └──────────┘     └────┬─────┘        │
│                                          ↓              │
│  ┌──────────────────────────────────────────────┐      │
│  │  拼接上下文 (Context)                         │      │
│  │  问题: 这个函数是做什么的？                   │      │
│  │  相关文档:                                   │      │
│  │  - src/utils.ts: function formatDate(...)    │      │
│  │  - src/utils.ts: function parseDate(...)     │      │
│  └────────────────────┬─────────────────────────┘      │
│                       ↓                                 │
│  ┌──────────────────────────────────────────────┐      │
│  │  LLM 生成回答                                 │      │
│  │  "这个函数用于格式化日期..."                  │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
\`\`\`

## RAG 的关键组件

### 1. 文档处理（Document Processing）

把原始文档转换成可检索的形式。

\`\`\`
原始文档 → 分块 (Chunking) → 向量化 (Embedding) → 存储

示例:
原始文档: README.md (1000 行)
分块: [chunk1: 1-100行, chunk2: 101-200行, ...]
向量化: [vec1, vec2, ...] (每块 1536 维向量)
存储: 向量数据库
\`\`\`

**分块策略**：
- 固定长度：每 500 字一块
- 语义分块：按段落、函数、类分
- 重叠分块：相邻块有重叠，避免切断上下文

### 2. 向量化（Embedding）

把文本转换成向量，让计算机能计算"相似度"。

\`\`\`typescript
// 文本 → 向量
const text = "这是一个日期格式化函数"
const embedding = await embed(text)
// embedding = [0.12, -0.34, 0.56, ..., 0.78]  // 1536 维
\`\`\`

**主流 Embedding 模型**：
| 模型 | 维度 | 特点 |
|------|------|------|
| OpenAI text-embedding-3-small | 1536 | 通用、效果好 |
| OpenAI text-embedding-3-large | 3072 | 精度更高 |
| BGE | 768 | 开源、可本地部署 |
| M3E | 768 | 中文效果好 |

### 3. 向量数据库（Vector Database）

存储向量并支持相似度搜索。

\`\`\`typescript
// 存储文档
await db.insert({
  id: "doc1",
  content: "formatDate 函数用于...",
  embedding: [0.12, -0.34, ...]
})

// 相似度搜索
const results = await db.search(queryEmbedding, { topK: 5 })
// 返回最相似的 5 个文档
\`\`\`

**主流向量数据库**：
| 数据库 | 特点 | 适用场景 |
|--------|------|---------|
| Pinecone | 云托管、易用 | 快速上手 |
| ChromaDB | 开源、本地部署 | 隐私敏感 |
| Weaviate | 功能丰富 | 企业级 |
| Qdrant | 高性能 | 大规模 |
| pgvector | PostgreSQL 扩展 | 已有 PG |

### 4. 检索策略（Retrieval Strategy）

如何从向量数据库找到最相关的文档。

**相似度搜索**：
\`\`\`typescript
// 余弦相似度
function cosineSimilarity(a: number[], b: number[]): number {
  return dot(a, b) / (norm(a) * norm(b))
}
// 值域 [-1, 1]，越接近 1 越相似
\`\`\`

**混合搜索**：
- 向量搜索：语义相似
- 关键词搜索：精确匹配
- 结合两者：效果更好

**重排序（Reranking）**：
- 先粗检索 top 100
- 再用模型精排 top 10

### 5. 上下文拼接（Context Assembly）

把检索到的文档拼接到 Prompt 中。

\`\`\`typescript
const prompt = \`
基于以下文档回答问题：

文档:
\${documents.map(d => d.content).join('\\n\\n')}

问题: \${userQuestion}

请基于文档内容回答，如果文档中没有答案，请说"未找到相关信息"。
\`
\`\`\`

## 在 Agent 中的应用场景

### 1. 代码库问答
\`\`\`
用户: "我们的登录逻辑在哪里？"
RAG: [检索代码库] → 找到 src/auth/login.ts
回答: "登录逻辑在 src/auth/login.ts，主要函数是 login()"
\`\`\`

### 2. 文档检索
\`\`\`
用户: "怎么配置数据库连接？"
RAG: [检索文档] → 找到 docs/database.md
回答: "在 config/database.ts 中配置，参考文档..."
\`\`\`

### 3. 知识库查询
\`\`\`
用户: "公司的请假流程是什么？"
RAG: [检索 HR 知识库] → 找到请假制度
回答: "请假需要先在 OA 系统提交..."
\`\`\`

### 4. 历史对话回顾
\`\`\`
用户: "上次我们讨论的那个 bug 怎么解决的？"
RAG: [检索历史对话] → 找到相关讨论
回答: "上次讨论的是登录 bug，解决方案是..."
\`\`\`

## RAG vs Fine-tuning

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| RAG | 实时更新、可溯源、成本低 | 检索质量影响效果 | 知识频繁更新 |
| Fine-tuning | 模型内化知识、响应快 | 训练成本高、难更新 | 稳定的领域知识 |

## 关键要点

- RAG = 检索 + 增强 + 生成
- 解决 LLM 知识截止、幻觉、领域限制问题
- 五大组件：文档处理、向量化、向量数据库、检索策略、上下文拼接
- 比微调更灵活，适合知识频繁更新的场景
- 在 Agent 中用于代码库问答、文档检索、知识库查询

> 推荐阅读：[Pinecone - What is RAG?](https://www.pinecone.io/learn/retrieval-augmented-generation/)`, 'theory', 15, 'https://www.bilibili.com/video/BV1c1oxYtEZM/', 1, JSON.stringify([
    {title: 'Pinecone - What is RAG?', url: 'https://www.pinecone.io/learn/retrieval-augmented-generation/'},
    {title: 'LangChain - RAG Tutorial', url: 'https://python.langchain.com/docs/tutorials/rag'},
    {title: 'LlamaIndex - RAG 框架', url: 'https://docs.llamaindex.ai/'},
    {title: 'OpenAI - Retrieval Augmented Generation', url: 'https://platform.openai.com/docs/guides/gpt-best-practices/case-2-using-retrieval-augmented-generation-rag'}
  ]))

    insertChapter.run(15, 6, 'RAG 实战', `# RAG 实战

理解了 RAG 的原理，现在通过实战练习，构建一个真正的 RAG 系统。本章将实现一个"代码库问答 Agent"，能检索你的代码并回答问题。

## 练习目标

通过本章练习，你将能够：
1. 实现文档分块和向量化
2. 使用向量数据库存储和检索
3. 拼接上下文并调用 LLM 生成回答
4. 优化 RAG 系统的效果

## 练习 1：实现文档分块器

**任务背景**：把长文档切分成合适的小块，是 RAG 的第一步。

**练习要求**：实现一个分块器，支持：
- 按固定长度分块
- 按语义分块（段落、函数）
- 支持重叠

**参考实现**：
\`\`\`typescript
class DocumentChunker {
  // 按固定长度分块
  chunkBySize(text: string, chunkSize = 500, overlap = 50): string[] {
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize))
      if (i + chunkSize >= text.length) break
    }
    return chunks
  }

  // 按段落分块
  chunkByParagraph(text: string): string[] {
    return text.split(/\\n\\n+/).filter(p => p.trim().length > 0)
  }

  // 按函数分块（针对代码）
  chunkByFunction(code: string): string[] {
    const functionRegex = /(function\\s+\\w+|const\\s+\\w+\\s*=|class\\s+\\w+)[\\s\\S]*?(?=\\nfunction|\\nconst|\\nclass|$)/g
    return code.match(functionRegex) || [code]
  }
}
\`\`\`

## 练习 2：实现向量检索器

**任务背景**：向量检索是 RAG 的核心组件。

**练习要求**：实现一个向量检索器，支持：
- 添加文档（向量化并存储）
- 相似度搜索
- Top-K 返回

**参考实现**：
\`\`\`typescript
class VectorRetriever {
  private documents: { id: string; content: string; embedding: number[] }[] = []

  // 添加文档
  async addDocument(doc: { id: string; content: string }) {
    const embedding = await this.embed(doc.content)
    this.documents.push({
      id: doc.id,
      content: doc.content,
      embedding
    })
  }

  // 批量添加
  async addDocuments(docs: { id: string; content: string }[]) {
    await Promise.all(docs.map(d => this.addDocument(d)))
  }

  // 搜索
  async search(query: string, topK = 5) {
    const queryEmbedding = await this.embed(query)

    // 计算相似度并排序
    const scored = this.documents.map(doc => ({
      ...doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topK)
  }

  // 向量化（实际项目用 OpenAI/本地模型）
  private async embed(text: string): Promise<number[]> {
    // const response = await openai.embeddings.create({
    //   model: "text-embedding-3-small",
    //   input: text
    // })
    // return response.data[0].embedding
    return [] // 简化示例
  }

  // 余弦相似度
  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
    const normA = Math.sqrt(a.reduce((s, x) => s + x * x, 0))
    const normB = Math.sqrt(b.reduce((s, x) => s + x * x, 0))
    return dot / (normA * normB)
  }
}
\`\`\`

## 练习 3：构建 RAG Agent

**任务背景**：把检索器集成到 Agent 中，实现基于知识库的问答。

**练习要求**：实现一个 RAG Agent，流程：
1. 接收用户问题
2. 检索相关文档
3. 拼接上下文
4. 调用 LLM 生成回答

**参考实现**：
\`\`\`typescript
class RAGAgent {
  constructor(
    private retriever: VectorRetriever,
    private llm: LLMClient
  ) {}

  async ask(question: string): Promise<string> {
    // 1. 检索相关文档
    const docs = await this.retriever.search(question, 5)

    // 2. 拼接上下文
    const context = docs.map(d => d.content).join('\\n\\n---\\n\\n')

    // 3. 构造 Prompt
    const prompt = \`你是一个代码库问答助手。请基于以下代码文档回答问题。

相关文档:
\${context}

问题: \${question}

要求:
1. 只基于文档内容回答，不要编造
2. 如果文档中没有答案，说"未找到相关信息"
3. 引用文档来源（文件名、行号）\`

    // 4. 调用 LLM
    const answer = await this.llm.chat({
      messages: [{ role: "user", content: prompt }]
    })

    return answer
  }
}
\`\`\`

## 练习 4：构建代码库索引

**任务背景**：要实现代码库问答，先要索引整个代码库。

**练习要求**：实现一个代码库索引器：
- 遍历项目文件
- 按函数/类分块
- 向量化并存储

**参考实现**：
\`\`\`typescript
class CodebaseIndexer {
  constructor(private retriever: VectorRetriever) {}

  async indexDirectory(rootPath: string) {
    const files = await this.findCodeFiles(rootPath)

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const chunks = this.chunkCode(content, file)

      await this.retriever.addDocuments(
        chunks.map((chunk, i) => ({
          id: \`\${file}#chunk-\${i}\`,
          content: \`文件: \${file}\\n\\n\${chunk}\`
        }))
      )
    }
  }

  private async findCodeFiles(root: string): Promise<string[]> {
    // 查找所有 .ts/.js/.py 等代码文件
    // 排除 node_modules、dist 等
  }

  private chunkCode(code: string, filePath: string): string[] {
    // 按函数/类分块
    // 每块包含文件路径信息
  }
}
\`\`\`

## 练习 5：优化 RAG 效果

**任务背景**：基础 RAG 效果可能不理想，需要优化。

**练习要求**：实现以下优化：
1. 查询重写（让检索更准确）
2. 混合搜索（向量 + 关键词）
3. 重排序（提高相关性）

**参考实现**：
\`\`\`typescript
class AdvancedRAGAgent {
  async ask(question: string) {
    // 1. 查询重写：让问题更适合检索
    const rewrittenQuery = await this.rewriteQuery(question)

    // 2. 混合搜索：向量 + 关键词
    const vectorResults = await this.vectorSearch(rewrittenQuery, 50)
    const keywordResults = await this.keywordSearch(question, 50)
    const merged = this.mergeResults(vectorResults, keywordResults)

    // 3. 重排序：用更精细的模型排序
    const reranked = await this.rerank(question, merged, 5)

    // 4. 生成回答
    return await this.generate(question, reranked)
  }

  private async rewriteQuery(question: string): Promise<string> {
    // 用 LLM 重写查询
    // 例如: "登录不了" → "登录失败 原因 排查"
  }

  private async rerank(query: string, docs: Doc[], topK: number): Promise<Doc[]> {
    // 用 Cross-Encoder 等模型重排序
    // 比向量相似度更准确
  }
}
\`\`\`

## 评估标准

你的 RAG 系统应该满足：
- [ ] **检索准确**：Top-5 结果中包含答案
- [ ] **回答可信**：基于文档，不编造
- [ ] **响应快速**：检索 < 1秒，整体 < 5秒
- [ ] **可溯源**：能指出信息来源
- [ ] **抗噪声**：文档中没有答案时能正确说"不知道"

## 常见问题

### 1. 检索不到相关文档
- 检查分块策略：是否切断了重要上下文
- 检查 Embedding 模型：是否适合你的语言/领域
- 尝试查询重写：让查询更匹配文档

### 2. 回答出现幻觉
- 加强 Prompt：明确要求"只基于文档回答"
- 添加引用：要求标注来源
- 后处理：检查回答是否真的来自文档

### 3. 检索速度慢
- 减少文档数量：先用关键词过滤
- 使用近似搜索：FAISS、HNSW
- 缓存热门查询

## 动手实践

请在实操练习区尝试：
1. 实现一个简单的文档分块器
2. 实现一个基于内存的向量检索器
3. 构建一个 FAQ 问答 Agent

实践时思考：
- 分块大小如何影响效果？
- Top-K 取多少合适？
- 如何评估 RAG 的效果？

> 推荐阅读：[LangChain - RAG Tutorial](https://python.langchain.com/docs/tutorials/rag)`, 'practice', 20, 'https://www.bilibili.com/video/BV1c1oxYtEZM/?p=2', 2, JSON.stringify([
    {title: 'LangChain - RAG Tutorial', url: 'https://python.langchain.com/docs/tutorials/rag'},
    {title: 'LlamaIndex - 高级RAG', url: 'https://docs.llamaindex.ai/en/stable/optimizing/advanced_retrieval/'},
    {title: 'Chroma - 向量数据库', url: 'https://www.trychroma.com/'},
    {title: 'Pinecone - RAG 实战指南', url: 'https://www.pinecone.io/learn/series/vector-databases-in-production-for-busy-engineers/'}
  ]))

    // 实操任务（5 个核心任务 + 1 个综合实战引导项目）
    // 所有任务使用 'tests' 验证类型，通过 Web Worker 执行用户代码并运行单元测试

    // ===== 任务 1：Agent 指令构造器（入门）=====
    insertTask.run(
      1, 6, 'Agent 指令构造器',
      '实现一个函数 `createAgentPrompt`，根据角色、任务、约束条件构造完整的 Agent 系统指令（System Prompt）。\n\n**函数签名**：`createAgentPrompt(role: string, task: string, constraints: string[]): string`\n\n**要求**：\n- 返回一个字符串\n- 字符串中必须包含 `role` 参数的内容\n- 字符串中必须包含 `task` 参数的内容\n- 字符串中必须包含 `constraints` 数组中的每一项',
      '// 实现createAgentPrompt函数\n// 根据角色、任务、约束构造一个完整的Agent系统指令\nfunction createAgentPrompt(role, task, constraints) {\n  // TODO: 在这里实现你的代码\n  // 提示：可以使用模板字符串拼接\n  \n}',
      'function createAgentPrompt(role, task, constraints) {\n  const constraintText = constraints.map(c => `- ${c}`).join(\'\\n\')\n  return `# 角色设定\\n你是一个 ${role}。\\n\\n# 任务描述\\n${task}\\n\\n# 行为约束\\n${constraintText}`\n}',
      'tests', '', 'easy', 1,
      JSON.stringify([
        { title: '定义函数签名', description: '创建 `createAgentPrompt(role, task, constraints)` 函数，接收三个参数', hint: '使用 `function createAgentPrompt(role, task, constraints) { }` 定义函数', referenceCode: 'function createAgentPrompt(role, task, constraints) {\n  // 函数体待实现\n}', expectedResult: '函数定义成功，编辑器无语法错误。此时调用 createAgentPrompt("测试", "测试", []) 会返回 undefined（因为还没有 return）。' },
        { title: '拼接角色信息', description: '在返回的字符串中包含 role 参数', hint: '使用模板字符串 `${role}` 嵌入角色名', referenceCode: 'function createAgentPrompt(role, task, constraints) {\n  return `角色：${role}`\n}', expectedResult: '调用 createAgentPrompt("审查员", "审查代码", []) 返回 "角色：审查员"' },
        { title: '拼接任务描述', description: '在返回的字符串中包含 task 参数', hint: '继续使用模板字符串拼接 task', referenceCode: 'function createAgentPrompt(role, task, constraints) {\n  return `角色：${role}\\n任务：${task}`\n}', expectedResult: '返回值同时包含 role 和 task 的内容，例如 "角色：审查员\\n任务：审查代码"' },
        { title: '拼接约束条件', description: '遍历 constraints 数组，将每一项都加入返回字符串', hint: '使用 `constraints.map(c => ...).join(\'\\n\')` 遍历数组', referenceCode: "function createAgentPrompt(role, task, constraints) {\n  const constraintText = constraints.map(c => `- ${c}`).join('\\n')\n  return `角色：${role}\\n任务：${task}\\n约束：\\n${constraintText}`\n}", expectedResult: '返回值包含 role、task 和所有 constraints。例如 constraints=["用中文"] 时，返回值包含 "- 用中文"。全部 4 个测试应通过。' }
      ]),
      JSON.stringify([
        { name: '包含角色信息', input: ['reviewer', '审查代码', ['使用中文']], expected: 'reviewer', mode: 'contains', description: '返回值应包含 role 参数' },
        { name: '包含任务描述', input: ['reviewer', '审查代码', ['使用中文']], expected: '审查代码', mode: 'contains', description: '返回值应包含 task 参数' },
        { name: '包含约束条件', input: ['reviewer', '审查代码', ['使用中文']], expected: '使用中文', mode: 'contains', description: '返回值应包含 constraints 中的每一项' },
        { name: '多约束处理', input: ['assistant', '回答问题', ['简洁', '准确', '友好']], expected: '友好', mode: 'contains', description: '应包含所有约束条件' }
      ]),
      'createAgentPrompt',
      '使用模板字符串（反引号）可以方便地拼接多行文本。constraints 是数组，需要用 map 遍历。',
      0
    )

    // ===== 任务 2：工具管理器（进阶）=====
    insertTask.run(
      2, 9, '工具管理器',
      '实现一个函数 `manageTools`，模拟 ToolRegistry 的核心功能：注册工具、获取定义、执行工具。\n\n**函数签名**：`manageTools(tools: any[], action: string, target?: string, params?: any): any`\n\n**参数说明**：\n- `tools`：要注册的工具数组，每个工具形如 `{name, description, parameters, handler}`\n- `action`：操作类型，`\'definitions\'` 返回所有工具定义，`\'execute\'` 执行指定工具\n- `target`：要执行的工具名（action 为 `\'execute\'` 时使用）\n- `params`：传给工具的参数（action 为 `\'execute\'` 时使用）\n\n**返回值**：\n- action=`\'definitions\'`：返回 `[{name, description, parameters}]` 数组（不含 handler）\n- action=`\'execute\'`：返回工具 handler 的执行结果',
      '// 实现工具管理函数\n// 模拟ToolRegistry的核心功能\nfunction manageTools(tools, action, target, params) {\n  // TODO: 在这里实现你的代码\n  // 1. 创建一个内部存储（Map或对象）\n  // 2. 注册所有tools\n  // 3. 根据action执行对应操作\n  \n}',
      'function manageTools(tools, action, target, params) {\n  const registry = new Map()\n  for (const t of tools) registry.set(t.name, t)\n  if (action === \'definitions\') {\n    return Array.from(registry.values()).map(t => ({ name: t.name, description: t.description, parameters: t.parameters }))\n  }\n  if (action === \'execute\') {\n    const tool = registry.get(target)\n    return tool ? tool.handler(params) : null\n  }\n  return null\n}',
      'tests', '', 'medium', 1,
      JSON.stringify([
        { title: '创建内部存储', description: '在函数内部创建一个 Map 或对象，用于存储工具', hint: '使用 `const registry = new Map()` 创建映射', referenceCode: 'function manageTools(tools, action, target, params) {\n  const registry = new Map()\n  // 待注册工具\n}', expectedResult: '函数能正常运行，registry 为空 Map。此时调用 manageTools([], "definitions") 返回 undefined。' },
        { title: '注册工具', description: '遍历 tools 数组，将每个工具按 name 存入 registry', hint: '使用 `tools.forEach(t => registry.set(t.name, t))` 或 for 循环', referenceCode: 'function manageTools(tools, action, target, params) {\n  const registry = new Map()\n  for (const t of tools) registry.set(t.name, t)\n  // 待实现操作\n}', expectedResult: 'registry 中包含所有传入的工具。manageTools([{name:"a",...}], "definitions") 仍返回 undefined（操作逻辑还没写）。' },
        { title: '实现 definitions 操作', description: '当 action 为 \'definitions\' 时，返回所有工具的定义（不含 handler）', hint: '使用 `Array.from(registry.values()).map(t => ({...}))` 提取并裁剪字段', referenceCode: 'function manageTools(tools, action, target, params) {\n  const registry = new Map()\n  for (const t of tools) registry.set(t.name, t)\n  if (action === \'definitions\') {\n    return Array.from(registry.values()).map(t => ({ name: t.name, description: t.description, parameters: t.parameters }))\n  }\n  return null\n}', expectedResult: 'manageTools(tools, "definitions") 返回工具定义数组（不含 handler）。测试1和测试3应通过。' },
        { title: '实现 execute 操作', description: '当 action 为 \'execute\' 时，查找并调用对应工具的 handler', hint: '使用 `registry.get(target)` 查找工具，然后 `tool.handler(params)` 执行', referenceCode: "function manageTools(tools, action, target, params) {\n  const registry = new Map()\n  for (const t of tools) registry.set(t.name, t)\n  if (action === 'definitions') {\n    return Array.from(registry.values()).map(t => ({ name: t.name, description: t.description, parameters: t.parameters }))\n  }\n  if (action === 'execute') {\n    const tool = registry.get(target)\n    return tool ? tool.handler(params) : null\n  }\n  return null\n}", expectedResult: '全部 4 个测试通过：definitions 返回定义数组、execute 调用 handler 返回结果、空列表返回空数组、不存在工具返回 null。' }
      ]),
      JSON.stringify([
        { name: '获取工具定义', input: [[{ name: 'search', description: '搜索', parameters: { q: 'string' }, handler: () => 'ok' }], 'definitions'], expected: [{ name: 'search', description: '搜索', parameters: { q: 'string' } }], mode: 'equal', description: 'definitions 应返回不含 handler 的工具定义' },
        { name: '执行工具', input: [[{ name: 'calc', description: '计算器', parameters: {}, handler: (p) => p.x + p.y }], 'execute', 'calc', { x: 1, y: 2 }], expected: 3, mode: 'equal', description: 'execute 应调用 handler 并返回结果' },
        { name: '空工具列表', input: [[], 'definitions'], expected: [], mode: 'equal', description: '空列表应返回空数组' },
        { name: '执行不存在的工具', input: [[{ name: 'a', description: 'A', parameters: {}, handler: () => 1 }], 'execute', 'b', null], expected: null, mode: 'equal', description: '执行不存在的工具应返回 null' }
      ]),
      'manageTools',
      '使用 Map 存储工具，key 是 name，value 是整个工具对象。definitions 操作要排除 handler 字段。',
      0
    )

    // ===== 任务 3：工作流执行器（高级）=====
    insertTask.run(
      3, 11, '工作流执行器',
      '实现一个函数 `executeWorkflow`，执行 Plan-Execute-Review 工作流。\n\n**函数签名**：`executeWorkflow(taskName: string, steps: Array<{name: string, handler: () => any}>): {plan: string[], results: any[], review: string}`\n\n**参数说明**：\n- `taskName`：任务名称（用于 review 摘要）\n- `steps`：步骤数组，每个步骤有 `name` 和 `handler`（执行函数）\n\n**返回值**：\n- `plan`：所有步骤名称组成的数组\n- `results`：所有步骤 handler 执行结果组成的数组\n- `review`：固定格式 `\'工作流完成：N 个步骤全部成功\'`，其中 N 是步骤数',
      '// 实现工作流执行器\n// 执行Plan-Execute-Review三阶段工作流\nfunction executeWorkflow(taskName, steps) {\n  // TODO: 在这里实现你的代码\n  // 1. Plan: 提取所有步骤名\n  // 2. Execute: 依次执行每个handler\n  // 3. Review: 生成总结\n  \n}',
      'function executeWorkflow(taskName, steps) {\n  const plan = steps.map(s => s.name)\n  const results = steps.map(s => s.handler())\n  const review = `工作流完成：${steps.length} 个步骤全部成功`\n  return { plan, results, review }\n}',
      'tests', '', 'hard', 1,
      JSON.stringify([
        { title: 'Plan 阶段', description: '提取 steps 中所有步骤的 name，组成 plan 数组', hint: '使用 `steps.map(s => s.name)` 提取名称', referenceCode: 'function executeWorkflow(taskName, steps) {\n  const plan = steps.map(s => s.name)\n  // 待实现 Execute 和 Review\n  return { plan, results: [], review: \'\' }\n}', expectedResult: 'plan 数组包含所有步骤名。例如 steps=[{name:"A",...}] 时 plan=["A"]。' },
        { title: 'Execute 阶段', description: '依次调用每个步骤的 handler，收集结果到 results 数组', hint: '使用 `steps.map(s => s.handler())` 执行所有 handler', referenceCode: 'function executeWorkflow(taskName, steps) {\n  const plan = steps.map(s => s.name)\n  const results = steps.map(s => s.handler())\n  return { plan, results, review: \'\' }\n}', expectedResult: 'results 数组包含所有 handler 的执行结果。例如 handler=()=>1 时 results=[1]。' },
        { title: 'Review 阶段', description: '生成固定格式的 review 字符串', hint: '模板字符串：`工作流完成：${steps.length} 个步骤全部成功`', referenceCode: 'function executeWorkflow(taskName, steps) {\n  const plan = steps.map(s => s.name)\n  const results = steps.map(s => s.handler())\n  const review = `工作流完成：${steps.length} 个步骤全部成功`\n  return { plan, results, review }\n}', expectedResult: 'review 字符串格式为"工作流完成：N 个步骤全部成功"，N 为步骤数。全部 3 个测试应通过。' },
        { title: '组装返回值', description: '返回 {plan, results, review} 对象', hint: '直接 `return { plan, results, review }`', referenceCode: "function executeWorkflow(taskName, steps) {\n  const plan = steps.map(s => s.name)\n  const results = steps.map(s => s.handler())\n  const review = `工作流完成：${steps.length} 个步骤全部成功`\n  return { plan, results, review }\n}", expectedResult: '返回对象 {plan, results, review} 三个字段都正确。全部 3 个测试通过。' }
      ]),
      JSON.stringify([
        { name: '单步骤工作流', input: ['测试任务', [{ name: '步骤1', handler: () => '结果1' }]], expected: { plan: ['步骤1'], results: ['结果1'], review: '工作流完成：1 个步骤全部成功' }, mode: 'equal', description: '单个步骤的完整工作流' },
        { name: '多步骤工作流', input: ['多步任务', [{ name: 'A', handler: () => 1 }, { name: 'B', handler: () => 2 }]], expected: { plan: ['A', 'B'], results: [1, 2], review: '工作流完成：2 个步骤全部成功' }, mode: 'equal', description: '多个步骤的完整工作流' },
        { name: '空工作流', input: ['空任务', []], expected: { plan: [], results: [], review: '工作流完成：0 个步骤全部成功' }, mode: 'equal', description: '空步骤列表的工作流' }
      ]),
      'executeWorkflow',
      'plan 是步骤名数组，results 是 handler 执行结果数组，review 是固定格式的字符串。三个字段顺序对应。',
      0
    )

    // ===== 任务 4：Agent 消息总线（高级）=====
    insertTask.run(
      4, 13, 'Agent 消息总线',
      '实现一个函数 `routeMessages`，模拟多 Agent 间的消息路由。\n\n**函数签名**：`routeMessages(messages: Array<{from: string, to: string, content: string}>, agentId: string): Array<{from: string, content: string}>`\n\n**参数说明**：\n- `messages`：所有消息列表，每条消息有 `from`（发送者）、`to`（接收者）、`content`（内容）\n- `agentId`：要查询的 Agent ID\n\n**返回值**：\n- 返回所有 `to === agentId` 的消息，只保留 `from` 和 `content` 字段，按原顺序排列',
      '// 实现消息路由\n// 模拟多Agent间的消息传递\nfunction routeMessages(messages, agentId) {\n  // TODO: 在这里实现你的代码\n  // 1. 过滤出目标Agent的消息\n  // 2. 只保留from和content字段\n  \n}',
      'function routeMessages(messages, agentId) {\n  return messages\n    .filter(m => m.to === agentId)\n    .map(m => ({ from: m.from, content: m.content }))\n}',
      'tests', '', 'hard', 1,
      JSON.stringify([
        { title: '过滤目标消息', description: '从 messages 中筛选 to === agentId 的消息', hint: '使用 `messages.filter(m => m.to === agentId)` 过滤', referenceCode: 'function routeMessages(messages, agentId) {\n  const filtered = messages.filter(m => m.to === agentId)\n  // 待裁剪字段\n  return filtered\n}', expectedResult: 'filtered 只包含 to === agentId 的消息。例如 agentId="B" 时只保留 to:"B" 的消息。' },
        { title: '裁剪字段', description: '每条消息只保留 from 和 content 两个字段', hint: '使用 `.map(m => ({ from: m.from, content: m.content }))` 重组', referenceCode: 'function routeMessages(messages, agentId) {\n  return messages\n    .filter(m => m.to === agentId)\n    .map(m => ({ from: m.from, content: m.content }))\n}', expectedResult: '返回的消息只含 from 和 content 字段（不含 to）。全部 4 个测试应通过。' },
        { title: '保持顺序', description: '返回的消息顺序应与原数组中的顺序一致', hint: 'filter 和 map 不会改变顺序，链式调用即可', referenceCode: 'function routeMessages(messages, agentId) {\n  return messages\n    .filter(m => m.to === agentId)\n    .map(m => ({ from: m.from, content: m.content }))\n}', expectedResult: 'filter 和 map 不改变原始顺序，返回的消息与原数组中的相对顺序一致。全部 4 个测试通过。' }
      ]),
      JSON.stringify([
        { name: '接收单条消息', input: [[{ from: 'A', to: 'B', content: '你好' }], 'B'], expected: [{ from: 'A', content: '你好' }], mode: 'equal', description: 'B 应收到 A 发来的消息' },
        { name: '接收多条消息', input: [[{ from: 'A', to: 'B', content: '你好' }, { from: 'C', to: 'B', content: '嗨' }], 'B'], expected: [{ from: 'A', content: '你好' }, { from: 'C', content: '嗨' }], mode: 'equal', description: 'B 应收到所有发给它的消息' },
        { name: '无消息', input: [[{ from: 'A', to: 'B', content: '你好' }], 'C'], expected: [], mode: 'equal', description: 'C 没有消息应返回空数组' },
        { name: '广播场景', input: [[{ from: 'A', to: 'B', content: '1' }, { from: 'A', to: 'C', content: '2' }, { from: 'A', to: 'B', content: '3' }], 'B'], expected: [{ from: 'A', content: '1' }, { from: 'A', content: '3' }], mode: 'equal', description: 'B 应收到 2 条消息，顺序保持' }
      ]),
      'routeMessages',
      '使用 filter 过滤目标消息，再用 map 裁剪字段。两个操作可以链式调用：messages.filter(...).map(...)',
      0
    )

    // ===== 任务 5：文档检索器（高级）=====
    insertTask.run(
      5, 15, '文档检索器',
      '实现一个函数 `retrieveDocuments`，基于关键词匹配进行文档检索（模拟 RAG 中的检索环节）。\n\n**函数签名**：`retrieveDocuments(documents: string[], query: string, topK: number): string[]`\n\n**参数说明**：\n- `documents`：文档列表（每个文档是一个字符串，空格分词）\n- `query`：查询字符串\n- `topK`：返回的文档数量上限\n\n**返回值**：\n- 按与 query 的相似度（共享单词数）降序排列\n- 返回前 topK 个文档\n- 相似度相同的文档保持原顺序\n- 若 documents 为空，返回空数组\n- 若 topK 大于文档数，返回全部文档',
      '// 实现文档检索器\n// 基于关键词匹配的简单检索（模拟RAG）\nfunction retrieveDocuments(documents, query, topK) {\n  // TODO: 在这里实现你的代码\n  // 1. 将query拆分为单词\n  // 2. 计算每个文档与query的相似度（共享单词数）\n  // 3. 按相似度降序排序\n  // 4. 取前topK个\n  \n}',
      'function retrieveDocuments(documents, query, topK) {\n  if (documents.length === 0) return []\n  const queryWords = new Set(query.split(/\\s+/))\n  const scored = documents.map(doc => {\n    const docWords = new Set(doc.split(/\\s+/))\n    let score = 0\n    for (const w of docWords) if (queryWords.has(w)) score++\n    return { doc, score }\n  })\n  scored.sort((a, b) => b.score - a.score)\n  return scored.slice(0, topK).map(s => s.doc)\n}',
      'tests', '', 'hard', 1,
      JSON.stringify([
        { title: '查询分词', description: '将 query 字符串按空格拆分为单词集合', hint: '使用 `new Set(query.split(/\\s+/))` 创建单词集合', referenceCode: 'function retrieveDocuments(documents, query, topK) {\n  const queryWords = new Set(query.split(/\\s+/))\n  // 待计算相似度\n  return []\n}', expectedResult: 'queryWords 是 Set，包含 query 按空格拆分的所有单词。例如 query="苹果 香蕉" 时 queryWords={"苹果","香蕉"}。' },
        { title: '计算相似度', description: '对每个文档，统计与 query 共享的单词数量', hint: '遍历文档单词，检查是否在 queryWords 中：`if (queryWords.has(w)) score++`', referenceCode: 'function retrieveDocuments(documents, query, topK) {\n  if (documents.length === 0) return []\n  const queryWords = new Set(query.split(/\\s+/))\n  const scored = documents.map(doc => {\n    const docWords = new Set(doc.split(/\\s+/))\n    let score = 0\n    for (const w of docWords) if (queryWords.has(w)) score++\n    return { doc, score }\n  })\n  // 待排序\n  return scored.map(s => s.doc)\n}', expectedResult: '每个文档都有一个 score 值，表示与 query 共享的单词数。例如 doc="苹果 香蕉" query="苹果" 时 score=1。' },
        { title: '排序', description: '按相似度降序排序，相似度相同的保持原顺序', hint: '使用 `scored.sort((a, b) => b.score - a.score)` 降序排列', referenceCode: 'function retrieveDocuments(documents, query, topK) {\n  if (documents.length === 0) return []\n  const queryWords = new Set(query.split(/\\s+/))\n  const scored = documents.map(doc => {\n    const docWords = new Set(doc.split(/\\s+/))\n    let score = 0\n    for (const w of docWords) if (queryWords.has(w)) score++\n    return { doc, score }\n  })\n  scored.sort((a, b) => b.score - a.score)\n  return scored.map(s => s.doc)\n}', expectedResult: '文档按 score 降序排列。相似度高的排前面，相同 score 保持原顺序。' },
        { title: '截取 topK', description: '取前 topK 个文档返回', hint: '使用 `scored.slice(0, topK).map(s => s.doc)` 截取并提取文档', referenceCode: 'function retrieveDocuments(documents, query, topK) {\n  if (documents.length === 0) return []\n  const queryWords = new Set(query.split(/\\s+/))\n  const scored = documents.map(doc => {\n    const docWords = new Set(doc.split(/\\s+/))\n    let score = 0\n    for (const w of docWords) if (queryWords.has(w)) score++\n    return { doc, score }\n  })\n  scored.sort((a, b) => b.score - a.score)\n  return scored.slice(0, topK).map(s => s.doc)\n}', expectedResult: '返回前 topK 个文档。全部 5 个测试通过。' }
      ]),
      JSON.stringify([
        { name: '基本检索', input: [['苹果 香蕉', '橙子 葡萄', '苹果 橙子'], '苹果', 2], expected: ['苹果 香蕉', '苹果 橙子'], mode: 'equal', description: '查询"苹果"应返回包含"苹果"的文档' },
        { name: 'topK 超过文档数', input: [['苹果 香蕉'], '苹果', 5], expected: ['苹果 香蕉'], mode: 'equal', description: 'topK > 文档数时返回全部' },
        { name: '空文档列表', input: [[], '苹果', 3], expected: [], mode: 'equal', description: '空列表应返回空数组' },
        { name: '无匹配文档', input: [['橙子 葡萄'], '苹果', 1], expected: ['橙子 葡萄'], mode: 'equal', description: '无匹配时仍返回文档（相似度 0，但仍有内容）' },
        { name: '多词查询', input: [['苹果 香蕉', '苹果 橙子', '香蕉 橙子'], '苹果 香蕉', 2], expected: ['苹果 香蕉', '苹果 橙子'], mode: 'equal', description: '多词查询按共享词数排序' }
      ]),
      'retrieveDocuments',
      '使用 Set 存储单词便于快速查找。相似度 = 两个文档共享的单词数。排序后取前 topK 个。',
      0
    )

    // ===== 任务 6：综合实战引导项目 - Mini Agent =====
    insertTask.run(
      6, null, '综合实战：构建 Mini Agent',
      '在本任务中，你将综合运用前面学到的知识，构建一个简单的 Mini Agent。\n\n**场景**：用户提出问题，Agent 从知识库（文档列表）中检索相关内容，然后生成回答。\n\n**函数签名**：`runAgent(question: string, documents: string[]): string`\n\n**Agent 工作流程**：\n1. **检索**：从 documents 中找到与 question 关键词匹配的文档（复用任务 5 的逻辑）\n2. **生成**：基于检索到的文档，构造回答字符串\n\n**回答格式要求**：\n- 若检索到相关文档：返回 `\'根据知识库：\' + 检索到的第一条文档内容`\n- 若未检索到相关文档：返回 `\'抱歉，知识库中没有找到相关信息。\'`\n\n**这是一个引导式综合项目**，请按照右侧步骤提示逐步完成。完成后，你将拥有一个可以实际运行的 Mini Agent！',
      '// 综合实战：构建Mini Agent\n// 这个Agent能根据问题检索文档并生成回答\nfunction runAgent(question, documents) {\n  // ===== 步骤1：实现检索函数 =====\n  // 提示：可以参考任务5的实现\n  function retrieve(query, docs, topK) {\n    // TODO: 实现关键词检索\n    \n  }\n  \n  // ===== 步骤2：实现回答生成 =====\n  // 提示：根据检索结果构造回答\n  function generateAnswer(retrievedDocs, question) {\n    // TODO: 根据检索结果生成回答\n    \n  }\n  \n  // ===== 步骤3：组合Agent流程 =====\n  // 提示：检索 + 生成\n  \n}',
      'function runAgent(question, documents) {\n  function retrieve(query, docs, topK) {\n    if (docs.length === 0) return []\n    const queryWords = new Set(query.split(/\\s+/))\n    const scored = docs.map(doc => {\n      const docWords = new Set(doc.split(/\\s+/))\n      let score = 0\n      for (const w of docWords) if (queryWords.has(w)) score++\n      return { doc, score }\n    })\n    scored.sort((a, b) => b.score - a.score)\n    return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.doc)\n  }\n  function generateAnswer(retrievedDocs, question) {\n    if (retrievedDocs.length === 0) return \'抱歉，知识库中没有找到相关信息。\'\n    return \'根据知识库：\' + retrievedDocs[0]\n  }\n  const retrieved = retrieve(question, documents, 1)\n  return generateAnswer(retrieved, question)\n}',
      'tests', '', 'hard', 2,
      JSON.stringify([
        { title: '实现检索函数', description: '在 runAgent 内部定义 retrieve(query, docs, topK) 函数，基于关键词匹配检索文档', hint: '参考任务5：用 Set 存储单词，统计共享词数，按相似度排序取 topK', referenceCode: 'function runAgent(question, documents) {\n  function retrieve(query, docs, topK) {\n    if (docs.length === 0) return []\n    const queryWords = new Set(query.split(/\\s+/))\n    const scored = docs.map(doc => {\n      const docWords = new Set(doc.split(/\\s+/))\n      let score = 0\n      for (const w of docWords) if (queryWords.has(w)) score++\n      return { doc, score }\n    })\n    scored.sort((a, b) => b.score - a.score)\n    return scored.slice(0, topK).map(s => s.doc)\n  }\n  // 待实现生成\n}', expectedResult: 'retrieve 函数能正常工作。retrieve("苹果", ["苹果 香蕉", "橙子"], 1) 返回 ["苹果 香蕉"]。' },
        { title: '过滤零相似度文档', description: '检索结果应排除相似度为 0 的文档（无任何共享单词）', hint: '在排序后用 `scored.filter(s => s.score > 0)` 过滤', referenceCode: 'function runAgent(question, documents) {\n  function retrieve(query, docs, topK) {\n    if (docs.length === 0) return []\n    const queryWords = new Set(query.split(/\\s+/))\n    const scored = docs.map(doc => {\n      const docWords = new Set(doc.split(/\\s+/))\n      let score = 0\n      for (const w of docWords) if (queryWords.has(w)) score++\n      return { doc, score }\n    })\n    scored.sort((a, b) => b.score - a.score)\n    return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.doc)\n  }\n  // 待实现生成\n}', expectedResult: 'retrieve 现在会过滤 score=0 的文档。retrieve("苹果", ["橙子 葡萄"], 1) 返回 []（无匹配）。' },
        { title: '实现回答生成', description: '定义 generateAnswer(retrievedDocs, question) 函数：有文档时返回"根据知识库："+第一条；无文档时返回"抱歉..."', hint: '使用 if-else 判断 retrievedDocs.length 是否为 0', referenceCode: "function runAgent(question, documents) {\n  function retrieve(query, docs, topK) {\n    if (docs.length === 0) return []\n    const queryWords = new Set(query.split(/\\s+/))\n    const scored = docs.map(doc => {\n      const docWords = new Set(doc.split(/\\s+/))\n      let score = 0\n      for (const w of docWords) if (queryWords.has(w)) score++\n      return { doc, score }\n    })\n    scored.sort((a, b) => b.score - a.score)\n    return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.doc)\n  }\n  function generateAnswer(retrievedDocs, question) {\n    if (retrievedDocs.length === 0) return '抱歉，知识库中没有找到相关信息。'\n    return '根据知识库：' + retrievedDocs[0]\n  }\n  // 待组合\n}", expectedResult: 'generateAnswer([], "test") 返回"抱歉，知识库中没有找到相关信息。"；generateAnswer(["文档1"], "test") 返回"根据知识库：文档1"。' },
        { title: '组合 Agent 流程', description: '调用 retrieve 检索，再调用 generateAnswer 生成回答，返回最终结果', hint: 'const retrieved = retrieve(question, documents, 1); return generateAnswer(retrieved, question)', referenceCode: "function runAgent(question, documents) {\n  function retrieve(query, docs, topK) {\n    if (docs.length === 0) return []\n    const queryWords = new Set(query.split(/\\s+/))\n    const scored = docs.map(doc => {\n      const docWords = new Set(doc.split(/\\s+/))\n      let score = 0\n      for (const w of docWords) if (queryWords.has(w)) score++\n      return { doc, score }\n    })\n    scored.sort((a, b) => b.score - a.score)\n    return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.doc)\n  }\n  function generateAnswer(retrievedDocs, question) {\n    if (retrievedDocs.length === 0) return '抱歉，知识库中没有找到相关信息。'\n    return '根据知识库：' + retrievedDocs[0]\n  }\n  const retrieved = retrieve(question, documents, 1)\n  return generateAnswer(retrieved, question)\n}", expectedResult: 'runAgent("苹果是什么", ["苹果是一种水果"]) 返回"根据知识库：苹果是一种水果"。runAgent("量子物理", ["苹果"]) 返回"抱歉，知识库中没有找到相关信息。"。全部 4 个测试通过。' }
      ]),
      JSON.stringify([
        { name: '有相关文档', input: ['苹果是什么', ['苹果是一种水果', '香蕉是黄色的']], expected: '根据知识库：', mode: 'contains', description: '应返回包含"根据知识库："的回答' },
        { name: '回答包含文档内容', input: ['苹果是什么', ['苹果是一种水果', '香蕉是黄色的']], expected: '苹果是一种水果', mode: 'contains', description: '回答应包含检索到的文档内容' },
        { name: '无相关文档', input: ['量子物理是什么', ['苹果是一种水果']], expected: '抱歉', mode: 'contains', description: '无匹配时应返回包含"抱歉"的提示' },
        { name: '空知识库', input: ['测试', []], expected: '抱歉', mode: 'contains', description: '空知识库应返回抱歉提示' }
      ]),
      'runAgent',
      '这是一个组合任务：检索（参考任务5）+ 生成。关键是检索函数要过滤掉零相似度的文档，这样无匹配时会走到"抱歉"分支。',
      1
    )
  })

  seed()
}

export function getDatabase(): Database.Database {
  return db
}

export function closeDatabase(): void {
  if (db) db.close()
}