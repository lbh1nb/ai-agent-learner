import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as monaco from 'monaco-editor'
import { loader } from '@guolao/vue-monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import App from './App.vue'
import router from './router'
import './assets/styles/variables.css'
import './assets/styles/global.css'

// 配置 Monaco Editor 的 Web Worker（Electron 离线环境必须本地加载）
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

// 让 @guolao/vue-monaco-editor 使用本地安装的 monaco-editor
loader.config({ monaco })

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
