<template>
  <div class="chapter-view fade-in" v-if="chapter">
    <div class="chapter-sidebar">
      <router-link :to="`/learn/${courseId}`" class="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3L5.5 8l5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>返回课程
      </router-link>
      <ChapterTree :chapters="allChapters" :course-id="courseId" :active-chapter-id="chapter.id" :completed-ids="completedIds" />
    </div>
    <div class="chapter-content">
      <div v-if="videoEmbedUrl" class="video-container">
        <iframe :src="videoEmbedUrl" frameborder="0" allowfullscreen class="video-iframe"></iframe>
      </div>
      <div v-else-if="chapter.video_url" class="video-link-container">
        <a :href="chapter.video_url" target="_blank" class="video-link">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7l6 3-6 3V7z"/></svg>
          在 Bilibili 观看教学视频
        </a>
      </div>
      <ContentViewer :content="chapter.content" />
      <div class="chapter-footer">
        <button v-if="!isCompleted" class="btn btn-primary btn-lg" @click="markComplete">标记为已完成</button>
        <span v-else class="completed-label">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#5B8C5A"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm4.5 5.5l-6 6-3-3" stroke="#5B8C5A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>已完成
        </span>
        <div class="chapter-nav">
          <button v-if="prevChapter" class="btn btn-outline" @click="$router.push(`/learn/${courseId}/${prevChapter.id}`)">上一章</button>
          <button v-if="nextChapter" class="btn btn-primary" @click="$router.push(`/learn/${courseId}/${nextChapter.id}`)">下一章</button>
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-else text="加载中..." />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import type { Chapter } from '@/types'
import ChapterTree from '@/components/learn/ChapterTree.vue'
import ContentViewer from '@/components/learn/ContentViewer.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const store = useCoursesStore()
const chapter = ref<Chapter | null>(null)
const completedIds = ref(new Set<number>())
const isCompleted = ref(false)
const startTime = ref(0)
const elapsedSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const courseId = computed(() => Number(route.params.courseId))
const chapterId = computed(() => Number(route.params.chapterId))
const allChapters = computed(() => store.getChaptersByCourseId(courseId.value))
const prevChapter = computed(() => { const idx = allChapters.value.findIndex(c => c.id === chapterId.value); return idx > 0 ? allChapters.value[idx - 1] : null })
const nextChapter = computed(() => { const idx = allChapters.value.findIndex(c => c.id === chapterId.value); return idx < allChapters.value.length - 1 ? allChapters.value[idx + 1] : null })
const videoEmbedUrl = computed(() => {
  const url = (chapter.value as any)?.video_url as string | undefined
  if (!url) return null
  const match = url.match(/\/video\/(BV[a-zA-Z0-9]+)/)
  if (match) {
    const bvid = match[1]
    const p = url.match(/[?&]p=(\d+)/)?.[1] || '1'
    return `https://player.bilibili.com/player.html?bvid=${bvid}&page=${p}&high_quality=1`
  }
  return null
})

function startTimer() {
  startTime.value = Date.now()
  elapsedSeconds.value = 0
  stopTimer()
  timerInterval = setInterval(flushTime, 30000) // 每 30 秒刷新一次
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

async function flushTime() {
  const now = Date.now()
  const delta = Math.floor((now - startTime.value) / 1000)
  if (delta <= 0) return
  startTime.value = now
  elapsedSeconds.value += delta
  await window.electronAPI.dbExecute(
    `INSERT INTO learning_sessions (date, total_seconds) VALUES (date('now'), ?)
     ON CONFLICT(date) DO UPDATE SET total_seconds = total_seconds + ?`,
    [delta, delta]
  )
}

async function loadChapter(cid: number, chid: number) {
  await store.loadChapters(cid)
  const chapters = allChapters.value
  const found = chapters.find(c => c.id === chid)
  if (found) {
    chapter.value = found
  } else {
    chapter.value = null
  }
  const records = await window.electronAPI.dbQuery(
    `SELECT DISTINCT chapter_id, status FROM learning_records WHERE chapter_id IN (${chapters.map(c => c.id).join(',') || '0'}) AND status = 'completed'`
  )
  completedIds.value = new Set<number>()
  for (const r of records) { if (r.status === 'completed') completedIds.value.add(r.chapter_id) }
  isCompleted.value = completedIds.value.has(chid)

  // 防止重复创建记录：先检查是否存在，不存在才插入
  const existing = await window.electronAPI.dbQuery(
    'SELECT id FROM learning_records WHERE chapter_id = ? AND task_id IS NULL',
    [chid]
  )
  if (existing.length === 0) {
    await window.electronAPI.dbExecute(
      'INSERT INTO learning_records (chapter_id, status) VALUES (?, ?)',
      [chid, 'in_progress']
    )
  }

  // 启动计时器
  startTimer()
}

onMounted(() => loadChapter(courseId.value, chapterId.value))
watch(() => route.params.chapterId, (newId) => {
  if (newId) loadChapter(courseId.value, Number(newId))
})

onBeforeUnmount(() => {
  flushTime()
  stopTimer()
})

async function markComplete() {
  // 先刷新最后一次时间
  const now = Date.now()
  const delta = Math.floor((now - startTime.value) / 1000)
  if (delta > 0) {
    startTime.value = now
    elapsedSeconds.value += delta
    await window.electronAPI.dbExecute(
      `INSERT INTO learning_sessions (date, total_seconds) VALUES (date('now'), ?)
       ON CONFLICT(date) DO UPDATE SET total_seconds = total_seconds + ?`,
      [delta, delta]
    )
  }

  await window.electronAPI.dbExecute(
    "UPDATE learning_records SET status = 'completed', completed_at = datetime('now'), duration_seconds = ? WHERE chapter_id = ? AND task_id IS NULL AND status = 'in_progress'",
    [elapsedSeconds.value, chapterId.value]
  )
  isCompleted.value = true
  completedIds.value.add(chapterId.value)
  stopTimer()
}
</script>

<style scoped>
.chapter-view { display: flex; min-height: calc(100vh - var(--header-height)); }
.chapter-sidebar { width: 280px; background: var(--color-bg-card); border-right: 1px solid var(--color-border-light); padding-top: var(--spacing-lg); }
.back-link { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-md) var(--spacing-lg); color: var(--color-text-secondary); font-size: var(--font-size-sm); text-decoration: none; }
.back-link:hover { color: var(--color-primary); }
.chapter-content { flex: 1; overflow-y: auto; }
.chapter-footer { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-xl) var(--spacing-2xl); border-top: 1px solid var(--color-border-light); background: var(--color-bg-card); }
.completed-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-lg); font-weight: 600; color: var(--color-success); }
.chapter-nav { display: flex; gap: var(--spacing-md); }
.video-container { position: relative; width: 100%; padding-bottom: 56.25%; background: #000; }
.video-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
.video-link-container { padding: var(--spacing-xl) var(--spacing-2xl); background: var(--color-bg-card); border-bottom: 1px solid var(--color-border-light); }
.video-link { display: flex; align-items: center; gap: var(--spacing-md); color: var(--color-primary); font-size: var(--font-size-md); font-weight: 600; text-decoration: none; }
.video-link:hover { color: var(--color-primary-hover); text-decoration: underline; }
</style>