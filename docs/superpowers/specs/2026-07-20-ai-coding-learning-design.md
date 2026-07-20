# AI Coding 学习软件 - 设计文档

> 日期: 2026-07-20 | 状态: 设计中

## 1. 概述

一款基于 Electron + Vue 3 的桌面端 AI 编程学习软件，帮助用户系统学习如何使用 Agent 进行编程。核心功能：全流程学习资源、实操演练平台、学习进度追踪。

## 2. 技术栈

| 层面 | 选型 |
|------|------|
| 桌面框架 | Electron 28+ |
| 前端框架 | Vue 3 + TypeScript + Composition API |
| 构建工具 | Vite + electron-vite |
| UI 组件库 | 自定义组件（竹绿色主题） |
| 代码编辑器 | Monaco Editor |
| 图表 | ECharts |
| 数据存储 | better-sqlite3 (本地 SQLite) |
| 路由 | Vue Router 4 |
| 状态管理 | Pinia |
| Markdown 渲染 | markdown-it + highlight.js |

## 3. 架构设计

### 3.1 进程架构

```
Electron 应用
├── 主进程 (Main Process)
│   ├── SQLite 数据库管理 (better-sqlite3)
│   ├── 文件系统操作 (课程资源读写)
│   ├── IPC 通信 (ipcMain handlers)
│   └── 窗口管理 (BrowserWindow)
│
└── 渲染进程 (Renderer Process)
    ├── Vue 3 应用
    ├── 页面路由 (Vue Router)
    ├── 状态管理 (Pinia stores)
    └── UI 组件树
```

### 3.2 IPC 通信设计

| 通道 | 方向 | 用途 |
|------|------|------|
| `db:query` | Renderer → Main | 数据库查询 |
| `db:execute` | Renderer → Main | 数据库写入 |
| `fs:read-course` | Renderer → Main | 读取课程文件 |
| `fs:save-code` | Renderer → Main | 保存用户代码 |
| `app:get-version` | Renderer → Main | 获取应用版本 |

### 3.3 页面路由

```
/                    → 首页 Dashboard
/learn               → 学习中心（课程列表）
/learn/:courseId     → 课程详情（章节树）
/learn/:courseId/:chapterId → 章节内容（阅读/视频）
/practice            → 实操实验室（任务列表）
/practice/:taskId    → 实操任务（代码编辑器 + AI 对话）
/progress            → 学习进度（统计图表）
/settings            → 设置
```

## 4. 功能模块

### 4.1 首页 Dashboard

- 今日学习概览（今日时长、完成任务数）
- "继续学习"快捷入口（跳转到上次学习位置）
- 学习统计卡片（总时长、完成课程数、连续学习天数）
- 推荐课程卡片

### 4.2 学习中心

- 课程分类筛选（基础入门 / Agent 原理 / 实战项目 / 进阶技巧）
- 课程卡片列表（标题、简介、难度、预计时长、完成进度）
- 章节树导航（左侧面板）
- 内容阅读区（Markdown 渲染，支持代码高亮）
- 内置课程资源覆盖以下主题（近一年最新内容）:
  - Agent 基础概念与架构
  - Prompt Engineering 进阶
  - Tool Calling / Function Calling
  - Agent 工作流设计（Plan-Execute-Review）
  - 多 Agent 协作模式
  - RAG（检索增强生成）在 Agent 中的应用
  - Code Agent 实战（代码生成、审查、重构）
  - MCP 协议与工具集成
  - Agent 安全与对齐

### 4.3 实操实验室

- 分屏布局：左侧代码编辑器，右侧任务面板 + AI 模拟对话
- 代码编辑器：Monaco Editor，支持语法高亮、自动补全、多语言
- 任务面板：显示当前任务描述、步骤指引、预期结果
- AI 模拟引擎：预设交互脚本，模拟 Agent 对话流程
  - 用户输入指令 → 模拟 Agent 响应 → 展示代码生成/修改 → 用户验证
- 任务类型：
  - 补全代码（给定部分代码，补全缺失部分）
  - 调试修复（给定错误代码，找出并修复 Bug）
  - Agent 指令编写（根据需求编写 Agent prompt/指令）
  - 项目构建（从零构建小项目，分步引导）

### 4.4 学习进度

- 学习时长统计（日/周/月维度，折线图）
- 课程完成度（饼图 / 进度环）
- 任务通过率（柱状图）
- 学习日历热力图（类似 GitHub 贡献图）
- 学习周报（本周总结 + 下周建议）

### 4.5 设置

- 主题切换（仅竹绿色主题，可选深浅模式）
- 编辑器字体大小、tab 大小
- 学习提醒（定时提醒学习）
- 数据导出/导入

## 5. 数据模型

### 5.1 数据库表结构

```sql
-- 用户配置
CREATE TABLE user_config (
    id INTEGER PRIMARY KEY,
    nickname TEXT DEFAULT '学习者',
    avatar TEXT,
    daily_goal_minutes INTEGER DEFAULT 30,
    reminder_enabled INTEGER DEFAULT 0,
    reminder_time TEXT DEFAULT '09:00',
    created_at TEXT DEFAULT (datetime('now'))
);

-- 课程
CREATE TABLE courses (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT CHECK(difficulty IN ('beginner','intermediate','advanced')) DEFAULT 'beginner',
    description TEXT,
    cover_image TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 章节
CREATE TABLE chapters (
    id INTEGER PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,  -- Markdown 内容
    type TEXT CHECK(type IN ('theory','practice')) DEFAULT 'theory',
    estimated_minutes INTEGER DEFAULT 10,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 实操任务
CREATE TABLE tasks (
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

-- 学习记录
CREATE TABLE learning_records (
    id INTEGER PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id),
    task_id INTEGER REFERENCES tasks(id),
    status TEXT CHECK(status IN ('in_progress','completed','skipped')) DEFAULT 'in_progress',
    user_code TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    duration_seconds INTEGER DEFAULT 0
);

-- 学习会话（每日统计用）
CREATE TABLE learning_sessions (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    total_seconds INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
```

