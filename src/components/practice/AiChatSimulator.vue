<template>
  <div class="ai-chat">
    <div class="chat-header">
      <span class="chat-title">AI 助手</span>
      <span class="chat-badge">模拟</span>
    </div>
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="chat-placeholder">
        <p>输入你的问题或指令，模拟 Agent 会响应你。</p>
        <p class="chat-hint">试试输入：<code>帮我分析这段代码</code> 或 <code>给出优化建议</code></p>
      </div>
      <div v-for="msg in messages" :key="msg.id" class="chat-message" :class="msg.role">
        <div class="message-avatar">{{ msg.role === 'user' ? '你' : 'AI' }}</div>
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>
    <div class="chat-input-area">
      <input v-model="inputText" class="chat-input" placeholder="输入你的问题..." @keydown.enter="sendMessage" />
      <button class="btn btn-primary btn-sm" @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '@/types'
const props = defineProps<{ messages: ChatMessage[]; currentCode: string }>()
const emit = defineEmits<{ send: [content: string] }>()
const inputText = ref('')
const messagesContainer = ref<HTMLElement>()
watch(() => props.messages.length, async () => {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
})
function sendMessage() {
  const text = inputText.value.trim()
  if (!text) return
  emit('send', text)
  inputText.value = ''
}
</script>

<style scoped>
.ai-chat { display: flex; flex-direction: column; height: 100%; background: var(--color-bg-card); border-radius: var(--radius-lg); overflow: hidden; }
.chat-header { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-md) var(--spacing-lg); border-bottom: 1px solid var(--color-border-light); }
.chat-title { font-size: var(--font-size-base); font-weight: 600; }
.chat-badge { font-size: var(--font-size-xs); padding: 2px 8px; background: var(--color-warning-bg); color: var(--color-warning); border-radius: var(--radius-full); }
.chat-messages { flex: 1; padding: var(--spacing-lg); overflow-y: auto; display: flex; flex-direction: column; gap: var(--spacing-md); }
.chat-placeholder { text-align: center; color: var(--color-text-light); padding: var(--spacing-2xl); }
.chat-hint { margin-top: var(--spacing-sm); font-size: var(--font-size-sm); }
.chat-hint code { background: var(--color-primary-bg); padding: 1px 6px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
.chat-message { display: flex; gap: var(--spacing-sm); }
.chat-message.user { flex-direction: row-reverse; }
.message-avatar { width: 28px; height: 28px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; flex-shrink: 0; }
.chat-message.user .message-avatar { background: var(--color-primary); color: white; }
.chat-message.agent .message-avatar { background: var(--color-accent); color: white; }
.message-content { max-width: 80%; padding: 10px 14px; border-radius: var(--radius-md); font-size: var(--font-size-sm); line-height: 1.6; white-space: pre-wrap; }
.chat-message.user .message-content { background: var(--color-primary); color: white; border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg); }
.chat-message.agent .message-content { background: var(--color-bg); color: var(--color-text); border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg); }
.chat-input-area { display: flex; gap: var(--spacing-sm); padding: var(--spacing-md) var(--spacing-lg); border-top: 1px solid var(--color-border-light); }
.chat-input { flex: 1; padding: 8px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--font-size-sm); background: var(--color-bg); transition: border-color var(--transition-fast); }
.chat-input:focus { border-color: var(--color-primary); }
</style>