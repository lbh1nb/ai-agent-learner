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
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const lineCount = computed(() => Math.max(props.modelValue.split('\n').length, 1))
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = e.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = props.modelValue
    const newValue = value.substring(0, start) + '  ' + value.substring(end)
    emit('update:modelValue', newValue)
    setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + 2 })
  }
}
</script>

<style scoped>
.code-editor { height: 100%; display: flex; flex-direction: column; background: #1e1e1e; border-radius: var(--radius-lg); overflow: hidden; }
.editor-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #2d2d2d; border-bottom: 1px solid #3d3d3d; }
.editor-title { font-size: var(--font-size-xs); color: #cccccc; font-weight: 500; }
.editor-lang { font-size: var(--font-size-xs); color: #888; padding: 2px 8px; background: #3d3d3d; border-radius: var(--radius-sm); }
.editor-body { flex: 1; display: flex; overflow: hidden; }
.editor-lines { padding: 16px 0; text-align: right; min-width: 44px; background: #1e1e1e; border-right: 1px solid #2d2d2d; overflow: hidden; user-select: none; }
.line-number { display: block; padding: 0 12px 0 8px; font-size: 13px; line-height: 1.6; color: #6e7681; font-family: var(--font-family-mono); }
.editor-textarea { flex: 1; padding: 16px; background: #1e1e1e; color: #d4d4d4; border: none; outline: none; resize: none; font-family: var(--font-family-mono); font-size: 13px; line-height: 1.6; tab-size: 2; white-space: pre; overflow-wrap: normal; overflow-x: auto; }
.editor-textarea::placeholder { color: #6e7681; }
</style>