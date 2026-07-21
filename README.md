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
-   **15 个章节** — 理论 + 实操，每章配有真实 Bilibili 教学视频 + 4 个配套学习资源链接
-   **6 个实操任务** — 5 个核心任务 + 1 个综合实战引导项目，内置 Monaco 代码编辑器，分步引导（含预期效果+参考代码）+ 单元测试验证
-   **Web Worker 代码沙箱** — 安全执行用户 TypeScript 代码，支持类型剥离和测试用例验证
-   **AI 助手对话** — 支持 OpenAI 兼容 API（DeepSeek、Moonshot 等），未配置时自动回退模拟模式
-   **学习统计** — 每日学习时长、连续天数、课程完成进度，ECharts 可视化
-   **竹绿色主题** — 简洁美观，护眼舒适

> **v1.2.0 更新**：①15 章节全部补充真实 B 站视频；②每章新增 4 个配套学习资源；③实操任务分步引导增强（预期效果 + 参考代码切换）；④修复右侧面板按钮被截断的布局问题
>
> **v1.1.0 更新**：实操实验室全面升级 — Monaco 编辑器替换 textarea、Web Worker 沙箱执行代码、5+1 分步引导任务、真实 LLM 接入

---

## 下载与使用（普通用户）

无需安装 Node.js、npm 或任何开发环境，三步即可开始学习：

1. **下载** — 前往 [Releases 页面](https://github.com/lbh1nb/ai-agent-learner/releases)，下载最新版的 `AI Coding Learner-1.2.0-win.zip`
2. **解压** — 将 zip 文件解压到任意目录（如桌面）
3. **运行** — 双击解压目录中的 `AI Coding Learner.exe`

> 也可以下载 `AI Coding Learner 1.2.0.exe` 便携版，双击直接运行，无需解压。

应用数据（学习记录、进度）会自动保存在程序所在目录的 `user-data` 文件夹中，删除程序即可彻底清除所有数据。

---

## 使用指南

### 界面概览

应用采用侧边栏 + 主内容区布局，左侧导航包含五个入口：

| 导航 | 功能 |
|------|------|
| 首页 | 学习仪表盘：今日学习时长、连续天数、课程进度概览 |
| 课程学习 | 浏览全部 6 门课程，按分类筛选，进入课程详情 |
| 实操实验室 | 6 个分步引导任务（含引导项目），Monaco 编辑器 + 预期效果 + 参考代码 + 单元测试 + AI 助手 |
| 学习统计 | 学习时长趋势图、课程完成度、任务通过率 |
| 设置 | 修改昵称、学习目标、AI 助手 LLM API Key 配置 |

### 学习流程

1. **选择课程** — 进入「课程学习」，点击课程卡片查看详情
2. **学习章节** — 左侧章节列表自由切换，右侧阅读内容 + 观看 Bilibili 视频 + 查看配套学习资源
3. **计时追踪** — 进入章节后自动计时，每 30 秒自动保存学习时长
4. **标记完成** — 阅读完毕后点击「标记为已完成」，系统记录实际学习时长
5. **实操练习** — 进入「实操实验室」，按分步引导（含预期效果 + 参考代码）在 Monaco 编辑器中编写代码，运行测试用例验证，与 AI 助手对话答疑

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
| 代码编辑器 | Monaco Editor（vs-dark 主题、TS 语法高亮） |
| 代码执行 | Web Worker 沙箱（类型剥离 + 单元测试） |
| LLM 接入 | OpenAI 兼容 API（fetch + 回退模拟） |
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
- `AI Coding Learner 1.2.0.exe` — 便携版，双击即运行
- `AI Coding Learner-1.2.0-win.zip` — 解压版，解压后运行

---

## 项目结构

```
ai-agent-learner/
├── electron/            # Electron 主进程
│   ├── main.ts          # 窗口管理、生命周期、错误日志
│   ├── preload.ts       # contextBridge 预加载脚本
│   ├── database.ts      # SQLite 数据库初始化与种子数据（含 15 章节 B 站视频 + 资源 + 6 任务分步引导）
│   └── ipc-handlers.ts  # IPC 通信处理器
├── src/                 # 渲染进程（Vue 3）
│   ├── components/      # 公共组件（含 practice/ CodeEditor, TaskPanel, AiChatSimulator）
│   ├── views/           # 页面视图（8 个）
│   ├── stores/          # Pinia 状态管理（4 个）
│   ├── services/        # 服务层
│   │   └── llm.ts       # LLM API 调用 + 模拟回退
│   ├── workers/         # Web Worker
│   │   └── code-runner.ts # 代码执行沙箱（类型剥离 + 测试验证）
│   ├── router/          # Vue Router 路由
│   └── types/           # TypeScript 类型定义（含 TaskStep, TestCase, RunResult）
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