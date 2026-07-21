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

const props = defineProps<{ content: string }>()

const md: MarkdownIt = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  highlight(str: string, lang: string): string {
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
.content-viewer { padding: var(--spacing-2xl); max-width: 800px; }
.content-viewer :deep(.markdown-body) { color: var(--color-text); line-height: 1.8; }
.content-viewer :deep(h1) { font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: var(--spacing-xl); }
.content-viewer :deep(h2) { font-size: var(--font-size-2xl); font-weight: 600; margin-top: var(--spacing-2xl); margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--color-border-light); }
.content-viewer :deep(h3) { font-size: var(--font-size-xl); font-weight: 600; margin-top: var(--spacing-xl); margin-bottom: var(--spacing-md); }
.content-viewer :deep(p) { margin-bottom: var(--spacing-md); }
.content-viewer :deep(ul), .content-viewer :deep(ol) { margin-bottom: var(--spacing-md); padding-left: var(--spacing-xl); }
.content-viewer :deep(li) { margin-bottom: var(--spacing-xs); }
.content-viewer :deep(table) { width: 100%; border-collapse: collapse; margin-bottom: var(--spacing-lg); }
.content-viewer :deep(th), .content-viewer :deep(td) { padding: 10px 14px; border: 1px solid var(--color-border); text-align: left; }
.content-viewer :deep(th) { background: var(--color-primary-bg); font-weight: 600; }
.content-viewer :deep(pre) { background: #f6f8fa; border-radius: var(--radius-md); padding: var(--spacing-lg); overflow-x: auto; margin-bottom: var(--spacing-lg); font-family: var(--font-family-mono); font-size: var(--font-size-sm); line-height: 1.6; }
.content-viewer :deep(code) { font-family: var(--font-family-mono); font-size: 0.9em; background: var(--color-primary-bg); padding: 2px 6px; border-radius: var(--radius-sm); }
.content-viewer :deep(pre code) { background: none; padding: 0; font-size: inherit; }
.content-viewer :deep(blockquote) { border-left: 4px solid var(--color-primary); padding-left: var(--spacing-lg); margin-bottom: var(--spacing-lg); color: var(--color-text-secondary); background: var(--color-primary-bg); padding: var(--spacing-md) var(--spacing-lg); border-radius: 0 var(--radius-md) var(--radius-md) 0; }
</style>