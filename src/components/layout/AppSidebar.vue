<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-icon">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#4A7C59"/>
          <path d="M7 18L12 8L14 14L17 10L21 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="brand-text">AI Coding Learner</span>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"/></svg>
        <span>首页</span>
      </router-link>
      <router-link to="/learn" class="nav-item" :class="{ active: $route.path.startsWith('/learn') }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4h4v4H4V4zm8 0h4v4h-4V4zM4 12h4v4H4v-4zm8 0h4v4h-4v-4z"/></svg>
        <span>学习中心</span>
      </router-link>
      <router-link to="/practice" class="nav-item" :class="{ active: $route.path.startsWith('/practice') }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M13 2l5 7-5 7H3l5-7-5-7h10z"/></svg>
        <span>实操实验室</span>
      </router-link>
      <router-link to="/progress" class="nav-item" :class="{ active: $route.path === '/progress' }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 18h16V2H2v16zm2-5h4v3H4v-3zm6 0h4v3h-4v-3zM4 7h12v4H4V7z"/></svg>
        <span>学习进度</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 13a3 3 0 100-6 3 3 0 000 6zm8-2.5V9.5l-1.8-.3a6.5 6.5 0 00-.6-1.4l1.1-1.5-1.1-1.1-1.5 1.1a6.5 6.5 0 00-1.4-.6L12.5 4h-1.1l-.3 1.8a6.5 6.5 0 00-1.4.6L8 5.3 6.9 6.4 8 7.9a6.5 6.5 0 00-.6 1.4L5.5 9.5v1.1l1.8.3c.1.5.3 1 .6 1.4l-1.1 1.5 1.1 1.1 1.5-1.1c.5.3 1 .5 1.4.6l.3 1.8h1.1l.3-1.8c.5-.1 1-.3 1.4-.6l1.5 1.1 1.1-1.1-1.1-1.5c.3-.5.5-1 .6-1.4L18 10.5z"/></svg>
        <span>设置</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--color-bg-sidebar);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) var(--spacing-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-icon {
  flex-shrink: 0;
}

.brand-text {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-sidebar-active);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: var(--color-text-sidebar);
  text-decoration: none;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-sidebar-active);
}

.nav-item.active {
  background: var(--color-primary);
  color: var(--color-text-sidebar-active);
}
</style>