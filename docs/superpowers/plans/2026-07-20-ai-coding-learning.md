# AI Coding 学习软件 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款基于 Electron + Vue 3 的桌面端 AI 编程学习软件，包含学习资源、实操平台、进度追踪三大核心功能。

**Architecture:** Electron 双进程架构，主进程管理 SQLite 数据库和文件系统，渲染进程使用 Vue 3 + Pinia + Vue Router 构建 SPA 界面。内置课程资源以 Markdown 文件存储，AI 实操通过预设脚本模拟 Agent 对话。

**Tech Stack:** Electron 28+, Vue 3 + TypeScript, Vite, Pinia, Vue Router 4, Monaco Editor, ECharts, better-sqlite3, markdown-it

---

## 文件结构总览

```
ai-coding-learner/
├── electron/
│   ├── main.ts              # 创建: 主进程入口
│   ├── preload.ts            # 创建: 预加载脚本
│   ├── database.ts           # 创建: SQLite 数据库
│   └── ipc-handlers.ts       # 创建: IPC 处理
├── src/
│   ├── main.ts               # 创建: Vue 入口
│   ├── App.vue               # 创建: 根组件
│   ├── env.d.ts              # 创建: 类型声明
│   ├── router/index.ts       # 创建: 路由
│   ├── stores/
│   │   ├── user.ts           # 创建: 用户状态
│   │   ├── courses.ts        # 创建: 课程状态
│   │   ├── practice.ts       # 创建: 实操状态
│   │   └── progress.ts       # 创建: 进度状态
│   ├── types/index.ts        # 创建: 类型定义
│   ├── assets/styles/
│   │   ├── variables.css     # 创建: CSS 变量
│   │   └── global.css        # 创建: 全局样式
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
│   └── views/
│       ├── HomeView.vue
│       ├── LearnView.vue
│       ├── CourseDetailView.vue
│       ├── ChapterView.vue
│       ├── PracticeView.vue
│       ├── TaskView.vue
│       ├── ProgressView.vue
│       └── SettingsView.vue
├── resources/courses/        # 创建: 课程资源
│   ├── 01-agent-basics/
│   │   ├── meta.json
│   │   ├── 01-intro.md
│   │   ├── 02-architecture.md
│   │   └── 03-first-agent.md
│   ├── 02-prompt-engineering/
│   │   ├── meta.json
│   │   ├── 01-basics.md
│   │   ├── 02-advanced.md
│   │   └── 03-practice.md
│   ├── 03-tool-calling/
│   │   ├── meta.json
│   │   ├── 01-intro.md
│   │   ├── 02-implementation.md
│   │   └── 03-practice.md
│   ├── 04-agent-workflow/
│   │   ├── meta.json
│   │   ├── 01-plan-execute-review.md
│   │   └── 02-practice.md
│   ├── 05-multi-agent/
│   │   ├── meta.json
│   │   ├── 01-collaboration.md
│   │   └── 02-practice.md
│   └── 06-rag-agent/
│       ├── meta.json
│       ├── 01-rag-basics.md
│       └── 02-practice.md
├── package.json              # 创建
├── electron-builder.yml      # 创建
├── vite.config.ts            # 创建
├── tsconfig.json             # 创建
├── tsconfig.node.json        # 创建
└── index.html                # 创建
```

---

### Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `electron-builder.yml`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/env.d.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "ai-coding-learner",
  "version": "1.0.0",
  "description": "AI Coding 学习软件 - 学习如何使用 Agent 编程",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "electron:dev": "vite",
    "electron:build": "vite build && electron-builder"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "echarts": "^5.5.0",
    "highlight.js": "^11.9.0",
    "markdown-it": "^14.1.0",
    "monaco-editor": "^0.47.0",
    "pinia": "^2.1.7",
    "vue": "^3.4.0",
    "vue-echarts": "^6.7.0",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@vitejs/plugin-vue": "^5.0.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "typescript": "^5.3.0",
    "vite": "^5.1.0",
    "vite-plugin-electron": "^0.28.0",
    "vite-plugin-electron-renderer": "^0.14.0",
    "vue-tsc": "^2.0.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['better-sqlite3']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron'
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue", "src/env.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 electron-builder.yml**

```yaml
appId: com.ai-coding-learner
productName: AI Coding Learner
directories:
  buildResources: build
  output: release
files:
  - dist
  - dist-electron
  - resources
win:
  target:
    - nsis
  icon: build/icon.ico
mac:
  target:
    - dmg
  icon: build/icon.icns
linux:
  target:
    - AppImage
  icon: build/icon.png
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

- [ ] **Step 6: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Coding Learner</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 src/main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/variables.css'
import './assets/styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 8: 创建 src/App.vue**

```vue
<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
</script>
```

- [ ] **Step 9: 创建 src/env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    dbQuery: (sql: string, params?: any[]) => Promise<any>
    dbExecute: (sql: string, params?: any[]) => Promise<any>
    readCourseFile: (path: string) => Promise<string>
    saveCode: (taskId: number, code: string) => Promise<void>
    getAppVersion: () => Promise<string>
  }
}
```

- [ ] **Step 10: 安装依赖并验证**

Run: `cd d:\ai\6a5dd856e73672a131495d9d ; npm install`
Expected: 依赖安装成功

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: 项目脚手架搭建 - Electron + Vue 3 + Vite"
```

---

### Task 2: 全局样式与主题系统

**Files:**
- Create: `src/assets/styles/variables.css`
- Create: `src/assets/styles/global.css`

- [ ] **Step 1: 创建 CSS 变量文件**

```css
/* src/assets/styles/variables.css */
:root {
  /* 竹绿色主色系 */
  --color-primary: #4A7C59;
  --color-primary-light: #6B9B76;
  --color-primary-dark: #3A6347;
  --color-primary-bg: #EDF4EE;

  /* 背景色 */
  --color-bg: #F7F9F5;
  --color-bg-card: #FFFFFF;
  --color-bg-sidebar: #2C3E2D;
  --color-bg-hover: #E8F0E9;

  /* 文字色 */
  --color-text: #2C3E2D;
  --color-text-secondary: #6B7D6D;
  --color-text-light: #9AAB9B;
  --color-text-sidebar: #C8D6C9;
  --color-text-sidebar-active: #FFFFFF;

  /* 强调色 */
  --color-accent: #D4A853;
  --color-accent-light: #E6C97A;

  /* 状态色 */
  --color-success: #5B8C5A;
  --color-success-bg: #EDF7ED;
  --color-warning: #D4A853;
  --color-warning-bg: #FDF8ED;
  --color-error: #C75B53;
  --color-error-bg: #FDEDED;
  --color-info: #5B8CB8;
  --color-info-bg: #EDF3F8;

  /* 边框 */
  --color-border: #DDE5DB;
  --color-border-light: #EBF1EA;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(44, 62, 45, 0.06);
  --shadow-md: 0 4px 12px rgba(44, 62, 45, 0.08);
  --shadow-lg: 0 8px 24px rgba(44, 62, 45, 0.12);

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;

  /* 字体 */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-family-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace;
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;

  /* 布局 */
  --sidebar-width: 240px;
  --header-height: 56px;
  --content-max-width: 1200px;

  /* 过渡 */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.35s ease;
}
```

- [ ] **Step 2: 创建全局样式文件**

```css
/* src/assets/styles/global.css */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background-color: var(--color-bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  color: var(--color-primary-light);
}

button {
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  border: none;
  outline: none;
}

input, textarea, select {
  font-family: inherit;
  font-size: inherit;
  outline: none;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-light);
}

/* 通用按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 8px 20px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all var(--transition-fast);
  line-height: 1.5;
}

.btn-primary {
  background-color: var(--color-primary);
  color: #FFFFFF;
}

.btn-primary:hover {
  background-color: var(--color-primary-light);
}

.btn-primary:active {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: var(--color-primary-bg);
  color: var(--color-primary);
}

.btn-secondary:hover {
  background-color: var(--color-bg-hover);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline:hover {
  background-color: var(--color-primary-bg);
}

.btn-sm {
  padding: 4px 12px;
  font-size: var(--font-size-sm);
}

.btn-lg {
  padding: 12px 28px;
  font-size: var(--font-size-lg);
}

/* 通用卡片样式 */
.card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  padding: var(--spacing-xl);
  transition: box-shadow var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

/* 通用输入框 */
.input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}

/* 标签 */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.tag-primary {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.tag-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.tag-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

/* 页面标题 */
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--spacing-xl);
}

/* 页面容器 */
.page-container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--spacing-2xl);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn var(--transition-normal) ease-out;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/styles/
git commit -m "feat: 全局样式系统 - 竹绿色主题 CSS 变量与通用样式"
```

---

### Task 3: TypeScript 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
/* src/types/index.ts */

// 课程
export interface Course {
  id: number
  title: string
  category: CourseCategory
  difficulty: Difficulty
  description: string
  coverImage: string
  sortOrder: number
  createdAt: string
}

export type CourseCategory = 'basics' | 'agent' | 'practice' | 'advanced'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  basics: '基础入门',
  agent: 'Agent 原理',
  practice: '实战项目',
  advanced: '进阶技巧'
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级'
}

// 章节
export interface Chapter {
  id: number
  courseId: number
  title: string
  content: string
  type: ChapterType
  estimatedMinutes: number
  sortOrder: number
  createdAt: string
}

export type ChapterType = 'theory' | 'practice'

// 实操任务
export interface Task {
  id: number
  chapterId: number | null
  title: string
  description: string
  initialCode: string
  solutionCode: string
  validationType: ValidationType
  validationValue: string
  difficulty: Difficulty
  sortOrder: number
}

export type ValidationType = 'exact' | 'contains' | 'regex' | 'custom'

// 学习记录
export interface LearningRecord {
  id: number
  chapterId: number
  taskId: number | null
  status: 'in_progress' | 'completed' | 'skipped'
  userCode: string | null
  startedAt: string
  completedAt: string | null
  durationSeconds: number
}

// 学习会话
export interface LearningSession {
  id: number
  date: string
  totalSeconds: number
  tasksCompleted: number
  createdAt: string
}

// 用户配置
export interface UserConfig {
  id: number
  nickname: string
  avatar: string | null
  dailyGoalMinutes: number
  reminderEnabled: boolean
  reminderTime: string
  createdAt: string
}

// AI 模拟对话消息
export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
}

// 首页统计
export interface DashboardStats {
  todayMinutes: number
  todayTasksCompleted: number
  totalMinutes: number
  totalCoursesCompleted: number
  streakDays: number
  lastChapter: { courseId: number; chapterId: number; title: string; courseTitle: string } | null
}

// 进度统计
export interface ProgressData {
  dailyStats: { date: string; minutes: number }[]
  courseCompletion: { courseId: number; title: string; completed: number; total: number }[]
  taskStats: { passed: number; failed: number; total: number }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: TypeScript 类型定义"
```

---

### Task 4: Electron 主进程 - 数据库

**Files:**
- Create: `electron/database.ts`

- [ ] **Step 1: 创建数据库模块**

