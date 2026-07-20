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