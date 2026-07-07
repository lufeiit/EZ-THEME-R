<template>
  <div class="dashboard-card welcome-card">
    <div class="card-header">
      <h2 class="card-title">节点列表</h2>
      <div class="view-toggle-buttons">
        <button 
          class="view-toggle-btn" 
          :class="{ active: currentView === 'list' }"
          @click="switchView('list')"
        >
          <IconList :size="18" />
          <span class="btn-text">列表视图</span>
        </button>
        <button 
          class="view-toggle-btn" 
          :class="{ active: currentView === 'map' }"
          @click="switchView('map')"
        >
          <IconMap :size="18" />
          <span class="btn-text">地图视图</span>
        </button>
        <!-- Codex改动：新增节点解锁矩阵视图入口。 -->
        <button
          class="view-toggle-btn"
          :class="{ active: currentView === 'unlock' }"
          @click="switchView('unlock')"
        >
          <IconTable :size="18" />
          <span class="btn-text">解锁视图</span>
        </button>
      </div>
    </div>
    <div class="card-body">
      <p>查看并使用可用的服务器节点</p>
    </div>
  </div>
</template>

<script setup>
import { IconList, IconMap, IconTable } from '@tabler/icons-vue';

// 定义组件属性
const props = defineProps({
  currentView: {
    type: String,
    default: 'list'
  }
});

// 定义事件发射
const emit = defineEmits(['switchView']);

// 切换视图
const switchView = (view) => {
  emit('switchView', view);
};
</script>

<style lang="scss" scoped>
.dashboard-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    border-color: rgba(var(--theme-color-rgb), 0.3);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    
    .card-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
  }
  
  .card-body {
    p {
      color: var(--text-muted);
      margin: 0;
      line-height: 1.5;
    }
  }
}

.welcome-card {
  margin-bottom: 24px;
}

/* 视图切换按钮样式 */
.view-toggle-buttons {
  display: flex;
  gap: 0.5rem;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--card-bg);
  color: var(--text-color);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  .btn-text {
    @media (max-width: 768px) {
      display: none;
    }
  }

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.05);
    border-color: var(--theme-color);
  }

  &.active {
    background-color: var(--theme-color);
    color: white;
    border-color: var(--theme-color);
  }
}

@media (max-width: 768px) {
  .view-toggle-btn {
    padding: 0.5rem;
  }
}
</style>