### 5.2 课程资源文件结构

```
resources/courses/
├── 01-agent-basics/
│   ├── meta.json          # 课程元数据
│   ├── 01-intro.md        # 章节1: Agent 是什么
│   ├── 02-architecture.md # 章节2: Agent 架构
│   └── 03-first-agent.md  # 章节3: 第一个 Agent
├── 02-prompt-engineering/
│   └── ...
├── 03-tool-calling/
│   └── ...
└── ...
```

## 6. UI 设计规范

### 6.1 色彩系统

| Token | 色值 | 用途 |
|-------|------|------|
| `--color-primary` | `#4A7C59` | 主色，按钮、选中态、图标 |
| `--color-primary-light` | `#6B9B76` | 浅主色，hover 态 |
| `--color-primary-dark` | `#3A6347` | 深主色，active 态 |
| `--color-primary-bg` | `#EDF4EE` | 主色背景，标签、卡片背景 |
| `--color-bg` | `#F7F9F5` | 页面背景 |
| `--color-bg-card` | `#FFFFFF` | 卡片背景 |
| `--color-bg-sidebar` | `#2C3E2D` | 侧边栏背景 |
| `--color-text` | `#2C3E2D` | 主要文字 |
| `--color-text-secondary` | `#6B7D6D` | 次要文字 |
| `--color-accent` | `#D4A853` | 强调色（竹节金） |
| `--color-success` | `#5B8C5A` | 成功 |
| `--color-warning` | `#D4A853` | 警告 |
| `--color-error` | `#C75B53` | 错误 |
| `--color-border` | `#DDE5DB` | 边框 |

### 6.2 布局规范

- 侧边栏宽度: 240px
- 内容区最大宽度: 1200px
- 卡片圆角: 12px
- 按钮圆角: 8px
- 间距基础单位: 4px（常用 8/12/16/24/32px）

### 6.3 字体

- 系统字体栈: `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`
- 代码字体: `"JetBrains Mono", "Fira Code", "Cascadia Code", monospace`

## 7. 项目结构

```
ai-coding-learner/
├── electron/
│   ├── main.ts              # 主进程入口
│   ├── preload.ts            # 预加载脚本
│   ├── database.ts           # SQLite 数据库初始化与操作
│   └── ipc-handlers.ts       # IPC 通信处理
├── src/
│   ├── main.ts               # Vue 应用入口
│   ├── App.vue               # 根组件
│   ├── router/
│   │   └── index.ts          # 路由配置
│   ├── stores/
│   │   ├── user.ts           # 用户状态
│   │   ├── courses.ts        # 课程状态
│   │   ├── practice.ts       # 实操状态
│   │   └── progress.ts       # 进度状态
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.vue
│   │   │   ├── AppHeader.vue
│   │   │   └── AppLayout.vue
│   │   ├── common/
│   │   │   ├── ProgressBar.vue
│   │   │   ├── StatCard.vue
│   │   │   ├── EmptyState.vue
│   │   │   └── LoadingSpinner.vue
│   │   ├── learn/
│   │   │   ├── CourseCard.vue
│   │   │   ├── ChapterTree.vue
│   │   │   └── ContentViewer.vue
│   │   ├── practice/
│   │   │   ├── CodeEditor.vue
│   │   │   ├── TaskPanel.vue
│   │   │   └── AiChatSimulator.vue
│   │   └── progress/
│   │       ├── DurationChart.vue
│   │       ├── CalendarHeatmap.vue
│   │       └── WeeklyReport.vue
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── LearnView.vue
│   │   ├── CourseDetailView.vue
│   │   ├── ChapterView.vue
│   │   ├── PracticeView.vue
│   │   ├── TaskView.vue
│   │   ├── ProgressView.vue
│   │   └── SettingsView.vue
│   ├── assets/
│   │   └── styles/
│   │       ├── variables.css    # CSS 变量（色彩、间距）
│   │       ├── global.css       # 全局样式
│   │       └── themes/
│   │           ├── light.css
│   │           └── dark.css
│   └── types/
│       └── index.ts             # TypeScript 类型定义
├── resources/
│   └── courses/                 # 内置课程资源
├── package.json
├── electron-builder.yml
├── vite.config.ts
└── tsconfig.json
```

## 8. 关键设计决策

1. **离线优先**: 所有课程资源内置在应用中，无需网络即可使用
2. **AI 模拟引擎**: 不依赖外部 API，通过预设的交互脚本模拟 Agent 对话，降低使用门槛
3. **本地存储**: SQLite 存储所有用户数据，隐私安全，响应快
4. **Monaco Editor**: 使用 VS Code 同款编辑器，提供专业编码体验
5. **自定义组件**: 不使用第三方 UI 库，完全自定义以确保竹绿色主题一致性

## 9. 自检清单

- [x] 无占位符/TODO
- [x] 架构与功能描述一致
- [x] 范围适中，适合单次实现
- [x] 需求无歧义