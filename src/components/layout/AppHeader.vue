<template>
  <header class="header">
    <div class="header-left">
      <h2 class="header-title">{{ title }}</h2>
    </div>
    <div class="header-right">
      <div class="user-info">
        <div class="avatar">{{ userStore.config.nickname.charAt(0) }}</div>
        <span class="nickname">{{ userStore.config.nickname }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const titleMap: Record<string, string> = {
  home: '首页',
  learn: '学习中心',
  'course-detail': '课程详情',
  chapter: '章节内容',
  practice: '实操实验室',
  task: '实操任务',
  progress: '学习进度',
  settings: '设置'
}

const title = computed(() => {
  const name = route.name as string
  return titleMap[name] || 'AI Coding Learner'
})
</script>

<style scoped>
.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-2xl);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.nickname {
  font-size: var(--font-size-base);
  color: var(--color-text);
  font-weight: 500;
}
</style>