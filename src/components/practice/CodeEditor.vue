<template>
  <div class="code-editor">
    <div class="editor-header">
      <span class="editor-title">代码编辑器</span>
      <div class="editor-actions">
        <button class="editor-btn" @click="formatCode" title="格式化代码">格式化</button>
        <button class="editor-btn" @click="resetCode" title="重置为初始代码">重置</button>
        <span class="editor-lang">TypeScript</span>
      </div>
    </div>
    <div class="editor-body">
      <vue-monaco-editor
        v-model:value="code"
        theme="vs-dark"
        language="typescript"
        :options="editorOptions"
        @mount="handleMount"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import type * as Monaco from 'monaco-editor'

const props = defineProps<{ modelValue: string; initialCode?: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'reset': []
}>()

const editor = shallowRef<Monaco.editor.IStandaloneCodeEditor | null>(null)

const code = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val)
})

const editorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on',
  lineNumbers: 'on',
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true },
  suggestOnTriggerCharacters: true,
  quickSuggestions: { other: true, comments: false, strings: true },
}

function handleMount(editorInstance: Monaco.editor.IStandaloneCodeEditor) {
  editor.value = editorInstance
  // 配置 TypeScript 编译选项
  const monaco = (window as any).monaco
  if (monaco) {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      strict: false,
      esModuleInterop: true,
      allowNonTsExtensions: true
    })
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })
  }
}

function formatCode() {
  editor.value?.getAction?.('editor.action.formatDocument')?.run()
}

function resetCode() {
  if (confirm('确定要重置为初始代码吗？当前修改将丢失。')) {
    emit('reset')
  }
}
</script>

<style scoped>
.code-editor { height: 100%; display: flex; flex-direction: column; background: #1e1e1e; border-radius: var(--radius-lg); overflow: hidden; }
.editor-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #2d2d2d; border-bottom: 1px solid #3d3d3d; }
.editor-title { font-size: var(--font-size-xs); color: #cccccc; font-weight: 500; }
.editor-actions { display: flex; align-items: center; gap: 8px; }
.editor-btn { background: transparent; border: 1px solid #3d3d3d; color: #cccccc; font-size: 12px; padding: 2px 8px; border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-fast); }
.editor-btn:hover { background: #3d3d3d; color: #fff; }
.editor-lang { font-size: var(--font-size-xs); color: #888; padding: 2px 8px; background: #3d3d3d; border-radius: var(--radius-sm); }
.editor-body { flex: 1; overflow: hidden; }
.editor-body :deep(.monaco-editor) { height: 100%; }
</style>
