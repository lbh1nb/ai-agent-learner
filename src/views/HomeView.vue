<template>
  <div class="home-view page-container fade-in">
    <h1 class="page-title">欢迎回来，{{ userStore.config.nickname }}</h1>

    <div class="stats-grid">
      <StatCard :value="stats.todayMinutes + ' 分钟'" label="今日学习时长" icon-bg="#EDF4EE">
        <template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A7C59" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></template>
      </StatCard>
      <StatCard :value="stats.todayTasksCompleted" label="今日完成任务" icon-bg="#EDF7ED">
        <template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8C5A" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></template>
      </StatCard>
      <StatCard :value="stats.totalMinutes + ' 分钟'" label="累计学习时长" icon-bg="#EDF3F8">
        <template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8CB8" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></template>
      </StatCard>
      <StatCard :value="stats.streakDays + ' 天'" label="连续学习" icon-bg="#FDF8ED">
        <template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="2"><path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z"/></svg></template>
      </StatCard>
    </div>

    <div class="home-grid">
      <div class="continue-section card" v-if="stats.lastChapter">
        <h3 class="section-title">继续学习</h3>
        <div class="continue-info">
          <div class="continue-course">{{ stats.lastChapter.courseTitle }}</div>
          <div class="continue-chapter">{{ stats.lastChapter.title }}</div>
          <router-link :to="`/learn/${stats.lastChapter.courseId}/${stats.lastChapter.chapterId}`" class="btn btn-primary">继续学习</router-link>
        </div>
      </div>

      <div class="quick-actions card">
        <h3 class="section-title">快速开始</h3>
        <div class="action-grid">
          <router-link to="/learn" class="action-item">
            <div class="action-icon" style="background: #EDF4EE"><svg width="20" height="20" viewBox="0 0 20 20" fill="#4A7C59"><path d="M4 4h4v4H4V4zm8 0h4v4h-4V4zM4 12h4v4H4v-4zm8 0h4v4h-4v-4z"/></svg></div>
            <span>浏览课程</span>
          </router-link>
          <router-link to="/practice" class="action-item">
            <div class="action-icon" style="background: #FDF8ED"><svg width="20" height="20" viewBox="0 0 20 20" fill="#D4A853"><path d="M13 2l5 7-5 7H3l5-7-5-7h10z"/></svg></div>
            <span>开始实操</span>
          </router-link>
          <router-link to="/progress" class="action-item">
            <div class="action-icon" style="background: #EDF7ED"><svg width="20" height="20" viewBox="0 0 20 20" fill="#5B8C5A"><path d="M2 18h16V2H2v16zm2-5h4v3H4v-3zm6 0h4v3h-4v-3zM4 7h12v4H4V7z"/></svg></div>
            <span>查看进度</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useProgressStore } from '@/stores/progress'
import { storeToRefs } from 'pinia'
import StatCard from '@/components/common/StatCard.vue'

const userStore = useUserStore()
const progressStore = useProgressStore()
const { dashboardStats: stats } = storeToRefs(progressStore)

onMounted(async () => {
  await userStore.loadConfig()
  await progressStore.loadDashboard()
})
</script>

<style scoped>
.home-view { padding: var(--spacing-2xl); }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-2xl); }
.home-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); }
.section-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-lg); }
.continue-info { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.continue-course { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.continue-chapter { font-size: var(--font-size-base); font-weight: 500; margin-bottom: var(--spacing-md); }
.action-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); }
.action-item { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-xl) var(--spacing-md); border-radius: var(--radius-lg); text-decoration: none; color: var(--color-text); transition: all var(--transition-fast); background: var(--color-bg); }
.action-item:hover { background: var(--color-bg-hover); transform: translateY(-2px); }
.action-icon { width: 44px; height: 44px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; }
.action-item span { font-size: var(--font-size-sm); font-weight: 500; }
</style>