```typescript
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
      date TEXT NOT NULL,
      total_seconds INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

function seedData(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number }
  if (count.count > 0) return

  const insertCourse = db.prepare(
    'INSERT INTO courses (id, title, category, difficulty, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertChapter = db.prepare(
    'INSERT INTO chapters (id, course_id, title, content, type, estimated_minutes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
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
    insertChapter.run(1, 1, '什么是 AI Agent', '# 什么是 AI Agent\n\nAI Agent（智能体）是一种能够感知环境、做出决策并执行行动的自主系统。在 AI 编程领域，Agent 特指能够理解用户意图、自主规划任务、调用工具并生成代码的智能程序。\n\n## 核心特征\n\n1. **自主性**：Agent 能够独立做出决策，无需人类逐步指导\n2. **感知能力**：能够理解上下文、读取代码、分析问题\n3. **行动能力**：能够执行代码、调用 API、修改文件\n4. **学习能力**：从反馈中不断优化行为\n\n## Agent vs 传统 AI 助手\n\n| 特性 | 传统 AI 助手 | AI Agent |\n|------|-------------|----------|\n| 交互方式 | 单轮问答 | 多轮自主执行 |\n| 任务范围 | 单一任务 | 复合任务链 |\n| 工具使用 | 有限 | 丰富的工具集成 |\n| 记忆能力 | 无 | 有上下文记忆 |\n\n## 实践思考\n\n想象你要开发一个\"自动生成 API 文档\"的 Agent，它需要哪些能力？', 'theory', 15, 1)

    insertChapter.run(2, 1, 'Agent 的核心架构', '# Agent 的核心架构\n\n一个典型的 AI Agent 由以下四个核心模块组成：\n\n## 1. 大脑（LLM）\n- 负责理解、推理和规划\n- 通常使用 GPT-4、Claude 等大语言模型\n- 决定\"做什么\"和\"怎么做\"\n\n## 2. 记忆系统\n- **短期记忆**：当前对话上下文\n- **长期记忆**：向量数据库存储的历史知识\n- **工作记忆**：当前任务的状态信息\n\n## 3. 工具集\n- 代码执行器\n- 文件系统操作\n- API 调用\n- 网页搜索\n- 数据库查询\n\n## 4. 规划与执行\n- 任务分解\n- 步骤排序\n- 执行监控\n- 错误恢复\n\n```\n┌─────────────────────────────────┐\n│           AI Agent              │\n│  ┌──────┐  ┌──────────────┐    │\n│  │ LLM  │  │   记忆系统    │    │\n│  │ 大脑 │  │ 短/长/工作   │    │\n│  └──┬───┘  └──────┬───────┘    │\n│     │             │            │\n│  ┌──┴─────────────┴──────┐    │\n│  │     规划与执行引擎     │    │\n│  └──────────┬────────────┘    │\n│             │                 │\n│  ┌──────────┴────────────┐    │\n│  │       工具集           │    │\n│  │ 代码|文件|API|搜索|DB  │    │\n│  └───────────────────────┘    │\n└─────────────────────────────────┘\n```', 'theory', 15, 2)

    insertChapter.run(3, 1, '构建你的第一个 Agent', '# 构建你的第一个 Agent\n\n让我们通过一个简单的示例来理解 Agent 的工作方式。\n\n## 场景：代码审查 Agent\n\n假设我们要构建一个自动审查代码的 Agent，它需要：\n\n1. 读取代码文件\n2. 分析代码质量\n3. 提出改进建议\n4. 生成审查报告\n\n## Agent 的思考过程\n\n```\n用户: 请审查 src/utils.ts 文件\n\nAgent 思考:\n1. 我需要先读取文件内容\n2. 分析代码结构、命名规范、潜在问题\n3. 整理成结构化的审查报告\n4. 输出报告给用户\n\nAgent 行动:\n→ 调用 read_file(\"src/utils.ts\")\n→ 分析内容...\n→ 生成报告\n→ 输出结果\n```\n\n## 关键要点\n\n- Agent 不是一次性给出答案，而是分步执行\n- 每个步骤可能调用不同的工具\n- Agent 会根据中间结果调整后续步骤\n- 良好的 prompt 设计是 Agent 效果的关键', 'theory', 15, 3)

    // 课程 2: Prompt Engineering
    insertCourse.run(2, 'Prompt Engineering 进阶', 'basics', 'beginner', '掌握编写高质量 Prompt 的技巧，让 Agent 更精准地理解你的意图', 2)
    insertChapter.run(4, 2, 'Prompt 基础原则', '# Prompt 基础原则\n\nPrompt 是你与 AI Agent 沟通的桥梁。一个好的 Prompt 能让 Agent 准确理解你的需求。\n\n## 核心原则\n\n### 1. 明确具体\n```\n❌ 差: \"写个函数\"\n✅ 好: \"写一个 TypeScript 函数，接收用户 ID 数组，返回对应的用户名称列表，需要处理空数组和无效 ID 的情况\"\n```\n\n### 2. 提供上下文\n```\n❌ 差: \"修复这个 bug\"\n✅ 好: \"在 src/auth.ts 第 42 行，登录函数在 token 过期时没有正确处理 401 错误，请修复\"\n```\n\n### 3. 指定格式\n```\n❌ 差: \"解释这段代码\"\n✅ 好: \"用三点列表解释这段代码的核心逻辑，每点不超过两句话\"\n```\n\n### 4. 分步引导\n```\n❌ 差: \"帮我重构整个项目\"\n✅ 好: \"先分析 src/ 目录结构，找出重复代码，然后逐步重构，每步确认后再继续\"\n```', 'theory', 15, 1)

    insertChapter.run(5, 2, '高级 Prompt 技巧', '# 高级 Prompt 技巧\n\n## Chain of Thought（思维链）\n\n要求 Agent 在给出答案前展示推理过程：\n\n```\n请逐步分析以下问题：\n1. 先理解需求\n2. 列出实现步骤\n3. 分析每个步骤的潜在问题\n4. 给出最终方案\n\n需求：实现一个带缓存的 API 请求函数\n```\n\n## Few-Shot Prompting\n\n通过示例引导 Agent 的行为：\n\n```\n按照以下格式生成 Git 提交信息：\n\n示例1:\n改动: 修复登录页面 token 刷新逻辑\n类型: fix\n描述: 在 token 过期时自动使用 refresh_token 获取新 token\n\n示例2:\n改动: 新增用户头像上传组件\n类型: feat\n描述: 支持拖拽上传和裁剪功能\n\n现在请为以下改动生成提交信息：\n改动: 优化数据库查询性能，添加索引\n```\n\n## Role Prompting\n\n为 Agent 设定角色和约束：\n\n```\n你是一位资深前端架构师，专注于 React 和 TypeScript。\n\n审查代码时请关注：\n- 组件设计是否合理\n- 类型定义是否完整\n- 性能是否有优化空间\n- 是否存在安全隐患\n\n请以专业但友好的语气给出建议。\n```', 'theory', 15, 2)

    insertChapter.run(6, 2, 'Prompt 实战练习', '编写 Agent 指令是你的核心技能。以下任务将帮助你练习。', 'practice', 20, 3)

    // 课程 3: Tool Calling
    insertCourse.run(3, 'Tool Calling 与 Function Calling', 'agent', 'intermediate', '深入理解 Agent 如何调用工具，掌握 Function Calling 的核心机制', 3)
    insertChapter.run(7, 3, 'Tool Calling 概述', '# Tool Calling 概述\n\nTool Calling 是 Agent 最核心的能力之一——让 AI 能够像人类一样使用各种工具。\n\n## 什么是 Tool Calling\n\nTool Calling 允许 Agent：\n- 调用外部 API\n- 执行代码\n- 操作文件系统\n- 查询数据库\n- 发送网络请求\n\n## 工作流程\n\n```\n用户输入 → LLM 分析 → 决定调用工具 → 执行工具 → 获取结果 → LLM 整合 → 输出响应\n```\n\n## 工具定义示例\n\n```typescript\nconst tools = [\n  {\n    name: \"read_file\",\n    description: \"读取指定路径的文件内容\",\n    parameters: {\n      path: \"string - 文件路径\"\n    }\n  },\n  {\n    name: \"search_code\",\n    description: \"在代码库中搜索\",\n    parameters: {\n      query: \"string - 搜索关键词\",\n      fileTypes: \"string[] - 文件类型过滤\"\n    }\n  }\n]\n```', 'theory', 15, 1)

    insertChapter.run(8, 3, '实现 Tool Calling', '# 实现 Tool Calling\n\n## 工具注册\n\n```typescript\nclass ToolRegistry {\n  private tools: Map<string, Tool> = new Map()\n\n  register(tool: Tool) {\n    this.tools.set(tool.name, tool)\n  }\n\n  async execute(name: string, params: any) {\n    const tool = this.tools.get(name)\n    if (!tool) throw new Error(`Unknown tool: ${name}`)\n    return tool.handler(params)\n  }\n\n  getDefinitions() {\n    return Array.from(this.tools.values()).map(t => ({\n      name: t.name,\n      description: t.description,\n      parameters: t.parameters\n    }))\n  }\n}\n```\n\n## 执行流程\n\n1. LLM 返回 function_call 响应\n2. 解析工具名称和参数\n3. 执行对应工具\n4. 将结果返回给 LLM\n5. LLM 基于结果继续推理或生成最终答案', 'theory', 15, 2)

    insertChapter.run(9, 3, 'Tool Calling 实战', '编写一个带工具调用的 Agent 系统', 'practice', 20, 3)

    // 课程 4: Agent 工作流
    insertCourse.run(4, 'Agent 工作流设计', 'agent', 'intermediate', '学习 Plan-Execute-Review 工作流模式，设计高效的 Agent 执行流程', 4)
    insertChapter.run(10, 4, 'Plan-Execute-Review 模式', '# Plan-Execute-Review 模式\n\n这是最经典的 Agent 工作流模式。\n\n## Plan（规划）\nAgent 接收任务后，先制定执行计划：\n- 分析任务目标\n- 分解为子任务\n- 确定依赖关系\n- 排定执行顺序\n\n## Execute（执行）\n按照计划逐步执行：\n- 每个子任务独立执行\n- 记录执行结果\n- 处理异常情况\n\n## Review（审查）\n执行完成后进行审查：\n- 对照目标检查结果\n- 发现遗漏或错误\n- 必要时重新规划和执行\n\n```\nPlan → Execute → Review\n  ↑                 ↓\n  └─── 调整 ←───────┘\n```', 'theory', 15, 1)

    insertChapter.run(11, 4, '工作流实战', '设计并实现一个完整的 Agent 工作流', 'practice', 20, 2)

    // 课程 5: 多 Agent 协作
    insertCourse.run(5, '多 Agent 协作模式', 'advanced', 'advanced', '探索多个 Agent 协同工作的模式与最佳实践', 5)
    insertChapter.run(12, 5, '多 Agent 协作概述', '# 多 Agent 协作概述\n\n当单个 Agent 无法高效完成任务时，多 Agent 协作是自然的解决方案。\n\n## 协作模式\n\n### 1. 层级模式\n一个主 Agent 分配任务给多个子 Agent\n\n### 2. 对等模式\n多个 Agent 平等协作，互相审查\n\n### 3. 流水线模式\nAgent 按顺序处理任务的不同阶段\n\n### 4. 辩论模式\n多个 Agent 讨论并达成共识\n\n## 适用场景\n- 大型项目开发\n- 代码审查 + 修复\n- 前后端协作开发\n- 测试用例生成', 'theory', 15, 1)

    insertChapter.run(13, 5, '多 Agent 实战', '模拟多 Agent 协作完成项目', 'practice', 20, 2)

    // 课程 6: RAG Agent
    insertCourse.run(6, 'RAG 在 Agent 中的应用', 'advanced', 'advanced', '掌握检索增强生成技术，让 Agent 拥有强大的知识检索能力', 6)
    insertChapter.run(14, 6, 'RAG 基础', '# RAG 基础\n\nRAG（Retrieval-Augmented Generation）让 Agent 能够检索外部知识。\n\n## 核心流程\n\n```\n用户提问 → 向量检索 → 获取相关文档 → 拼接上下文 → LLM 生成回答\n```\n\n## 关键组件\n\n1. **文档处理**：分块、向量化\n2. **向量数据库**：存储和检索\n3. **检索策略**：相似度搜索、混合搜索\n4. **上下文拼接**：将检索结果注入 Prompt\n\n## 在 Agent 中的应用\n\n- 代码库问答\n- 文档检索\n- 知识库查询\n- 历史对话回顾', 'theory', 15, 1)

    insertChapter.run(15, 6, 'RAG 实战', '构建一个带 RAG 能力的代码问答 Agent', 'practice', 20, 2)

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
```

- [ ] **Step 2: Commit**

```bash
git add electron/database.ts
git commit -m "feat: Electron 数据库模块 - SQLite 表结构与种子数据"
```

---

### Task 5: Electron 主进程 - IPC 处理与入口

**Files:**
- Create: `electron/ipc-handlers.ts`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`

- [ ] **Step 1: 创建 IPC 处理器**

```typescript
/* electron/ipc-handlers.ts */
import { ipcMain } from 'electron'
import { getDatabase } from './database'
import fs from 'fs'
import path from 'path'

export function registerIpcHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('db:query', (_event, sql: string, params?: any[]) => {
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return db.prepare(sql).all(...(params || []))
      }
      return []
    } catch (error: any) {
      throw new Error(`DB query error: ${error.message}`)
    }
  })

  ipcMain.handle('db:execute', (_event, sql: string, params?: any[]) => {
    try {
      const stmt = db.prepare(sql)
      return stmt.run(...(params || []))
    } catch (error: any) {
      throw new Error(`DB execute error: ${error.message}`)
    }
  })

  ipcMain.handle('fs:read-course', (_event, relativePath: string) => {
    try {
      const fullPath = path.join(__dirname, '../../resources/courses', relativePath)
      return fs.readFileSync(fullPath, 'utf-8')
    } catch (error: any) {
      throw new Error(`File read error: ${error.message}`)
    }
  })

  ipcMain.handle('fs:save-code', (_event, taskId: number, code: string) => {
    try {
      db.prepare('UPDATE learning_records SET user_code = ? WHERE task_id = ? AND status = ?')
        .run(code, taskId, 'in_progress')
    } catch (error: any) {
      throw new Error(`Save code error: ${error.message}`)
    }
  })

  ipcMain.handle('app:get-version', () => {
    return require('../../package.json').version
  })
}
```

- [ ] **Step 2: 创建主进程入口**

```typescript
/* electron/main.ts */
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase } from './database'
import { registerIpcHandlers } from './ipc-handlers'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'AI Coding Learner',
    backgroundColor: '#F7F9F5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 3: 创建预加载脚本**

```typescript
/* electron/preload.ts */
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
  dbExecute: (sql: string, params?: any[]) => ipcRenderer.invoke('db:execute', sql, params),
  readCourseFile: (path: string) => ipcRenderer.invoke('fs:read-course', path),
  saveCode: (taskId: number, code: string) => ipcRenderer.invoke('fs:save-code', taskId, code),
  getAppVersion: () => ipcRenderer.invoke('app:get-version')
})
```

- [ ] **Step 4: Commit**

```bash
git add electron/main.ts electron/ipc-handlers.ts electron/preload.ts
git commit -m "feat: Electron 主进程 - IPC 通信与窗口管理"
```

---

### Task 6: Pinia 状态管理

**Files:**
- Create: `src/stores/user.ts`
- Create: `src/stores/courses.ts`
- Create: `src/stores/practice.ts`
- Create: `src/stores/progress.ts`

- [ ] **Step 1: 创建用户 Store**

```typescript
/* src/stores/user.ts */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserConfig } from '@/types'

