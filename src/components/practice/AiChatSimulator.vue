<template>
  <div class="ai-chat">
    <div class="chat-header">
      <span class="chat-title">AI 助手</span>
      <span class="chat-badge" :class="llmConfigured ? 'badge-real' : 'badge-sim'">
        {{ llmConfigured ? '真实 LLM' : '模拟' }}
      </span>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="chat-placeholder">
        <p>输入你的问题或指令，AI 助手会响应你。</p>
        <p class="chat-hint">
          试试输入：<code>分析这段代码</code> 或 <code>给出优化建议</code>
        </p>
        <p v-if="!llmConfigured" class="chat-configure-hint">
          <router-link to="/settings" class="configure-link">⚙️ 配置 API Key 以启用真实 LLM</router-link>
        </p>
      </div>

      <div v-for="msg in messages" :key="msg.id" class="chat-message" :class="msg.role">
        <div class="message-avatar">{{ msg.role === 'user' ? '你' : 'AI' }}</div>
        <div class="message-content">{{ msg.content }}</div>
      </div>

      <div v-if="isThinking" class="chat-message agent">
        <div class="message-avatar">AI</div>
        <div class="message-content thinking">
          <span class="thinking-dot"></span>
          <span class="thinking-dot"></span>
          <span class="thinking-dot"></span>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <input
        v-model="inputText"
        class="chat-input"
        placeholder="输入你的问题..."
        @keydown.enter="sendMessage"
        :disabled="isThinking"
      />
      <button class="btn btn-primary btn-sm" @click="sendMessage" :disabled="isThinking || !inputText.trim()">
        {{ isThinking ? '思考中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { isLLMConfigured } from '@/services/llm'
import type { ChatMessage } from '@/types'

const props = defineProps<{ messages: ChatMessage[]; currentCode: string }>()
const emit = defineEmits<{ send: [content: string] }>()

const userStore = useUserStore()
const inputText = ref('')
const messagesContainer = ref<HTMLElement>()
const isThinking = ref(false)

const llmConfigured = computed(() => isLLMConfigured({
  apiKey: userStore.config.llmApiKey || '',
  baseUrl: userStore.config.llmBaseUrl || '',
  model: userStore.config.llmModel || ''
}))

watch(() => props.messages.length, async () => {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
})

// 监听 isThinking 变化也滚动
watch(isThinking, async () => {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
})

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isThinking.value) return

  emit('send', text)
  inputText.value = ''
}

// 暴露 isThinking 给父组件控制
defineExpose({
  setThinking: (val: boolean) => { isThinking.value = val }
})
</script>

<style scoped>
.ai-chat { display: flex; flex-direction: column; height: 100%; background: var(--color-bg-card); border-radius: var(--radius-lg); overflow: hidden; }
.chat-header { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-md) var(--spacing-lg); border-bottom: 1px solid var(--color-border-light); }
.chat-title { font-size: var(--font-size-base); font-weight: 600; }
.chat-badge { font-size: var(--font-size-xs); padding: 2px 8px; border-radius: var(--radius-full); }
.badge-sim { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-real { background: var(--color-success-bg); color: var(--color-success); }
.chat-messages { flex: 1; padding: var(--spacing-lg); overflow-y: auto; display: flex; flex-direction: column; gap: var(--spacing-md); }
.chat-placeholder { text-align: center; color: var(--color-text-light); padding: var(--spacing-2xl); }
.chat-hint { margin-top: var(--spacing-sm); font-size: var(--font-size-sm); }
.chat-hint code { background: var(--color-primary-bg); padding: 1px 6px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
.chat-configure-hint { margin-top: var(--spacing-md); font-size: var(--font-size-sm); }
.configure-link { color: var(--color-primary); text-decoration: none; }
.configure-link:hover { text-decoration: underline; }
.chat-message { display: flex; gap: var(--spacing-sm); }
.chat-message.user { flex-direction: row-reverse; }
.message-avatar { width: 28px; height: 28px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; flex-shrink: 0; }
.chat-message.user .message-avatar { background: var(--color-primary); color: white; }
.chat-message.agent .message-avatar { background: var(--color-accent); color: white; }
.message-content { max-width: 80%; padding: 10px 14px; border-radius: var(--radius-md); font-size: var(--font-size-sm); line-height: 1.6; white-space: pre-wrap; }
.chat-message.user .message-content { background: var(--color-primary); color: white; border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg); }
.chat-message.agent .message-content { background: var(--color-bg); color: var(--color-text); border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg); }
.message-content.thinking { display: flex; gap: 4px; align-items: center; padding: 14px; }
.thinking-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-text-light); animation: thinking 1.4s infinite ease-in-out; }
.thinking-dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes thinking { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
.chat-input-area { display: flex; gap: var(--spacing-sm); padding: var(--spacing-md) var(--spacing-lg); border-top: 1px solid var(--color-border-light); }
.chat-input { flex: 1; padding: 8px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--font-size-sm); background: var(--color-bg); transition: border-color var(--transition-fast); }
.chat-input:focus { border-color: var(--color-primary); }
.chat-input:disabled { background: var(--color-border-light); cursor: not-allowed; }
</style>
