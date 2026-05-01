<template>
  <div class="node-item">
    <!-- 节点状态指示器 -->
    <div class="node-status">
      <div class="status-indicator" :class="{ 'online': node.is_online === 1 }"></div>
    </div>

    <!-- 节点信息 -->
    <div class="node-info">
      <!-- 标签区域 -->
      <div class="node-tags">
        <!-- 倍率标签 -->
        <span class="node-tag rate-tag" v-if="showNodeRate">x{{ node.rate }}</span>

        <!-- 其他标签 -->
        <template v-if="node.tags && node.tags.length > 0">
          <span v-for="(tag, index) in node.tags" :key="index" class="node-tag">
            {{ tag }}
          </span>
        </template>
      </div>

      <!-- 节点名称 -->
      <h3 class="node-name">{{ node.name }}</h3>

      <!-- 节点主机信息 -->
      <p class="node-host" v-if="showNodeDetails">{{ node.host }}:{{ node.port }}</p>
    </div>

    <!-- 更多按钮 - 仅当配置允许显示节点倍率和允许查看节点详情时显示 -->
    <div v-if="showNodeRate && allowViewNodeInfo" class="node-actions">
      <button class="more-btn" @click="showDetail">
        <IconDotsVertical :size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { IconDotsVertical } from '@tabler/icons-vue';

// 定义组件属性
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  showNodeDetails: {
    type: Boolean,
    default: false
  },
  showNodeRate: {
    type: Boolean,
    default: false
  },
  allowViewNodeInfo: {
    type: Boolean,
    default: false
  }
});

// 定义事件发射
const emit = defineEmits(['showDetail']);

// 显示节点详情
const showDetail = () => {
  emit('showDetail', props.node);
};
</script>

<style lang="scss" scoped>
.node-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background-color: var(--card-bg);
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    border-color: rgba(var(--theme-color-rgb), 0.3);
  }
  
  .node-status {
    margin-right: 1rem;
    
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #ccc;
      position: relative;
      
      &.online {
        background-color: #4caf50;
        box-shadow: 0 0 0 rgba(76, 175, 80, 0.4);
        animation: pulse 2s infinite;
      }
    }
  }
  
  .node-info {
    flex: 1;
    overflow: hidden;
    
    .node-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      
      .node-tag {
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        background-color: rgba(var(--theme-color-rgb), 0.1);
        color: var(--theme-color);
        
        &.rate-tag {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4caf50;
          font-weight: 600;
        }
        
        &.type-tag {
          background-color: rgba(33, 150, 243, 0.1);
          color: #2196f3;
        }
      }
    }
    
    .node-name {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.35rem;
      color: var(--text-color);
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .node-host {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0;
    }
  }
  
  .node-actions {
    display: flex;
    align-items: center;
    margin-left: 12px;
    
    .more-btn {
      background: none;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(var(--theme-color-rgb), 0.1);
        color: var(--theme-color);
      }
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

// 移动端优化
@media (max-width: 768px) {
  .node-item {
    padding: 0.875rem 1rem;
    
    .node-status {
      margin-right: 0.75rem;
      
      .status-indicator {
        width: 10px;
        height: 10px;
      }
    }
    
    .node-info {
      .node-tags {
        gap: 0.375rem;
        margin-bottom: 0.375rem;
        
        .node-tag {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
        }
      }
      
      .node-name {
        font-size: 0.875rem;
        margin: 0 0 0.25rem;
      }
      
      .node-host {
        font-size: 0.75rem;
      }
    }
    
    .node-actions {
      margin-left: 8px;
      
      .more-btn {
        width: 28px;
        height: 28px;
      }
    }
  }
}
</style>