export const useUserStore = defineStore('user', () => {
  const config = ref<UserConfig>({
    id: 1,
    nickname: '学习者',
    avatar: null,
    dailyGoalMinutes: 30,
    reminderEnabled: false,
    reminderTime: '09:00',
    createdAt: ''
  })

  const isLoaded = ref(false)

  const dailyGoalProgress = computed(() => 0)

  async function loadConfig() {
    try {
      const rows = await window.electronAPI.dbQuery('SELECT * FROM user_config WHERE id = 1')
      if (rows.length > 0) {
        config.value = {
          ...rows[0],
          reminderEnabled: rows[0].reminder_enabled === 1,
          avatar: rows[0].avatar || null
        }
      }
      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load user config:', e)
    }
  }

  async function updateConfig(updates: Partial<UserConfig>) {
    const fields: string[] = []
    const values: any[] = []
    if (updates.nickname !== undefined) { fields.push('nickname = ?'); values.push(updates.nickname) }
    if (updates.dailyGoalMinutes !== undefined) { fields.push('daily_goal_minutes = ?'); values.push(updates.dailyGoalMinutes) }
    if (updates.reminderEnabled !== undefined) { fields.push('reminder_enabled = ?'); values.push(updates.reminderEnabled ? 1 : 0) }
    if (updates.reminderTime !== undefined) { fields.push('reminder_time = ?'); values.push(updates.reminderTime) }
    if (fields.length > 0) {
      await window.electronAPI.dbExecute(`UPDATE user_config SET ${fields.join(', ')} WHERE id = 1`, values)
      Object.assign(config.value, updates)
    }
  }

  return { config, isLoaded, dailyGoalProgress, loadConfig, updateConfig }
})
```

- [ ] **Step 2: 创建课程 Store**

```typescript
/* src/stores/courses.ts */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course, Chapter, CourseCategory } from '@/types'

export const useCoursesStore = defineStore('courses', () => {
  const courses = ref<Course[]>([])
  const chapters = ref<Map<number, Chapter[]>>(new Map())
  const currentCategory = ref<CourseCategory | 'all'>('all')
  const isLoading = ref(false)

  const filteredCourses = computed(() => {
    if (currentCategory.value === 'all') return courses.value
    return courses.value.filter(c => c.category === currentCategory.value)
  })

  async function loadCourses() {
    isLoading.value = true
    try {
      const rows = await window.electronAPI.dbQuery('SELECT * FROM courses ORDER BY sort_order')
      courses.value = rows
    } catch (e) {
      console.error('Failed to load courses:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function loadChapters(courseId: number) {
    try {
      const rows = await window.electronAPI.dbQuery(
        'SELECT * FROM chapters WHERE course_id = ? ORDER BY sort_order',
        [courseId]
      )
      chapters.value.set(courseId, rows)
    } catch (e) {
      console.error('Failed to load chapters:', e)
    }
  }

  function getCourseById(id: number): Course | undefined {
    return courses.value.find(c => c.id === id)
  }

  function getChaptersByCourseId(courseId: number): Chapter[] {
    return chapters.value.get(courseId) || []
  }

  return { courses, chapters, currentCategory, isLoading, filteredCourses, loadCourses, loadChapters, getCourseById, getChaptersByCourseId }
})
```

- [ ] **Step 3: 创建实操 Store**

```typescript
/* src/stores/practice.ts */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, ChatMessage } from '@/types'

export const usePracticeStore = defineStore('practice', () => {
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const userCode = ref('')
  const chatMessages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const startTime = ref<number>(0)

  async function loadTasks() {
    isLoading.value = true
    try {
      const rows = await window.electronAPI.dbQuery('SELECT * FROM tasks ORDER BY sort_order')
      tasks.value = rows
    } finally {
      isLoading.value = false
    }
  }

  async function loadTask(taskId: number) {
    const rows = await window.electronAPI.dbQuery('SELECT * FROM tasks WHERE id = ?', [taskId])
    if (rows.length > 0) {
      currentTask.value = rows[0]
      userCode.value = rows[0].initial_code || ''
      chatMessages.value = []
      startTime.value = Date.now()

      // 加载之前的代码
      const records = await window.electronAPI.dbQuery(
        'SELECT user_code FROM learning_records WHERE task_id = ? AND status = ? ORDER BY id DESC LIMIT 1',
        [taskId, 'in_progress']
      )
      if (records.length > 0 && records[0].user_code) {
        userCode.value = records[0].user_code
      }

      await window.electronAPI.dbExecute(
        'INSERT OR IGNORE INTO learning_records (chapter_id, task_id, status) VALUES (?, ?, ?)',
        [currentTask.value.chapterId, taskId, 'in_progress']
      )
    }
  }

  async function saveCode() {
    if (currentTask.value) {
      await window.electronAPI.saveCode(currentTask.value.id, userCode.value)
    }
  }

  async function submitCode(): Promise<{ passed: boolean; message: string }> {
    if (!currentTask.value) return { passed: false, message: '无任务' }

    const duration = Math.floor((Date.now() - startTime.value) / 1000)
    const code = userCode.value.trim()
    const validation = currentTask.value.validationType
    const expected = currentTask.value.validationValue

    let passed = false
    if (validation === 'contains' && code.includes(expected)) passed = true
    else if (validation === 'exact' && code === expected) passed = true
    else if (validation === 'regex' && new RegExp(expected).test(code)) passed = true

    const status = passed ? 'completed' : 'in_progress'
    await window.electronAPI.dbExecute(
      'UPDATE learning_records SET status = ?, user_code = ?, completed_at = datetime(\'now\'), duration_seconds = ? WHERE task_id = ? AND status = \'in_progress\'',
      [status, userCode.value, duration, currentTask.value.id]
    )

    if (passed) {
      await window.electronAPI.dbExecute(
        `INSERT INTO learning_sessions (date, total_seconds, tasks_completed)
         VALUES (date('now'), ?, 1)
         ON CONFLICT(date) DO UPDATE SET total_seconds = total_seconds + ?, tasks_completed = tasks_completed + 1`,
        [duration, duration]
      )
    }

    return {
      passed,
      message: passed ? '恭喜！代码验证通过！' : '代码尚未满足要求，请继续修改。'
    }
  }

  function addChatMessage(role: 'user' | 'agent', content: string) {
    chatMessages.value.push({
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString()
    })
  }

  return { tasks, currentTask, userCode, chatMessages, isLoading, loadTasks, loadTask, saveCode, submitCode, addChatMessage }
})
```

- [ ] **Step 4: 创建进度 Store**

```typescript
/* src/stores/progress.ts */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DashboardStats, ProgressData } from '@/types'

