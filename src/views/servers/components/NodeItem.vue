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
        <!-- 其他标签 -->
        <template v-if="node.tags && node.tags.length > 0">
          <span v-for="(tag, index) in node.tags" :key="index" class="node-tag">
            {{ tag }}
          </span>
        </template>
      </div>

      <!-- 节点名称 -->
      <div class="node-title-row">
        <h3 class="node-name">{{ node.name }}</h3>
        <!-- Codex改动：倍率移动到节点名称右侧，并补充“倍率”文案。 -->
        <span class="node-rate" v-if="showNodeRate">倍率 x{{ node.rate }}</span>
      </div>

      <!-- 节点主机信息 -->
      <p class="node-host" v-if="showNodeDetails">{{ node.host }}:{{ node.port }}</p>

      <!-- Codex改动：展示后端从 storage/app/unlock-results/all.json 注入的节点解锁检测结果。 -->
      <div class="unlock-status" v-if="unlockServices.length > 0">
        <span
          v-for="service in unlockServices"
          :key="service.key"
          class="unlock-badge"
          :class="service.className"
          :title="service.title"
        >
          <span class="unlock-name">{{ service.label }}</span>
        </span>
      </div>

      <!-- Codex改动：显示检测时间，便于用户判断解锁结果是否新鲜。 -->
      <p class="unlock-time" v-if="unlockCheckedAt">
        解锁检测：{{ unlockCheckedAt }}
      </p>
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
import { computed } from 'vue';
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

// Codex改动：按用户最关心的媒体/AI服务提取可解锁状态，只展示 status=yes。
const UNLOCK_SERVICE_MAP = [
  { group: 'media', key: 'netflix', label: 'Netflix' },
  { group: 'media', key: 'disney_plus', label: 'Disney+' },
  { group: 'media', key: 'dazn', label: 'DAZN' },
  { group: 'media', key: 'amazon_prime_video', label: 'PrimeVideo' },
  { group: 'media', key: 'youtube_premium', label: 'YouTube会员' },
  { group: 'media', key: 'tiktok', label: 'TikTok' },
  { group: 'media', key: 'spotify_registration', label: 'spotify注册' },
  // Codex改动：兼容新版检测 JSON 的 AI 字段名，避免 microsoft_copilot/openai_chatgpt/anthropic_claude 漏显示。
  { group: 'ai', key: 'microsoft_copilot', aliases: ['bing_region', 'copilot'], label: 'Copilot' },
  { group: 'ai', key: 'openai_chatgpt', aliases: ['chatgpt', 'openai'], label: 'ChatGPT' },
  { group: 'ai', key: 'google_gemini', label: 'Gemini' },
  { group: 'ai', key: 'anthropic_claude', aliases: ['claude', 'anthropic'], label: 'Claude' },
  // Codex改动：按 all.json 额外展示用户选定的 AI 解锁项目。
  { group: 'ai', key: 'mistral_ai', label: 'Mistral' },
  { group: 'ai', key: 'quora_poe', label: 'Quora' },
  { group: 'ai', key: 'perplexity_ai', label: 'Perplexity' },
  { group: 'ai', key: 'x_ai_grok', label: 'Grok' }
];

const unlockServices = computed(() => {
  const unlockResult = props.node && props.node.unlock_result;
  if (!unlockResult) {
    return [];
  }

  return UNLOCK_SERVICE_MAP
    .map(service => {
      const group = unlockResult[service.group];
      const keys = [service.key, ...(service.aliases || [])];
      const item = group && keys.map(key => group[key]).find(Boolean);
      const status = String((item && item.status) || '').toLowerCase();
      // Codex改动：Copilot 旧字段 bing_region 可能是 unknown，新字段 microsoft_copilot 通常是 yes，都作为有结果展示。
      if (!item || (status !== 'yes' && !(service.label === 'Copilot' && status === 'unknown'))) {
        return null;
      }

      return {
        ...service,
        className: 'unlock-available',
        title: `${service.label}: ${item.raw || item.status || '未知'}`
      };
    })
    .filter(Boolean);
});

const unlockCheckedAt = computed(() => {
  const checkedAt = props.node && props.node.unlock_result && props.node.unlock_result.node && props.node.unlock_result.node.checked_at;
  if (!checkedAt) {
    return '';
  }

  const timestamp = Number(checkedAt);
  if (!Number.isFinite(timestamp)) {
    return '';
  }

  return new Date(timestamp * 1000).toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
});

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

    .node-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin: 0 0 0.35rem;
    }
    
    .node-name {
      flex: 1;
      min-width: 0;
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-color);
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .node-rate {
      flex: 0 0 auto;
      max-width: 42%;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.2;
      white-space: nowrap;
    }
    
    .node-host {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0;
    }

    .unlock-status {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.625rem;

      .unlock-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        max-width: 100%;
        min-height: 22px;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
        font-size: 0.7rem;
        line-height: 1.2;
        border: 1px solid transparent;
        white-space: nowrap;

        &.unlock-available {
          background-color: rgba(76, 175, 80, 0.1);
          border-color: rgba(76, 175, 80, 0.25);
          color: #2e7d32;
        }

        .unlock-name {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .unlock-time {
      margin: 0.45rem 0 0;
      font-size: 0.72rem;
      color: var(--text-muted);
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
      
      .node-title-row {
        margin: 0 0 0.25rem;
      }

      .node-name {
        font-size: 0.875rem;
      }

      .node-rate {
        max-width: 45%;
        font-size: 0.625rem;
        padding: 0.125rem 0.375rem;
      }
      
      .node-host {
        font-size: 0.75rem;
      }

      .unlock-status {
        gap: 0.25rem;
        margin-top: 0.5rem;

        .unlock-badge {
          min-height: 20px;
          font-size: 0.625rem;
          padding: 0.125rem 0.35rem;
        }
      }

      .unlock-time {
        font-size: 0.65rem;
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
