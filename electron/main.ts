/* electron/main.ts */
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { initDatabase, closeDatabase } from './database'
import { registerIpcHandlers } from './ipc-handlers'

// 确定 userData 目录：
// 1. 开发模式：项目内 user-data/（绕过 TRAE 沙箱限制）
// 2. 生产模式：优先系统默认路径（各平台均可写）
//    若系统默认路径不可写（如沙箱/权限限制），回退到 exe 同级 user-data/
function ensureUserDataPath(): void {
  if (process.env.VITE_DEV_SERVER_URL) {
    app.setPath('userData', path.join(__dirname, '..', 'user-data'))
    return
  }

  // 生产模式：测试系统默认 userData 是否可写
  const defaultPath = app.getPath('userData')
  try {
    if (!fs.existsSync(defaultPath)) {
      fs.mkdirSync(defaultPath, { recursive: true })
    }
    // 实际写入测试
    const testFile = path.join(defaultPath, '.write-test')
    fs.writeFileSync(testFile, 'ok')
    fs.unlinkSync(testFile)
  } catch {
    // 系统默认路径不可写，回退到 exe 旁边的 user-data（portable 模式）
    const exeDir = path.dirname(app.getPath('exe'))
    const fallbackPath = path.join(exeDir, 'user-data')
    if (!fs.existsSync(fallbackPath)) {
      fs.mkdirSync(fallbackPath, { recursive: true })
    }
    app.setPath('userData', fallbackPath)
  }
}

ensureUserDataPath()

// 启动日志：记录 userData 路径，便于排查 release 版本问题
try {
  const logPath = path.join(app.getPath('userData'), 'startup.log')
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] App started, userData=${app.getPath('userData')}, exe=${app.getPath('exe')}\n`, 'utf-8')
} catch (e) {
  console.error('Cannot write startup log:', e)
}

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
    mainWindow.loadFile(path.join(__dirname, '../app-dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // 数据库初始化失败不阻塞窗口创建，便于用户看到错误信息
  let dbError: string | null = null
  try {
    initDatabase()
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err)
    console.error('Database init failed:', err)
  }
  registerIpcHandlers()
  createWindow()

  // 如果数据库初始化失败，在窗口加载后通过 dialog 提示
  if (dbError && mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      const { dialog } = require('electron')
      dialog.showErrorBox(
        '数据库初始化失败',
        `数据库初始化出错：${dbError}\n\n请检查应用目录权限，或联系开发者。\n日志位置：${app.getPath('userData')}\\init-error.log`
      )
    })
  }

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