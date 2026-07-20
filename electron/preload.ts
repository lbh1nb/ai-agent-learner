/* electron/preload.ts */
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
  dbExecute: (sql: string, params?: any[]) => ipcRenderer.invoke('db:execute', sql, params),
  readCourseFile: (path: string) => ipcRenderer.invoke('fs:read-course', path),
  saveCode: (taskId: number, code: string) => ipcRenderer.invoke('fs:save-code', taskId, code),
  getAppVersion: () => ipcRenderer.invoke('app:get-version')
})