export const useProgressStore = defineStore('progress', () => {
  const dashboardStats = ref<DashboardStats>({
    todayMinutes: 0,
    todayTasksCompleted: 0,
    totalMinutes: 0,
    totalCoursesCompleted: 0,
    streakDays: 0,
    lastChapter: null
  })

  const progressData = ref<ProgressData>({
    dailyStats: [],
    courseCompletion: [],
    taskStats: { passed: 0, failed: 0, total: 0 }
  })

  const isLoading = ref(false)

  async function loadDashboard() {
    isLoading.value = true
    try {
      const [todaySession] = await window.electronAPI.dbQuery(
        "SELECT total_seconds, tasks_completed FROM learning_sessions WHERE date = date('now')"
      )
      const [totalResult] = await window.electronAPI.dbQuery(
        'SELECT COALESCE(SUM(total_seconds), 0) as total_seconds FROM learning_sessions'
      )
      const [completedCourses] = await window.electronAPI.dbQuery(
        `SELECT COUNT(DISTINCT c.id) as count FROM courses c
         WHERE NOT EXISTS (SELECT 1 FROM chapters ch WHERE ch.course_id = c.id
         AND NOT EXISTS (SELECT 1 FROM learning_records lr WHERE lr.chapter_id = ch.id AND lr.status = 'completed'))`
      )
      const [lastRecord] = await window.electronAPI.dbQuery(
        `SELECT lr.chapter_id, ch.title, ch.course_id, c.title as course_title
         FROM learning_records lr
         JOIN chapters ch ON lr.chapter_id = ch.id
         JOIN courses c ON ch.course_id = c.id
         WHERE lr.status = 'in_progress'
         ORDER BY lr.started_at DESC LIMIT 1`
      )
      const [streakResult] = await window.electronAPI.dbQuery(
        `WITH RECURSIVE dates AS (
          SELECT date('now') as d
          UNION ALL SELECT date(d, '-1 day') FROM dates
          WHERE EXISTS (SELECT 1 FROM learning_sessions WHERE date = date(d, '-1 day'))
          LIMIT 365
        ) SELECT COUNT(*) as streak FROM dates`
      )

      dashboardStats.value = {
        todayMinutes: todaySession ? Math.floor((todaySession.total_seconds || 0) / 60) : 0,
        todayTasksCompleted: todaySession ? (todaySession.tasks_completed || 0) : 0,
        totalMinutes: Math.floor((totalResult?.total_seconds || 0) / 60),
        totalCoursesCompleted: completedCourses?.count || 0,
        streakDays: streakResult?.streak || 0,
        lastChapter: lastRecord ? {
          courseId: lastRecord.course_id,
          chapterId: lastRecord.chapter_id,
          title: lastRecord.title,
          courseTitle: lastRecord.course_title
        } : null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function loadProgressData() {
    try {
      const dailyStats = await window.electronAPI.dbQuery(
        `SELECT date, total_seconds as minutes FROM learning_sessions
         WHERE date >= date('now', '-30 days') ORDER BY date`
      )
      const courseCompletion = await window.electronAPI.dbQuery(
        `SELECT c.id as courseId, c.title,
          (SELECT COUNT(*) FROM learning_records lr JOIN chapters ch ON lr.chapter_id = ch.id WHERE ch.course_id = c.id AND lr.status = 'completed') as completed,
          (SELECT COUNT(*) FROM chapters WHERE course_id = c.id) as total
         FROM courses c ORDER BY c.sort_order`
      )
      const taskStats = await window.electronAPI.dbQuery(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as passed,
          COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as failed,
          COUNT(*) as total
         FROM learning_records WHERE task_id IS NOT NULL`
      )

      progressData.value = {
        dailyStats: dailyStats.map((d: any) => ({ date: d.date, minutes: Math.floor(d.minutes / 60) })),
        courseCompletion,
        taskStats: taskStats[0] || { passed: 0, failed: 0, total: 0 }
      }
    } catch (e) {
      console.error('Failed to load progress data:', e)
    }
  }

  return { dashboardStats, progressData, isLoading, loadDashboard, loadProgressData }
})
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/
git commit -m "feat: Pinia 状态管理 - user/courses/practice/progress stores"
```

---

### Task 7: 路由配置

**Files:**
- Create: `src/router/index.ts`

- [ ] **Step 1: 创建路由配置**

```typescript
/* src/router/index.ts */
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/learn',
      name: 'learn',
      component: () => import('@/views/LearnView.vue')
    },
    {
      path: '/learn/:courseId',
      name: 'course-detail',
      component: () => import('@/views/CourseDetailView.vue')
    },
    {
      path: '/learn/:courseId/:chapterId',
      name: 'chapter',
      component: () => import('@/views/ChapterView.vue')
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('@/views/PracticeView.vue')
    },
    {
      path: '/practice/:taskId',
      name: 'task',
      component: () => import('@/views/TaskView.vue')
    },
    {
      path: '/progress',
      name: 'progress',
      component: () => import('@/views/ProgressView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add src/router/index.ts
git commit -m "feat: Vue Router 路由配置"
```

---

### Task 8: 布局组件 (AppLayout, AppSidebar, AppHeader)

**Files:**
- Create: `src/components/layout/AppSidebar.vue`
- Create: `src/components/layout/AppHeader.vue`
- Create: `src/components/layout/AppLayout.vue`

- [ ] **Step 1: 创建 AppSidebar**

```vue
<!-- src/components/layout/AppSidebar.vue -->
<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-icon">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#4A7C59"/>
          <path d="M7 18L12 8L14 14L17 10L21 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="brand-text">AI Coding Learner</span>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"/></svg>
        <span>首页</span>
      </router-link>
      <router-link to="/learn" class="nav-item" :class="{ active: $route.path.startsWith('/learn') }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4h4v4H4V4zm8 0h4v4h-4V4zM4 12h4v4H4v-4zm8 0h4v4h-4v-4z"/></svg>
        <span>学习中心</span>
      </router-link>
      <router-link to="/practice" class="nav-item" :class="{ active: $route.path.startsWith('/practice') }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M13 2l5 7-5 7H3l5-7-5-7h10z"/></svg>
        <span>实操实验室</span>
      </router-link>
      <router-link to="/progress" class="nav-item" :class="{ active: $route.path === '/progress' }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 18h16V2H2v16zm2-5h4v3H4v-3zm6 0h4v3h-4v-3zM4 7h12v4H4V7z"/></svg>
        <span>学习进度</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 13a3 3 0 100-6 3 3 0 000 6zm8-2.5V9.5l-1.8-.3a6.5 6.5 0 00-.6-1.4l1.1-1.5-1.1-1.1-1.5 1.1a6.5 6.5 0 00-1.4-.6L12.5 4h-1.1l-.3 1.8a6.5 6.5 0 00-1.4.6L8 5.3 6.9 6.4 8 7.9a6.5 6.5 0 00-.6 1.4L5.5 9.5v1.1l1.8.3c.1.5.3 1 .6 1.4l-1.1 1.5 1.1 1.1 1.5-1.1c.5.3 1 .5 1.4.6l.3 1.8h1.1l.3-1.8c.5-.1 1-.3 1.4-.6l1.5 1.1 1.1-1.1-1.1-1.5c.3-.5.5-1 .6-1.4L18 10.5z"/></svg>
        <span>设置</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--color-bg-sidebar);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) var(--spacing-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-icon {
  flex-shrink: 0;
}

.brand-text {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-sidebar-active);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: var(--color-text-sidebar);
  text-decoration: none;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-sidebar-active);
}

.nav-item.active {
  background: var(--color-primary);
  color: var(--color-text-sidebar-active);
}
</style>
```

- [ ] **Step 2: 创建 AppHeader**

```vue
<!-- src/components/layout/AppHeader.vue -->
<template>
  <header class="header">
    <div class="header-left">
      <h2 class="header-title">{{ title }}</h2>
    </div>
    <div class="header-right">
      <div class="user-info">
        <div class="avatar">{{ userStore.config.nickname.charAt(0) }}</div>
        <span class="nickname">{{ userStore.config.nickname }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const titleMap: Record<string, string> = {
  home: '首页',
  learn: '学习中心',
  'course-detail': '课程详情',
  chapter: '章节内容',
  practice: '实操实验室',
  task: '实操任务',
  progress: '学习进度',
  settings: '设置'
}

const title = computed(() => {
  const name = route.name as string
  return titleMap[name] || 'AI Coding Learner'
})
</script>

<style scoped>
.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-2xl);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.nickname {
  font-size: var(--font-size-base);
  color: var(--color-text);
  font-weight: 500;
}
</style>
```

- [ ] **Step 3: 创建 AppLayout**

```vue
<!-- src/components/layout/AppLayout.vue -->
<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-main">
      <AppHeader />
      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-content {
  flex: 1;
  padding: 0;
}
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: 布局组件 - AppLayout/AppSidebar/AppHeader"
```

---

### Task 9: 通用组件 (ProgressBar, StatCard, EmptyState, LoadingSpinner)

**Files:**
- Create: `src/components/common/ProgressBar.vue`
- Create: `src/components/common/StatCard.vue`
- Create: `src/components/common/EmptyState.vue`
- Create: `src/components/common/LoadingSpinner.vue`

- [ ] **Step 1: 创建 ProgressBar**

```vue
<!-- src/components/common/ProgressBar.vue -->
<template>
  <div class="progress-bar-wrapper">
    <div class="progress-bar-header" v-if="showLabel">
      <span class="progress-label">{{ label }}</span>
      <span class="progress-value">{{ Math.round(percentage) }}%</span>
    </div>
    <div class="progress-bar-track">
      <div class="progress-bar-fill" :style="{ width: percentage + '%' }" :class="color"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  percentage: number
  label?: string
  showLabel?: boolean
  color?: 'primary' | 'success' | 'warning'
}>()
</script>

<style scoped>
.progress-bar-wrapper {
  width: 100%;
}

.progress-bar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.progress-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.progress-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.progress-bar-track {
  height: 8px;
  background: var(--color-primary-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
  background: var(--color-primary);
}

.progress-bar-fill.success {
  background: var(--color-success);
}

.progress-bar-fill.warning {
  background: var(--color-warning);
}
</style>
```

- [ ] **Step 2: 创建 StatCard**

```vue
<!-- src/components/common/StatCard.vue -->
<template>
  <div class="stat-card card">
    <div class="stat-icon" :style="{ background: iconBg }">
      <slot name="icon" />
    </div>
    <div class="stat-info">
      <span class="stat-value">{{ value }}</span>
      <span class="stat-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: string | number
  label: string
  iconBg?: string
}>()
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
}
</style>
```

- [ ] **Step 3: 创建 EmptyState**

```vue
<!-- src/components/common/EmptyState.vue -->
<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="#DDE5DB" stroke-width="2"/>
          <path d="M24 28h16M24 36h10" stroke="#DDE5DB" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </slot>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-description" v-if="description">{{ description }}</p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
}

.empty-icon {
  margin-bottom: var(--spacing-lg);
  opacity: 0.6;
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.empty-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  max-width: 360px;
}
</style>
```

- [ ] **Step 4: 创建 LoadingSpinner**

```vue
<!-- src/components/common/LoadingSpinner.vue -->
<template>
  <div class="loading-spinner">
    <div class="spinner"></div>
    <span class="loading-text" v-if="text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text?: string }>()
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-md);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-primary-bg);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/common/
git commit -m "feat: 通用组件 - ProgressBar/StatCard/EmptyState/LoadingSpinner"
```

---

### Task 10: 学习中心组件 (CourseCard, ChapterTree, ContentViewer)

**Files:**
- Create: `src/components/learn/CourseCard.vue`
- Create: `src/components/learn/ChapterTree.vue`
- Create: `src/components/learn/ContentViewer.vue`

- [ ] **Step 1: 创建 CourseCard**

```vue
<!-- src/components/learn/CourseCard.vue -->
<template>
  <router-link :to="`/learn/${course.id}`" class="course-card card">
    <div class="course-header">
      <span class="tag" :class="difficultyClass">{{ difficultyLabel }}</span>
      <span class="tag tag-primary">{{ categoryLabel }}</span>
    </div>
    <h3 class="course-title">{{ course.title }}</h3>
    <p class="course-desc">{{ course.description }}</p>
    <div class="course-footer">
      <ProgressBar :percentage="progress" :show-label="false" />
      <span class="course-progress-text">{{ Math.round(progress) }}%</span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Course } from '@/types'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types'
import ProgressBar from '@/components/common/ProgressBar.vue'

const props = defineProps<{
  course: Course
  progress: number
}>()

const categoryLabel = computed(() => CATEGORY_LABELS[props.course.category] || props.course.category)
const difficultyLabel = computed(() => DIFFICULTY_LABELS[props.course.difficulty] || props.course.difficulty)

const difficultyClass = computed(() => {
  const map: Record<string, string> = { beginner: 'tag-success', intermediate: 'tag-warning', advanced: 'tag-primary' }
  return map[props.course.difficulty] || 'tag-primary'
})
</script>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.course-card:hover {
  border-color: var(--color-primary);
}

.course-header {
  display: flex;
  gap: var(--spacing-sm);
}

.course-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.course-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  flex: 1;
}

.course-footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.course-footer > :first-child {
  flex: 1;
}

.course-progress-text {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
}
</style>
```

- [ ] **Step 2: 创建 ChapterTree**

```vue
<!-- src/components/learn/ChapterTree.vue -->
<template>
  <div class="chapter-tree">
    <h3 class="tree-title">章节列表</h3>
    <div class="chapter-list">
      <router-link
        v-for="chapter in chapters"
        :key="chapter.id"
        :to="`/learn/${courseId}/${chapter.id}`"
        class="chapter-item"
        :class="{ active: activeChapterId === chapter.id, completed: isCompleted(chapter.id) }"
      >
        <div class="chapter-indicator">
          <span v-if="isCompleted(chapter.id)" class="check-icon">✓</span>
          <span v-else class="chapter-number">{{ chapter.sortOrder }}</span>
        </div>
        <div class="chapter-info">
          <span class="chapter-title">{{ chapter.title }}</span>
          <span class="chapter-meta">
            <span class="chapter-type">{{ chapter.type === 'practice' ? '实操' : '理论' }}</span>
            <span>{{ chapter.estimatedMinutes }}分钟</span>
          </span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Chapter } from '@/types'

defineProps<{
  chapters: Chapter[]
  courseId: number
  activeChapterId: number
  completedIds: Set<number>
}>()

function isCompleted(chapterId: number): boolean {
  // 由父组件传入 completedIds
  return false
}
</script>

<style scoped>
.chapter-tree {
  padding: var(--spacing-lg);
}

.tree-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-md);
  padding: 0 var(--spacing-sm);
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text);
  transition: all var(--transition-fast);
}

.chapter-item:hover {
  background: var(--color-bg-hover);
}

.chapter-item.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.chapter-item.completed .chapter-indicator {
  background: var(--color-success);
}

.chapter-indicator {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  flex-shrink: 0;
}

.chapter-item.active .chapter-indicator {
  border-color: var(--color-primary);
}

.chapter-item.completed .chapter-indicator {
  border-color: var(--color-success);
}

.check-icon {
  color: white;
  font-size: var(--font-size-sm);
}

.chapter-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chapter-title {
  font-size: var(--font-size-base);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-meta {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
}

.chapter-type {
  padding: 0 6px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-bg);
  color: var(--color-primary);
}
</style>
```

- [ ] **Step 3: 创建 ContentViewer**

```vue
<!-- src/components/learn/ContentViewer.vue -->
<template>
  <div class="content-viewer">
    <div class="markdown-body" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  highlight(str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

const renderedContent = computed(() => md.render(props.content))
</script>

<style scoped>
.content-viewer {
  padding: var(--spacing-2xl);
  max-width: 800px;
}

.content-viewer :deep(.markdown-body) {
  color: var(--color-text);
  line-height: 1.8;
}

.content-viewer :deep(h1) {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
  color: var(--color-text);
}

.content-viewer :deep(h2) {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  margin-top: var(--spacing-2xl);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text);
}

.content-viewer :deep(h3) {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
  color: var(--color-text);
}

.content-viewer :deep(p) {
  margin-bottom: var(--spacing-md);
}

.content-viewer :deep(ul), .content-viewer :deep(ol) {
  margin-bottom: var(--spacing-md);
  padding-left: var(--spacing-xl);
}

.content-viewer :deep(li) {
  margin-bottom: var(--spacing-xs);
}

.content-viewer :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--spacing-lg);
}

.content-viewer :deep(th), .content-viewer :deep(td) {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  text-align: left;
}

.content-viewer :deep(th) {
  background: var(--color-primary-bg);
  font-weight: 600;
}

.content-viewer :deep(pre) {
  background: #f6f8fa;
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.content-viewer :deep(code) {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background: var(--color-primary-bg);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.content-viewer :deep(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
}

.content-viewer :deep(blockquote) {
  border-left: 4px solid var(--color-primary);
  padding-left: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
  background: var(--color-primary-bg);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/learn/
git commit -m "feat: 学习中心组件 - CourseCard/ChapterTree/ContentViewer"
```

---

### Task 11: 实操组件 (CodeEditor, TaskPanel, AiChatSimulator)

**Files:**
- Create: `src/components/practice/CodeEditor.vue`
- Create: `src/components/practice/TaskPanel.vue`
- Create: `src/components/practice/AiChatSimulator.vue`

- [ ] **Step 1: 创建 CodeEditor**

```vue
<!-- src/components/practice/CodeEditor.vue -->
<template>
  <div class="code-editor">
    <div class="editor-header">
      <span class="editor-title">代码编辑器</span>
      <span class="editor-lang">TypeScript</span>
    </div>
    <div class="editor-body">
      <textarea
        class="editor-textarea"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @keydown="handleKeydown"
        spellcheck="false"
        placeholder="// 在这里编写你的代码..."
      ></textarea>
      <div class="editor-lines">
        <span v-for="n in lineCount" :key="n" class="line-number">{{ n }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const lineCount = computed(() => {
  return Math.max(props.modelValue.split('\n').length, 1)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = e.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = props.modelValue
    const newValue = value.substring(0, start) + '  ' + value.substring(end)
    emit('update:modelValue', newValue)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2
    })
  }
}
</script>

<style scoped>
.code-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
}

.editor-title {
  font-size: var(--font-size-xs);
  color: #cccccc;
  font-weight: 500;
}

.editor-lang {
  font-size: var(--font-size-xs);
  color: #888;
  padding: 2px 8px;
  background: #3d3d3d;
  border-radius: var(--radius-sm);
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-lines {
  padding: 16px 0;
  text-align: right;
  min-width: 44px;
  background: #1e1e1e;
  border-right: 1px solid #2d2d2d;
  overflow: hidden;
  user-select: none;
}

.line-number {
  display: block;
  padding: 0 12px 0 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #6e7681;
  font-family: var(--font-family-mono);
}

.editor-textarea {
  flex: 1;
  padding: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

.editor-textarea::placeholder {
  color: #6e7681;
}
</style>
```

- [ ] **Step 2: 创建 TaskPanel**

```vue
<!-- src/components/practice/TaskPanel.vue -->
<template>
  <div class="task-panel">
    <div class="task-header">
      <h3 class="task-title">{{ task.title }}</h3>
      <span class="tag" :class="difficultyClass">{{ difficultyLabel }}</span>
    </div>
    <div class="task-body">
      <div class="task-description" v-html="renderedDescription"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types'
import { DIFFICULTY_LABELS } from '@/types'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  task: Task
}>()

const md = new MarkdownIt({ breaks: true })
const renderedDescription = computed(() => md.render(props.task.description))

const difficultyLabel = computed(() => {
  const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return map[props.task.difficulty] || props.task.difficulty
})

const difficultyClass = computed(() => {
  const map: Record<string, string> = { easy: 'tag-success', medium: 'tag-warning', hard: 'tag-primary' }
  return map[props.task.difficulty] || 'tag-primary'
})
</script>

<style scoped>
.task-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.task-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.task-body {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.task-description {
  font-size: var(--font-size-base);
  color: var(--color-text);
  line-height: 1.8;
}

.task-description :deep(h1), .task-description :deep(h2) {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-md);
}

.task-description :deep(p) {
  margin-bottom: var(--spacing-md);
}

.task-description :deep(ul), .task-description :deep(ol) {
  padding-left: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
}

.task-description :deep(pre) {
  background: #f6f8fa;
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  overflow-x: auto;
}

.task-description :deep(code) {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background: var(--color-primary-bg);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
</style>
```

- [ ] **Step 3: 创建 AiChatSimulator**

```vue
<!-- src/components/practice/AiChatSimulator.vue -->
<template>
  <div class="ai-chat">
    <div class="chat-header">
      <span class="chat-title">AI 助手</span>
      <span class="chat-badge">模拟</span>
    </div>
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="chat-placeholder">
        <p>输入你的问题或指令，模拟 Agent 会响应你。</p>
        <p class="chat-hint">试试输入：<code>帮我分析这段代码</code> 或 <code>给出优化建议</code></p>
      </div>
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="chat-message"
        :class="msg.role"
      >
        <div class="message-avatar">
          {{ msg.role === 'user' ? '你' : 'AI' }}
        </div>
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>
    <div class="chat-input-area">
      <input
        v-model="inputText"
        class="chat-input"
        placeholder="输入你的问题..."
        @keydown.enter="sendMessage"
      />
      <button class="btn btn-primary btn-sm" @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '@/types'

const props = defineProps<{
  messages: ChatMessage[]
  currentCode: string
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const inputText = ref('')
const messagesContainer = ref<HTMLElement>()

watch(() => props.messages.length, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})

function sendMessage() {
  const text = inputText.value.trim()
  if (!text) return
  emit('send', text)
  inputText.value = ''
}
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.chat-title {
  font-size: var(--font-size-base);
  font-weight: 600;
}

.chat-badge {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-radius: var(--radius-full);
}

.chat-messages {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chat-placeholder {
  text-align: center;
  color: var(--color-text-light);
  padding: var(--spacing-2xl);
}

.chat-hint {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.chat-hint code {
  background: var(--color-primary-bg);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

.chat-message {
  display: flex;
  gap: var(--spacing-sm);
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  flex-shrink: 0;
}

.chat-message.user .message-avatar {
  background: var(--color-primary);
  color: white;
}

.chat-message.agent .message-avatar {
  background: var(--color-accent);
  color: white;
}

.message-content {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  white-space: pre-wrap;
}

.chat-message.user .message-content {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg);
}

.chat-message.agent .message-content {
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg);
}

.chat-input-area {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.chat-input {
  flex: 1;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  background: var(--color-bg);
  transition: border-color var(--transition-fast);
}

.chat-input:focus {
  border-color: var(--color-primary);
}
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/practice/
git commit -m "feat: 实操组件 - CodeEditor/TaskPanel/AiChatSimulator"
```

---

### Task 12: 进度组件 (DurationChart, CalendarHeatmap, WeeklyReport)

**Files:**
- Create: `src/components/progress/DurationChart.vue`
- Create: `src/components/progress/CalendarHeatmap.vue`
- Create: `src/components/progress/WeeklyReport.vue`

- [ ] **Step 1: 创建 DurationChart**

```vue
<!-- src/components/progress/DurationChart.vue -->
<template>
  <div class="duration-chart card">
    <h3 class="chart-title">学习时长趋势</h3>
    <div class="chart-container">
      <div class="chart-bars">
        <div
          v-for="(item, index) in data"
          :key="index"
          class="bar-wrapper"
        >
          <div class="bar-value">{{ item.minutes }}分</div>
          <div
            class="bar"
            :style="{ height: barHeight(item.minutes) + '%' }"
          ></div>
          <div class="bar-label">{{ formatDate(item.date) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: { date: string; minutes: number }[]
}>()

function barHeight(minutes: number): number {
  const max = 120
  return Math.min((minutes / max) * 100, 100)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.duration-chart {
  padding: var(--spacing-xl);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-xl);
}

.chart-container {
  height: 200px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100%;
  padding-top: 20px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.bar-value {
  font-size: 10px;
  color: var(--color-text-light);
  margin-bottom: 4px;
  white-space: nowrap;
}

.bar {
  width: 100%;
  max-width: 32px;
  background: var(--color-primary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  min-height: 4px;
  transition: height 0.5s ease;
}

.bar-label {
  font-size: 10px;
  color: var(--color-text-light);
  margin-top: 6px;
  white-space: nowrap;
}
</style>
```

- [ ] **Step 2: 创建 CalendarHeatmap**

```vue
<!-- src/components/progress/CalendarHeatmap.vue -->
<template>
  <div class="calendar-heatmap card">
    <h3 class="chart-title">学习日历</h3>
    <div class="heatmap-grid">
      <div
        v-for="day in days"
        :key="day.date"
        class="heatmap-cell"
        :class="getLevel(day.minutes)"
        :title="`${day.date}: ${day.minutes}分钟`"
      ></div>
    </div>
    <div class="heatmap-legend">
      <span>少</span>
      <div class="legend-cell level-0"></div>
      <div class="legend-cell level-1"></div>
      <div class="legend-cell level-2"></div>
      <div class="legend-cell level-3"></div>
      <div class="legend-cell level-4"></div>
      <span>多</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: { date: string; minutes: number }[]
}>()

const days = computed(() => {
  const result: { date: string; minutes: number }[] = []
  const dataMap = new Map(props.data.map(d => [d.date, d.minutes]))
  const now = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    result.push({ date: dateStr, minutes: dataMap.get(dateStr) || 0 })
  }
  return result
})

function getLevel(minutes: number): string {
  if (minutes === 0) return 'level-0'
  if (minutes <= 15) return 'level-1'
  if (minutes <= 30) return 'level-2'
  if (minutes <= 60) return 'level-3'
  return 'level-4'
}
</script>

<style scoped>
.calendar-heatmap {
  padding: var(--spacing-xl);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-xl);
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 3px;
}

.heatmap-cell.level-0 { background: #ebedf0; }
.heatmap-cell.level-1 { background: #c6e0c6; }
.heatmap-cell.level-2 { background: #8bc48b; }
.heatmap-cell.level-3 { background: #4a9e4a; }
.heatmap-cell.level-4 { background: #2d6a2d; }

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
}

.legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
</style>
```

- [ ] **Step 3: 创建 WeeklyReport**

```vue
<!-- src/components/progress/WeeklyReport.vue -->
<template>
  <div class="weekly-report card">
    <h3 class="report-title">本周学习报告</h3>
    <div class="report-stats">
      <div class="report-stat">
        <span class="report-stat-value">{{ weeklyMinutes }}</span>
        <span class="report-stat-label">本周学习(分钟)</span>
      </div>
      <div class="report-divider"></div>
      <div class="report-stat">
        <span class="report-stat-value">{{ tasksCompleted }}</span>
        <span class="report-stat-label">完成任务</span>
      </div>
      <div class="report-divider"></div>
      <div class="report-stat">
        <span class="report-stat-value">{{ streakDays }}</span>
        <span class="report-stat-label">连续天数</span>
      </div>
    </div>
    <div class="report-tip">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a.75.75 0 110 1.5.75.75 0 010-1.5zM8 7a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 7z"/></svg>
      <span>{{ tip }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  weeklyMinutes: number
  tasksCompleted: number
  streakDays: number
}>()

const tip = computed(() => {
  if (props.weeklyMinutes < 30) return '每天坚持学习，积少成多！建议从理论课程开始。'
  if (props.weeklyMinutes < 120) return '不错的开始！尝试完成更多实操任务来巩固知识。'
  if (props.weeklyMinutes < 300) return '学习状态很好！继续保持，可以挑战更高难度的课程。'
  return '太棒了！你是学习达人，试试完成所有高级课程吧！'
})
</script>

<style scoped>
.weekly-report {
  padding: var(--spacing-xl);
}

.report-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-xl);
}

.report-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: var(--spacing-xl);
}

.report-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.report-stat-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-primary);
}

.report-stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.report-divider {
  width: 1px;
  height: 40px;
  background: var(--color-border);
}

.report-tip {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary-bg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-primary-dark);
}
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/progress/
git commit -m "feat: 进度组件 - DurationChart/CalendarHeatmap/WeeklyReport"
```

---

### Task 13: 页面视图 - 首页

**Files:**
- Create: `src/views/HomeView.vue`

- [ ] **Step 1: 创建 HomeView**

```vue
<!-- src/views/HomeView.vue -->
<template>
  <div class="home-view page-container fade-in">
    <h1 class="page-title">欢迎回来，{{ userStore.config.nickname }}</h1>

    <div class="stats-grid">
      <StatCard
        :value="stats.todayMinutes + ' 分钟'"
        label="今日学习时长"
        icon-bg="#EDF4EE"
      >
        <template #icon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A7C59" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </template>
      </StatCard>
      <StatCard
        :value="stats.todayTasksCompleted"
        label="今日完成任务"
        icon-bg="#EDF7ED"
      >
        <template #icon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8C5A" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </template>
      </StatCard>
      <StatCard
        :value="stats.totalMinutes + ' 分钟'"
        label="累计学习时长"
        icon-bg="#EDF3F8"
      >
        <template #icon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8CB8" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </template>
      </StatCard>
      <StatCard
        :value="stats.streakDays + ' 天'"
        label="连续学习"
        icon-bg="#FDF8ED"
      >
        <template #icon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="2"><path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z"/></svg>
        </template>
      </StatCard>
    </div>

    <div class="home-grid">
      <div class="continue-section card" v-if="stats.lastChapter">
        <h3 class="section-title">继续学习</h3>
        <div class="continue-info">
          <div class="continue-course">{{ stats.lastChapter.courseTitle }}</div>
          <div class="continue-chapter">{{ stats.lastChapter.title }}</div>
          <router-link
            :to="`/learn/${stats.lastChapter.courseId}/${stats.lastChapter.chapterId}`"
            class="btn btn-primary"
          >
            继续学习
          </router-link>
        </div>
      </div>

      <div class="quick-actions card">
        <h3 class="section-title">快速开始</h3>
        <div class="action-grid">
          <router-link to="/learn" class="action-item">
            <div class="action-icon" style="background: #EDF4EE">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#4A7C59"><path d="M4 4h4v4H4V4zm8 0h4v4h-4V4zM4 12h4v4H4v-4zm8 0h4v4h-4v-4z"/></svg>
            </div>
            <span>浏览课程</span>
          </router-link>
          <router-link to="/practice" class="action-item">
            <div class="action-icon" style="background: #FDF8ED">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#D4A853"><path d="M13 2l5 7-5 7H3l5-7-5-7h10z"/></svg>
            </div>
            <span>开始实操</span>
          </router-link>
          <router-link to="/progress" class="action-item">
            <div class="action-icon" style="background: #EDF7ED">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#5B8C5A"><path d="M2 18h16V2H2v16zm2-5h4v3H4v-3zm6 0h4v3h-4v-3zM4 7h12v4H4V7z"/></svg>
            </div>
            <span>查看进度</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useProgressStore } from '@/stores/progress'
import { storeToRefs } from 'pinia'
import StatCard from '@/components/common/StatCard.vue'

const userStore = useUserStore()
const progressStore = useProgressStore()
const { dashboardStats: stats } = storeToRefs(progressStore)

onMounted(async () => {
  await userStore.loadConfig()
  await progressStore.loadDashboard()
})
</script>

<style scoped>
.home-view {
  padding: var(--spacing-2xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.continue-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.continue-course {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.continue-chapter {
  font-size: var(--font-size-base);
  font-weight: 500;
  margin-bottom: var(--spacing-md);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-md);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text);
  transition: all var(--transition-fast);
  background: var(--color-bg);
}

.action-item:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-item span {
  font-size: var(--font-size-sm);
  font-weight: 500;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/HomeView.vue
git commit -m "feat: 首页 Dashboard - 统计卡片、继续学习、快速入口"
```

---

### Task 14: 页面视图 - 学习中心相关

**Files:**
- Create: `src/views/LearnView.vue`
- Create: `src/views/CourseDetailView.vue`
- Create: `src/views/ChapterView.vue`

- [ ] **Step 1: 创建 LearnView**

```vue
<!-- src/views/LearnView.vue -->
<template>
  <div class="learn-view page-container fade-in">
    <h1 class="page-title">学习中心</h1>

    <div class="category-filters">
      <button
        v-for="cat in categories"
        :key="cat.value"
        class="filter-btn"
        :class="{ active: store.currentCategory === cat.value }"
        @click="store.currentCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <LoadingSpinner v-if="store.isLoading" text="加载课程中..." />

    <div v-else-if="store.filteredCourses.length === 0" class="empty-wrap">
      <EmptyState title="暂无课程" description="该分类下还没有课程，请选择其他分类" />
    </div>

    <div v-else class="courses-grid">
      <CourseCard
        v-for="course in store.filteredCourses"
        :key="course.id"
        :course="course"
        :progress="getProgress(course.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCoursesStore } from '@/stores/courses'
import { CATEGORY_LABELS } from '@/types'
import CourseCard from '@/components/learn/CourseCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = useCoursesStore()
const progressMap = ref<Record<number, number>>({})

const categories = [
  { value: 'all', label: '全部' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
]

onMounted(async () => {
  await store.loadCourses()
  for (const course of store.courses) {
    try {
      const [total] = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as count FROM chapters WHERE course_id = ?', [course.id]
      )
      const [completed] = await window.electronAPI.dbQuery(
        `SELECT COUNT(*) as count FROM learning_records lr
         JOIN chapters ch ON lr.chapter_id = ch.id
         WHERE ch.course_id = ? AND lr.status = 'completed'`, [course.id]
      )
      progressMap.value[course.id] = total.count > 0 ? (completed.count / total.count) * 100 : 0
    } catch {
      progressMap.value[course.id] = 0
    }
  }
})

function getProgress(courseId: number): number {
  return progressMap.value[courseId] || 0
}
</script>

<style scoped>
.learn-view {
  padding: var(--spacing-2xl);
}

.category-filters {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
}

.filter-btn {
  padding: 6px 18px;
  border-radius: var(--radius-full);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-xl);
}

.empty-wrap {
  margin-top: var(--spacing-3xl);
}
</style>
```

- [ ] **Step 2: 创建 CourseDetailView**

```vue
<!-- src/views/CourseDetailView.vue -->
<template>
  <div class="course-detail-view fade-in" v-if="course">
    <div class="detail-sidebar">
      <router-link to="/learn" class="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3L5.5 8l5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        返回课程列表
      </router-link>
      <ChapterTree
        :chapters="chapters"
        :course-id="course.id"
        :active-chapter-id="activeChapterId"
        :completed-ids="completedIds"
      />
    </div>
    <div class="detail-content">
      <div class="course-header">
        <div>
          <span class="tag tag-primary">{{ categoryLabel }}</span>
          <span class="tag" :class="difficultyClass" style="margin-left: 8px">{{ difficultyLabel }}</span>
        </div>
        <h1 class="course-title">{{ course.title }}</h1>
        <p class="course-desc">{{ course.description }}</p>
        <ProgressBar :percentage="overallProgress" label="课程进度" />
      </div>
      <div class="chapters-preview">
        <h3>课程章节</h3>
        <div
          v-for="chapter in chapters"
          :key="chapter.id"
          class="chapter-preview-item"
          :class="{ completed: completedIds.has(chapter.id) }"
          @click="$router.push(`/learn/${course.id}/${chapter.id}`)"
        >
          <span class="chapter-num">{{ chapter.sortOrder }}</span>
          <div class="chapter-preview-info">
            <span class="chapter-preview-title">{{ chapter.title }}</span>
            <span class="chapter-preview-meta">{{ chapter.type === 'practice' ? '实操' : '理论' }} · {{ chapter.estimatedMinutes }}分钟</span>
          </div>
          <span v-if="completedIds.has(chapter.id)" class="completed-badge">✓</span>
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-else text="加载中..." />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types'
import ChapterTree from '@/components/learn/ChapterTree.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const store = useCoursesStore()
const completedIds = ref(new Set<number>())
const activeChapterId = ref(0)

const courseId = computed(() => Number(route.params.courseId))
const course = computed(() => store.getCourseById(courseId.value))
const chapters = computed(() => store.getChaptersByCourseId(courseId.value))

const categoryLabel = computed(() => CATEGORY_LABELS[course.value?.category || 'basics'])
const difficultyLabel = computed(() => DIFFICULTY_LABELS[course.value?.difficulty || 'beginner'])
const difficultyClass = computed(() => {
  const map: Record<string, string> = { beginner: 'tag-success', intermediate: 'tag-warning', advanced: 'tag-primary' }
  return map[course.value?.difficulty || 'beginner'] || 'tag-primary'
})
const overallProgress = computed(() => {
  if (chapters.value.length === 0) return 0
  return (completedIds.value.size / chapters.value.length) * 100
})

onMounted(async () => {
  await store.loadChapters(courseId.value)
  const records = await window.electronAPI.dbQuery(
    `SELECT chapter_id FROM learning_records WHERE chapter_id IN (${chapters.value.map(c => c.id).join(',') || '0'}) AND status = 'completed'`
  )
  completedIds.value = new Set(records.map((r: any) => r.chapter_id))
})
</script>

<style scoped>
.course-detail-view {
  display: flex;
  min-height: calc(100vh - var(--header-height));
}

.detail-sidebar {
  width: 280px;
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border-light);
  padding-top: var(--spacing-lg);
}

.back-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.detail-content {
  flex: 1;
  padding: var(--spacing-2xl);
  overflow-y: auto;
}

.course-header {
  margin-bottom: var(--spacing-2xl);
}

.course-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  margin: var(--spacing-md) 0;
}

.course-desc {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  font-size: var(--font-size-lg);
}

.chapters-preview {
  margin-top: var(--spacing-2xl);
}

.chapters-preview h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.chapter-preview-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chapter-preview-item:hover {
  background: var(--color-bg-hover);
}

.chapter-preview-item.completed {
  opacity: 0.7;
}

.chapter-num {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 600;
  flex-shrink: 0;
}

.chapter-preview-item.completed .chapter-num {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.chapter-preview-info {
  flex: 1;
}

.chapter-preview-title {
  font-size: var(--font-size-base);
  font-weight: 500;
}

.chapter-preview-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
  display: block;
  margin-top: 2px;
}

.completed-badge {
  color: var(--color-success);
  font-weight: 700;
  font-size: var(--font-size-lg);
}
</style>
```

- [ ] **Step 3: 创建 ChapterView**

```vue
<!-- src/views/ChapterView.vue -->
<template>
  <div class="chapter-view fade-in" v-if="chapter">
    <div class="chapter-sidebar">
      <router-link :to="`/learn/${courseId}`" class="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3L5.5 8l5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        返回课程
      </router-link>
      <ChapterTree
        :chapters="allChapters"
        :course-id="courseId"
        :active-chapter-id="chapter.id"
        :completed-ids="completedIds"
      />
    </div>
    <div class="chapter-content">
      <ContentViewer :content="chapter.content" />
      <div class="chapter-footer">
        <button
          v-if="!isCompleted"
          class="btn btn-primary btn-lg"
          @click="markComplete"
        >
          标记为已完成
        </button>
        <span v-else class="completed-label">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#5B8C5A"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm4.5 5.5l-6 6-3-3" stroke="#5B8C5A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          已完成
        </span>
        <div class="chapter-nav">
          <button
            v-if="prevChapter"
            class="btn btn-outline"
            @click="$router.push(`/learn/${courseId}/${prevChapter.id}`)"
          >
            上一章
          </button>
          <button
            v-if="nextChapter"
            class="btn btn-primary"
            @click="$router.push(`/learn/${courseId}/${nextChapter.id}`)"
          >
            下一章
          </button>
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-else text="加载中..." />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import type { Chapter } from '@/types'
import ChapterTree from '@/components/learn/ChapterTree.vue'
import ContentViewer from '@/components/learn/ContentViewer.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const store = useCoursesStore()
const chapter = ref<Chapter | null>(null)
const completedIds = ref(new Set<number>())
const isCompleted = ref(false)

const courseId = computed(() => Number(route.params.courseId))
const chapterId = computed(() => Number(route.params.chapterId))
const allChapters = computed(() => store.getChaptersByCourseId(courseId.value))

const prevChapter = computed(() => {
  const idx = allChapters.value.findIndex(c => c.id === chapterId.value)
  return idx > 0 ? allChapters.value[idx - 1] : null
})

const nextChapter = computed(() => {
  const idx = allChapters.value.findIndex(c => c.id === chapterId.value)
  return idx < allChapters.value.length - 1 ? allChapters.value[idx + 1] : null
})

onMounted(async () => {
  await store.loadChapters(courseId.value)
  const chapters = allChapters.value
  const found = chapters.find(c => c.id === chapterId.value)
  if (found) {
    chapter.value = found
  }
  const records = await window.electronAPI.dbQuery(
    `SELECT chapter_id, status FROM learning_records WHERE chapter_id IN (${chapters.map(c => c.id).join(',') || '0'})`
  )
  for (const r of records) {
    if (r.status === 'completed') completedIds.value.add(r.chapter_id)
  }
  isCompleted.value = completedIds.value.has(chapterId.value)

  // 记录学习开始
  await window.electronAPI.dbExecute(
    'INSERT OR IGNORE INTO learning_records (chapter_id, status) VALUES (?, ?)',
    [chapterId.value, 'in_progress']
  )
})

async function markComplete() {
  await window.electronAPI.dbExecute(
    "UPDATE learning_records SET status = 'completed', completed_at = datetime('now'), duration_seconds = COALESCE(duration_seconds, 0) + 300 WHERE chapter_id = ? AND status = 'in_progress'",
    [chapterId.value]
  )
  isCompleted.value = true
  completedIds.value.add(chapterId.value)
}
</script>

<style scoped>
.chapter-view {
  display: flex;
  min-height: calc(100vh - var(--header-height));
}

.chapter-sidebar {
  width: 280px;
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border-light);
  padding-top: var(--spacing-lg);
}

.back-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-primary);
}

.chapter-content {
  flex: 1;
  overflow-y: auto;
}

.chapter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl) var(--spacing-2xl);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-card);
}

.completed-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-success);
}

.chapter-nav {
  display: flex;
  gap: var(--spacing-md);
}
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/views/LearnView.vue src/views/CourseDetailView.vue src/views/ChapterView.vue
git commit -m "feat: 学习中心页面 - LearnView/CourseDetailView/ChapterView"
```

---

### Task 15: 页面视图 - 实操实验室

**Files:**
- Create: `src/views/PracticeView.vue`
- Create: `src/views/TaskView.vue`

- [ ] **Step 1: 创建 PracticeView**

```vue
<!-- src/views/PracticeView.vue -->
<template>
  <div class="practice-view page-container fade-in">
    <h1 class="page-title">实操实验室</h1>
    <p class="page-subtitle">通过动手实践，巩固所学知识，提升 AI 编程能力</p>

    <LoadingSpinner v-if="store.isLoading" text="加载任务中..." />

    <div v-else-if="store.tasks.length === 0" class="empty-wrap">
      <EmptyState title="暂无任务" description="请先完成相关课程后，再来挑战实操任务" />
    </div>

    <div v-else class="tasks-grid">
      <div
        v-for="task in store.tasks"
        :key="task.id"
        class="task-card card"
        @click="$router.push(`/practice/${task.id}`)"
      >
        <div class="task-header">
          <h3 class="task-title">{{ task.title }}</h3>
          <span class="tag" :class="difficultyClass(task.difficulty)">{{ difficultyLabel(task.difficulty) }}</span>
        </div>
        <p class="task-desc">{{ task.description }}</p>
        <div class="task-footer">
          <span class="task-status" :class="getStatus(task.id)">{{ statusText(task.id) }}</span>
          <span class="btn btn-sm btn-primary">开始挑战</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePracticeStore } from '@/stores/practice'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = usePracticeStore()
const taskStatuses = ref<Record<number, string>>({})

onMounted(async () => {
  await store.loadTasks()
  for (const task of store.tasks) {
    try {
      const [record] = await window.electronAPI.dbQuery(
        'SELECT status FROM learning_records WHERE task_id = ? ORDER BY id DESC LIMIT 1',
        [task.id]
      )
      taskStatuses.value[task.id] = record?.status || 'not_started'
    } catch {
      taskStatuses.value[task.id] = 'not_started'
    }
  }
})

function difficultyLabel(d: string) {
  const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return map[d] || d
}

function difficultyClass(d: string) {
  const map: Record<string, string> = { easy: 'tag-success', medium: 'tag-warning', hard: 'tag-primary' }
  return map[d] || 'tag-primary'
}

function getStatus(taskId: number) {
  return taskStatuses.value[taskId] || 'not_started'
}

function statusText(taskId: number) {
  const map: Record<string, string> = { not_started: '未开始', in_progress: '进行中', completed: '已完成' }
  return map[getStatus(taskId)] || '未开始'
}
</script>

<style scoped>
.practice-view {
  padding: var(--spacing-2xl);
}

.page-subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  margin-top: -12px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--spacing-xl);
}

.task-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.task-card:hover {
  border-color: var(--color-primary);
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.task-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex: 1;
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-status {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.task-status.not_started { color: var(--color-text-light); }
.task-status.in_progress { color: var(--color-warning); }
.task-status.completed { color: var(--color-success); }
</style>
```

- [ ] **Step 2: 创建 TaskView（实操核心页面）**

```vue
<!-- src/views/TaskView.vue -->
<template>
  <div class="task-view fade-in" v-if="store.currentTask">
    <div class="task-editor-panel">
      <CodeEditor v-model="store.userCode" />
    </div>
    <div class="task-right-panel">
      <TaskPanel :task="store.currentTask" />
      <AiChatSimulator
        :messages="store.chatMessages"
        :current-code="store.userCode"
        @send="handleSend"
      />
      <div class="task-actions">
        <button class="btn btn-outline" @click="handleSave">保存代码</button>
        <button class="btn btn-primary" @click="handleSubmit">提交验证</button>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <div v-if="result.show" class="result-overlay" @click="result.show = false">
      <div class="result-card card" :class="result.passed ? 'success' : 'failed'" @click.stop>
        <div class="result-icon">
          <span v-if="result.passed">&#10003;</span>
          <span v-else>&#10007;</span>
        </div>
        <h2 class="result-title">{{ result.passed ? '验证通过！' : '还需要改进' }}</h2>
        <p class="result-message">{{ result.message }}</p>
        <div class="result-actions">
          <button class="btn btn-outline" @click="result.show = false">继续编辑</button>
          <router-link v-if="result.passed" to="/practice" class="btn btn-primary">返回任务列表</router-link>
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-else text="加载任务中..." />
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { usePracticeStore } from '@/stores/practice'
import CodeEditor from '@/components/practice/CodeEditor.vue'
import TaskPanel from '@/components/practice/TaskPanel.vue'
import AiChatSimulator from '@/components/practice/AiChatSimulator.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const store = usePracticeStore()

const result = reactive({ show: false, passed: false, message: '' })

const taskId = Number(route.params.taskId)

onMounted(() => {
  store.loadTask(taskId)
})

async function handleSave() {
  await store.saveCode()
}

async function handleSubmit() {
  const res = await store.submitCode()
  result.show = true
  result.passed = res.passed
  result.message = res.message
}

function handleSend(content: string) {
  store.addChatMessage('user', content)

  // 模拟 Agent 响应
  setTimeout(() => {
    const responses: Record<string, string> = {
      '分析': '我来分析你的代码：\n\n1. 代码结构清晰，变量命名合理\n2. 建议添加错误处理逻辑\n3. 可以考虑提取重复代码为独立函数\n\n继续加油！',
      '优化': '以下是我的优化建议：\n\n1. 使用更高效的数据结构\n2. 添加缓存层减少重复计算\n3. 考虑异步处理提升性能',
      '修复': '我发现了以下问题：\n\n1. 缺少空值检查\n2. 循环逻辑可以优化\n3. 建议添加类型注解\n\n请尝试修改后再次提交。',
      '帮助': '我可以帮你：\n- 分析代码质量\n- 提供优化建议\n- 指出潜在 Bug\n- 解释代码逻辑\n\n试试输入「分析」或「优化」来获取具体建议。'
    }

    let response = '我收到了你的消息。请描述具体问题，比如「分析这段代码」或「给出优化建议」，我会尽力帮助你。'
    for (const [key, val] of Object.entries(responses)) {
      if (content.includes(key)) { response = val; break }
    }

    store.addChatMessage('agent', response)
  }, 800)
}
</script>

<style scoped>
.task-view {
  display: flex;
  height: calc(100vh - var(--header-height));
}

.task-editor-panel {
  flex: 1;
  padding: var(--spacing-md);
  min-width: 0;
}

.task-right-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  padding-left: 0;
}

.task-right-panel > :first-child {
  max-height: 35%;
}

.task-right-panel > :nth-child(2) {
  flex: 1;
}

.task-actions {
  display: flex;
  gap: var(--spacing-md);
}

.task-actions button {
  flex: 1;
  padding: 10px 0;
}

.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.result-card {
  width: 400px;
  text-align: center;
  padding: var(--spacing-2xl);
}

.result-card.success .result-icon {
  color: var(--color-success);
}

.result-card.failed .result-icon {
  color: var(--color-warning);
}

.result-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.result-title {
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-sm);
}

.result-message {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.result-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/views/PracticeView.vue src/views/TaskView.vue
git commit -m "feat: 实操实验室页面 - PracticeView/TaskView"
```

---

### Task 16: 页面视图 - 学习进度与设置

**Files:**
- Create: `src/views/ProgressView.vue`
- Create: `src/views/SettingsView.vue`

- [ ] **Step 1: 创建 ProgressView**

```vue
<!-- src/views/ProgressView.vue -->
<template>
  <div class="progress-view page-container fade-in">
    <h1 class="page-title">学习进度</h1>

    <div class="stats-grid">
      <StatCard :value="stats.totalMinutes + ' 分钟'" label="累计学习时长" icon-bg="#EDF4EE">
        <template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A7C59" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></template>
      </StatCard>
      <StatCard :value="stats.totalCoursesCompleted" label="完成课程" icon-bg="#EDF7ED">
        <template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8C5A" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></template>
      </StatCard>
      <StatCard :value="stats.streakDays + ' 天'" label="连续学习" icon-bg="#FDF8ED">
        <template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="2"><path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z"/></svg></template>
      </StatCard>
      <StatCard :value="`${taskStats.passed}/${taskStats.total}`" label="任务通过" icon-bg="#EDF3F8">
        <template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8CB8" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></template>
      </StatCard>
    </div>

    <div class="charts-grid">
      <DurationChart :data="progressData.dailyStats" />
      <WeeklyReport
        :weekly-minutes="weeklyMinutes"
        :tasks-completed="taskStats.passed"
        :streak-days="stats.streakDays"
      />
    </div>

    <div class="charts-grid">
      <CalendarHeatmap :data="progressData.dailyStats" />
    </div>

    <div class="course-progress-section card">
      <h3 class="section-title">课程完成度</h3>
      <div v-for="item in progressData.courseCompletion" :key="item.courseId" class="course-progress-item">
        <div class="course-progress-header">
          <span class="course-progress-name">{{ item.title }}</span>
          <span class="course-progress-count">{{ item.completed }}/{{ item.total }}</span>
        </div>
        <ProgressBar :percentage="item.total > 0 ? (item.completed / item.total) * 100 : 0" :show-label="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { storeToRefs } from 'pinia'
import StatCard from '@/components/common/StatCard.vue'
import DurationChart from '@/components/progress/DurationChart.vue'
import CalendarHeatmap from '@/components/progress/CalendarHeatmap.vue'
import WeeklyReport from '@/components/progress/WeeklyReport.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

const progressStore = useProgressStore()
const { dashboardStats: stats, progressData } = storeToRefs(progressStore)

const taskStats = computed(() => progressData.value.taskStats)

const weeklyMinutes = computed(() => {
  const last7 = progressData.value.dailyStats.slice(-7)
  return last7.reduce((sum, d) => sum + d.minutes, 0)
})

onMounted(async () => {
  await progressStore.loadDashboard()
  await progressStore.loadProgressData()
})
</script>

<style scoped>
.progress-view {
  padding: var(--spacing-2xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-xl);
}

.course-progress-section {
  margin-top: var(--spacing-xl);
}

.course-progress-item {
  margin-bottom: var(--spacing-lg);
}

.course-progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.course-progress-name {
  font-size: var(--font-size-base);
  font-weight: 500;
}

.course-progress-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
```

- [ ] **Step 2: 创建 SettingsView**

```vue
<!-- src/views/SettingsView.vue -->
<template>
  <div class="settings-view page-container fade-in">
    <h1 class="page-title">设置</h1>

    <div class="settings-section card">
      <h3 class="section-title">个人信息</h3>
      <div class="form-group">
        <label class="form-label">昵称</label>
        <input v-model="nickname" class="input" type="text" placeholder="输入你的昵称" />
      </div>
      <button class="btn btn-primary" @click="saveProfile">保存</button>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">学习目标</h3>
      <div class="form-group">
        <label class="form-label">每日学习目标（分钟）</label>
        <input v-model.number="dailyGoal" class="input" type="number" min="10" max="480" />
      </div>
      <button class="btn btn-primary" @click="saveGoal">保存</button>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">学习提醒</h3>
      <div class="form-group">
        <label class="form-check">
          <input v-model="reminderEnabled" type="checkbox" />
          <span>启用每日学习提醒</span>
        </label>
      </div>
      <div class="form-group" v-if="reminderEnabled">
        <label class="form-label">提醒时间</label>
        <input v-model="reminderTime" class="input" type="time" />
      </div>
      <button class="btn btn-primary" @click="saveReminder">保存</button>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">数据管理</h3>
      <p class="section-desc">导出或清除你的学习数据</p>
      <div class="form-actions">
        <button class="btn btn-outline" @click="exportData">导出数据</button>
        <button class="btn btn-outline" style="color: var(--color-error); border-color: var(--color-error)" @click="clearData">清除数据</button>
      </div>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">关于</h3>
      <p class="section-desc">AI Coding Learner v1.0.0</p>
      <p class="section-desc">一款帮助你学习 AI 编程的桌面应用</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const nickname = ref('')
const dailyGoal = ref(30)
const reminderEnabled = ref(false)
const reminderTime = ref('09:00')

onMounted(async () => {
  await userStore.loadConfig()
  nickname.value = userStore.config.nickname
  dailyGoal.value = userStore.config.dailyGoalMinutes
  reminderEnabled.value = userStore.config.reminderEnabled
  reminderTime.value = userStore.config.reminderTime
})

async function saveProfile() {
  await userStore.updateConfig({ nickname: nickname.value })
}

async function saveGoal() {
  await userStore.updateConfig({ dailyGoalMinutes: dailyGoal.value })
}

async function saveReminder() {
  await userStore.updateConfig({ reminderEnabled: reminderEnabled.value, reminderTime: reminderTime.value })
}

async function exportData() {
  // 导出功能
}

async function clearData() {
  if (confirm('确定要清除所有学习数据吗？此操作不可恢复。')) {
    // 清除数据
  }
}
</script>

<style scoped>
.settings-view {
  padding: var(--spacing-2xl);
  max-width: 640px;
}

.settings-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.form-group .input {
  width: 100%;
  max-width: 320px;
}

.form-check {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/views/ProgressView.vue src/views/SettingsView.vue
git commit -m "feat: 进度与设置页面 - ProgressView/SettingsView"
```

---

### Task 17: 修复 ChapterTree 组件 Bug

**Files:**
- Modify: `src/components/learn/ChapterTree.vue`

`isCompleted` 函数需要从 props 读取 completedIds：

- [ ] **Step 1: 修复 isCompleted**

```typescript
// 替换 ChapterTree 的 script 部分
<script setup lang="ts">
import type { Chapter } from '@/types'

const props = defineProps<{
  chapters: Chapter[]
  courseId: number
  activeChapterId: number
  completedIds: Set<number>
}>()

function isCompleted(chapterId: number): boolean {
  return props.completedIds.has(chapterId)
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/learn/ChapterTree.vue
git commit -m "fix: ChapterTree isCompleted 从 props 读取 completedIds"
```

---

### Task 18: 最终集成与验证

- [ ] **Step 1: 初始化 git 仓库**

```bash
cd d:\ai\6a5dd856e73672a131495d9d ; git init
```

- [ ] **Step 2: 安装依赖**

```bash
cd d:\ai\6a5dd856e73672a131495d9d ; npm install
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
cd d:\ai\6a5dd856e73672a131495d9d ; npx vue-tsc --noEmit
```

- [ ] **Step 4: 验证 Vite 构建**

```bash
cd d:\ai\6a5dd856e73672a131495d9d ; npx vite build
```

运行时若遇到 Electron 原生模块相关错误，属于预期情况——完整运行需 Electron 环境。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: 最终集成与依赖安装"
```