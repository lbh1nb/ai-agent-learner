# AI Coding Learner

> 一款帮助开发者学习使用 AI Agent 编程的桌面应用，下载解压即可使用，无需配置任何环境。

[![Electron](https://img.shields.io/badge/Electron-28.x-bamboo?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.4-bamboo?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-bamboo?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-bamboo)](#)

---

## 简介

AI Coding Learner 是一款面向开发者的 AI 编程学习桌面软件，覆盖从零基础到进阶的完整课程体系。内置代码实操环境与 AI 模拟对话，全程离线可用，学习数据本地存储，无需注册账号。

### 核心功能

-   **6 门系统课程** — Agent 基础、Prompt Engineering、Tool Calling、工作流设计、多 Agent 协作、RAG 技术
-   **15 个章节** — 理论 + 实操，每章配有 Bilibili 教学视频
-   **5 个实操任务** — 内置 Monaco 代码编辑器，支持即时验证
-   **AI 模拟对话** — 模拟 Agent 交互，理解 AI 编程思维
-   **学习统计** — 每日学习时长、连续天数、课程完成进度，ECharts 可视化
-   **竹绿色主题** — 简洁美观，护眼舒适

---

## 下载与使用（普通用户）

无需安装 Node.js、npm 或任何开发环境，三步即可开始学习：

1. **下载** — 前往 [Releases 页面](https://github.com/lbh1nb/ai-agent-learner/releases)，下载最新版的 `AI Coding Learner-1.0.0-win.zip`
2. **解压** — 将 zip 文件解压到任意目录（如桌面）
3. **运行** — 双击解压目录中的 `AI Coding Learner.exe`

> 也可以下载 `AI Coding Learner 1.0.0.exe` 便携版，双击直接运行，无需解压。

应用数据（学习记录、进度）会自动保存在程序所在目录的 `user-data` 文件夹中，删除程序即可彻底清除所有数据。

---

## 使用指南

### 界面概览

应用采用侧边栏 + 主内容区布局，左侧导航包含五个入口：

| 导航 | 功能 |
|------|------|
| 首页 | 学习仪表盘：今日学习时长、连续天数、课程进度概览 |
| 课程学习 | 浏览全部 6 门课程，按分类筛选，进入课程详情 |
| 实操练习 | 浏览 5 个实操任务，进入代码编辑器完成编程练习 |
| 学习统计 | 学习时长趋势图、课程完成度、任务通过率 |
| 设置 | 修改昵称、每日学习目标 |

### 学习流程

1. **选择课程** — 进入「课程学习」，点击课程卡片查看详情
2. **学习章节** — 左侧章节列表自由切换，右侧阅读内容 + 观看 Bilibili 视频
3. **计时追踪** — 进入章节后自动计时，每 30 秒自动保存学习时长
4. **标记完成** — 阅读完毕后点击「标记为已完成」，系统记录实际学习时长
5. **实操练习** — 进入「实操练习」，在代码编辑器中编写代码，与 AI 模拟对话交互

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 28 |
| 前端 | Vue 3 + TypeScript + Composition API |
| 构建 | Vite 5 + vite-plugin-electron |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 数据库 | better-sqlite3（本地存储） |
| 代码编辑器 | Monaco Editor |
| 图表 | ECharts / vue-echarts |
| Markdown | markdown-it + highlight.js |

---

## 源码构建（开发者）

如需从源码运行或二次开发：

### 环境要求

-   Node.js 18.x 或更高
-   npm 9.x 或更高

### 步骤

```bash
# 1. 克隆仓库
git clone git@github.com:lbh1nb/ai-agent-learner.git
cd ai-agent-learner

# 2. 安装依赖
npm install

# 3. 启动开发模式
npm run dev

# 4. 打包成可执行文件（生成在 release/ 目录）
npm run pack
```

打包后会在 `release/` 目录生成：
- `AI Coding Learner 1.0.0.exe` — 便携版，双击即运行
- `AI Coding Learner-1.0.0-win.zip` — 解压版，解压后运行

---

## 项目结构

```
ai-agent-learner/
├── electron/            # Electron 主进程
│   ├── main.ts          # 窗口管理、生命周期
│   ├── preload.ts       # contextBridge 预加载脚本
│   ├── database.ts      # SQLite 数据库初始化与操作
│   └── ipc-handlers.ts  # IPC 通信处理器
├── src/                 # 渲染进程（Vue 3）
│   ├── components/      # 公共组件
│   ├── views/           # 页面视图
│   ├── stores/          # Pinia 状态管理
│   ├── router/          # Vue Router 路由
│   └── types/           # TypeScript 类型定义
├── electron-builder.yml # 打包配置
├── 使用文档.md          # 详细使用文档
└── 系统架构文档.md      # 系统架构设计文档
```

---

## 文档

-   [使用文档](./使用文档.md) — 详细的安装、使用与常见问题
-   [系统架构文档](./系统架构文档.md) — 系统架构、模块设计、数据模型

---

## License

MIT