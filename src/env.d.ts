/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  interface Window {
    electronAPI: {
      dbQuery: (sql: string, params?: any[]) => Promise<any>
      dbExecute: (sql: string, params?: any[]) => Promise<any>
      readCourseFile: (path: string) => Promise<string>
      saveCode: (taskId: number, code: string) => Promise<void>
      getAppVersion: () => Promise<string>
    }
  }
}

export {}