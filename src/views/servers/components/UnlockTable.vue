<template>
  <div class="unlock-table-card" ref="cardRef">
    <div class="unlock-table-header">
      <div>
        <h3>节点解锁矩阵</h3>
      </div>
      <span class="unlock-count">{{ displayNodeCount }}/{{ nodes.length }}</span>
    </div>

    <div class="unlock-filter-bar">
      <div class="filter-mode">
        <button
          type="button"
          class="filter-mode-btn"
          :class="{ active: filterMode === 'single' }"
          @click="setFilterMode('single')"
        >
          单选
        </button>
        <button
          type="button"
          class="filter-mode-btn"
          :class="{ active: filterMode === 'multiple' }"
          @click="setFilterMode('multiple')"
        >
          多选
        </button>
      </div>

      <div class="filter-services">
        <button
          v-for="service in services"
          :key="`filter-${service.key}`"
          type="button"
          class="filter-chip"
          :class="{ active: isServiceSelected(service) }"
          @click="toggleServiceFilter(service)"
        >
          {{ service.label }}
        </button>
        <button
          v-if="selectedServiceKeys.length > 0"
          type="button"
          class="filter-chip clear-filter"
          @click="clearServiceFilters"
        >
          全部
        </button>
      </div>
    </div>

    <div class="unlock-table-scroll">
      <!-- Codex改动：普通标题行负责占位和正常显示；冻结标题行通过 Teleport 挂到 body。 -->
      <div ref="headRef" class="unlock-sticky-head" role="row">
        <div class="sticky-cell node-heading">节点</div>
        <div class="sticky-cell">流媒体 / AI</div>
      </div>

      <div class="unlock-grid" role="table">
        <div v-for="node in filteredNodes" :key="node.id" class="unlock-row" role="row">
          <div class="node-column" role="cell">
            <div class="node-name">{{ node.name }}</div>
          </div>
          <div class="service-column combined-column" role="cell">
            <div class="service-section">
              <div class="service-section-title">流媒体</div>
              <div class="service-strip media-strip">
                <span
                  v-for="service in getUnlockedServices(node, mediaServices)"
                  :key="service.key"
                  class="unlock-mark"
                  :title="getTitle(node, service)"
                >
                  <span class="service-label">{{ service.label }}</span>
                  <span v-if="getUnlockText(node, service)" class="service-result">{{ getUnlockText(node, service) }}</span>
                </span>
                <span v-if="getUnlockedServices(node, mediaServices).length === 0" class="no-unlock">暂无</span>
              </div>
            </div>
            <div class="service-section">
              <div class="service-section-title">AI</div>
              <div class="service-strip ai-strip">
                <span
                  v-for="service in getUnlockedServices(node, aiServices)"
                  :key="service.key"
                  class="unlock-mark"
                  :title="getTitle(node, service)"
                >
                  <span class="service-label">{{ service.label }}</span>
                  <span v-if="getUnlockText(node, service)" class="service-result">{{ getUnlockText(node, service) }}</span>
                </span>
                <span v-if="getUnlockedServices(node, aiServices).length === 0" class="no-unlock">暂无</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredNodes.length === 0" class="unlock-empty">
          没有匹配的节点
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-show="isHeaderFixed"
      class="unlock-sticky-head unlock-sticky-head-fixed"
      :style="fixedHeaderStyle"
      role="row"
    >
      <div class="sticky-cell node-heading">节点</div>
      <div class="sticky-cell">流媒体 / AI</div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  }
});

// Codex改动：解锁视图按“节点 / 流媒体+AI”两列展示，字段名与 all.json 对齐。
const mediaServices = [
  { group: 'media', key: 'netflix', label: 'Netflix' },
  { group: 'media', key: 'disney_plus', label: 'Disney+' },
  { group: 'media', key: 'dazn', label: 'DAZN' },
  { group: 'media', key: 'amazon_prime_video', label: 'PrimeVideo' },
  { group: 'media', key: 'youtube_premium', label: 'YouTube会员' },
  { group: 'media', key: 'tiktok', label: 'TikTok' },
  { group: 'media', key: 'spotify_registration', label: 'spotify注册' }
];

const aiServices = [
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

const services = [...mediaServices, ...aiServices];

const filterMode = ref('single');
const selectedServiceKeys = ref([]);

const getServiceResult = (node, service) => {
  const group = node && node.unlock_result && node.unlock_result[service.group];
  if (!group) {
    return null;
  }

  const keys = [service.key, ...(service.aliases || [])];
  for (const key of keys) {
    if (group[key]) {
      return group[key];
    }
  }

  return null;
};

const isUnlocked = (node, service) => {
  const result = getServiceResult(node, service);
  const status = String((result && result.status) || '').toLowerCase();
  // Codex改动：Copilot 旧字段 bing_region 可能是 unknown，新字段 microsoft_copilot 通常是 yes，都作为有结果展示。
  return status === 'yes' || (service.label === 'Copilot' && status === 'unknown');
};

const getTitle = (node, service) => {
  const result = getServiceResult(node, service);
  return result && result.raw ? `${service.label}: ${result.raw}` : service.label;
};

// Codex改动：解锁视图只显示国家/地区名称，不再追加“解锁”文字。
const regionNameFormatter = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['zh-CN'], { type: 'region' })
  : null;

// Codex改动：处理检测脚本返回的非标准地区简称，无法可靠识别时不直接显示原代码。
const REGION_ALIAS_MAP = {
  ALISG: '新加坡',
  SG: '新加坡',
  Singapore: '新加坡',
  HK: '香港',
  HKG: '香港',
  'Hong Kong': '香港',
  TW: '台湾',
  TWN: '台湾',
  Taiwan: '台湾',
  CN: '中国',
  China: '中国',
  US: '美国',
  USA: '美国',
  JP: '日本',
  JPN: '日本',
  KR: '韩国',
  KOR: '韩国',
  GB: '英国',
  UK: '英国'
};

const getRegionToken = (result) => {
  const candidates = [
    result && result.country_code,
    result && result.region_raw,
    result && result.region,
    result && result.raw
  ].filter(Boolean).map(value => String(value).trim());

  for (const value of candidates) {
    const regionMatch = value.match(/Region:\s*([A-Za-z0-9_-]+)/i);
    const token = regionMatch ? regionMatch[1] : value;
    if (token && token !== 'WW') {
      return token;
    }
  }

  return '';
};

const getRegionName = (result) => {
  const rawToken = getRegionToken(result);
  if (!rawToken) {
    return '';
  }

  if (REGION_ALIAS_MAP[rawToken]) {
    return REGION_ALIAS_MAP[rawToken];
  }

  const upperToken = rawToken.toUpperCase();
  if (REGION_ALIAS_MAP[upperToken]) {
    return REGION_ALIAS_MAP[upperToken];
  }

  if (/^[A-Z]{2}$/.test(upperToken) && regionNameFormatter) {
    try {
      return regionNameFormatter.of(upperToken) || '';
    } catch (error) {
      return '';
    }
  }

  return '';
};

const getUnlockText = (node, service) => {
  const result = getServiceResult(node, service);
  return getRegionName(result);
};

const getUnlockedServices = (node, serviceList) => {
  return serviceList.filter(service => isUnlocked(node, service));
};

const unlockedNodeCount = computed(() => {
  return props.nodes.filter(node => services.some(service => isUnlocked(node, service))).length;
});

const selectedServices = computed(() => {
  return services.filter(service => selectedServiceKeys.value.includes(service.key));
});

const filteredNodes = computed(() => {
  if (selectedServices.value.length === 0) {
    return props.nodes;
  }

  // Codex改动：多选筛选用于寻找同时满足多个解锁项目的节点；单选时自然只匹配一个项目。
  return props.nodes.filter(node => selectedServices.value.every(service => isUnlocked(node, service)));
});

const displayNodeCount = computed(() => {
  return selectedServiceKeys.value.length > 0 ? filteredNodes.value.length : unlockedNodeCount.value;
});

const isServiceSelected = (service) => {
  return selectedServiceKeys.value.includes(service.key);
};

const setFilterMode = (mode) => {
  filterMode.value = mode;
  if (mode === 'single' && selectedServiceKeys.value.length > 1) {
    selectedServiceKeys.value = selectedServiceKeys.value.slice(0, 1);
  }
};

const toggleServiceFilter = (service) => {
  if (filterMode.value === 'single') {
    selectedServiceKeys.value = isServiceSelected(service) ? [] : [service.key];
    return;
  }

  selectedServiceKeys.value = isServiceSelected(service)
    ? selectedServiceKeys.value.filter(key => key !== service.key)
    : [...selectedServiceKeys.value, service.key];
};

const clearServiceFilters = () => {
  selectedServiceKeys.value = [];
};

const cardRef = ref(null);
const headRef = ref(null);
const isHeaderFixed = ref(false);
const headerHeight = ref(48);
const fixedHeaderStyle = ref({});

// Codex改动：滚动时按表格卡片位置冻结标题行，不依赖 CSS sticky。
const updateHeaderPosition = () => {
  if (!cardRef.value || !headRef.value) return;

  const cardRect = cardRef.value.getBoundingClientRect();
  const headRect = headRef.value.getBoundingClientRect();
  const measuredHeight = headRef.value.offsetHeight || 48;
  headerHeight.value = measuredHeight;

  const freezeTop = window.innerWidth >= 768 ? 90 : 76;
  const shouldFix = headRect.top <= freezeTop && cardRect.bottom > freezeTop + measuredHeight;
  isHeaderFixed.value = shouldFix;

  if (shouldFix) {
    const isDarkTheme = document.body.classList.contains('dark-theme');

    fixedHeaderStyle.value = {
      // Codex改动：冻结标题头的关键定位全部写入内联样式，避免 scoped/global CSS 在 Teleport 场景下失效。
      position: 'fixed',
      top: `${freezeTop}px`,
      left: `${Math.max(cardRect.left, 0)}px`,
      width: `${cardRect.width}px`,
      right: 'auto',
      zIndex: 10000,
      display: 'grid',
      // Codex改动：冻结标题头 Teleport 到 body，不能继承表格卡片变量，按当前主题直接设置背景和文字。
      backgroundColor: isDarkTheme
        ? 'color-mix(in srgb, var(--card-background, #1e1e1e) 92%, var(--theme-color))'
        : 'color-mix(in srgb, var(--card-bg, #fff) 96%, var(--theme-color))',
      color: isDarkTheme ? 'rgba(255, 255, 255, 0.86)' : 'var(--text-muted)',
      pointerEvents: 'none',
      gridTemplateColumns: window.innerWidth <= 768
        ? '104px minmax(0, 1fr)'
        : '170px minmax(0, 1fr)'
    };
  } else {
    fixedHeaderStyle.value = {};
  }
};

onMounted(() => {
  nextTick(updateHeaderPosition);
  document.addEventListener('scroll', updateHeaderPosition, { passive: true, capture: true });
  window.addEventListener('scroll', updateHeaderPosition, { passive: true });
  window.addEventListener('resize', updateHeaderPosition);
});

onBeforeUnmount(() => {
  document.removeEventListener('scroll', updateHeaderPosition, { capture: true });
  window.removeEventListener('scroll', updateHeaderPosition);
  window.removeEventListener('resize', updateHeaderPosition);
});
</script>

<style lang="scss" scoped>
.unlock-table-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  // Codex改动：解锁矩阵内容左右留出 8px，避免表格贴到卡片边缘。
  padding: 0 8px 8px;
  --unlock-table-head-bg: color-mix(in srgb, var(--card-bg, #fff) 96%, var(--theme-color));
  --unlock-table-head-color: var(--text-muted);
  --unlock-filter-bg: color-mix(in srgb, var(--card-bg, #fff) 97%, var(--theme-color));
  --unlock-filter-chip-bg: color-mix(in srgb, var(--card-bg, #fff) 98%, var(--theme-color));
  // Codex改动：允许表头跟随页面滚动吸顶，不裁切 sticky 表头
  overflow: visible;
}

.unlock-table-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.125rem;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--theme-color-rgb), 0.04);

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 650;
    color: var(--text-color);
  }

  .unlock-count {
    flex: 0 0 auto;
    padding: 0.25rem 0.55rem;
    border-radius: 6px;
    background-color: var(--theme-color);
    color: #fff;
    font-size: 0.78rem;
    font-weight: 700;
  }
}

.unlock-filter-bar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.72rem 1.125rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--unlock-filter-bg);
}

.filter-mode {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 7px;
  background-color: rgba(var(--theme-color-rgb), 0.08);
  border: 1px solid rgba(var(--theme-color-rgb), 0.12);
}

.filter-mode-btn,
.filter-chip {
  border: 0;
  cursor: pointer;
  color: var(--text-muted);
  background: transparent;
  font-family: inherit;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.filter-mode-btn {
  min-width: 46px;
  min-height: 28px;
  padding: 0 0.5rem;
  border-radius: 5px;
  font-size: 0.72rem;
  font-weight: 700;

  &.active {
    color: #fff;
    background-color: var(--theme-color);
  }
}

.filter-services {
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.42rem;
  overflow: visible;
  padding: 1px 0;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.filter-chip {
  flex: 0 0 auto;
  min-height: 28px;
  padding: 0.18rem 0.52rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--unlock-filter-chip-bg);
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;

  &.active {
    color: #fff;
    border-color: var(--theme-color);
    background-color: var(--theme-color);
  }

  &.clear-filter {
    color: var(--theme-color);
    border-color: rgba(var(--theme-color-rgb), 0.28);
    background-color: rgba(var(--theme-color-rgb), 0.08);
  }
}

.unlock-table-scroll {
  // Codex改动：表格不再使用内部滚动窗口，完整高度交给页面滚动
  overflow: visible;
}

.unlock-sticky-head {
  // Codex改动：普通标题行；冻结态使用 Teleport 到 body 的 fixed 标题行。
  position: relative;
  z-index: 20;
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  background-color: var(--unlock-table-head-bg, var(--card-bg, #fff));
  color: var(--unlock-table-head-color, var(--text-muted));
}

:global(.unlock-sticky-head-fixed) {
  // Codex改动：保留背景兜底，定位以 JS 内联样式为准。
  background-color: var(--unlock-table-head-bg, var(--card-bg, #fff));
  color: var(--unlock-table-head-color, var(--text-muted));
}

.sticky-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.72rem 0.35rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--unlock-table-head-color, var(--text-muted));
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;

  &.node-heading {
    // Codex改动：标题栏“节点”文字居中，和其他解锁项目列保持一致。
    justify-content: center;
    box-shadow: 1px 0 0 var(--border-color);
  }
}

.unlock-grid {
  width: 100%;
  min-width: 0;
}

.unlock-row {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  min-width: 0;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.045);
  }

  &:last-child {
    border-bottom: 0;
  }

  &:hover .node-column {
    background-color: color-mix(in srgb, var(--card-bg) 94%, var(--theme-color));
  }
}

.node-column,
.service-column {
  min-width: 0;
  min-height: 56px;
  padding: 0.72rem 0.48rem;
  display: flex;
  align-items: center;
}

.node-column {
  position: sticky;
  left: 0;
  z-index: 3;
  background-color: var(--card-bg);
  text-align: left;
  box-shadow: 1px 0 0 var(--border-color);
}

.service-column {
  overflow: hidden;
}

.combined-column {
  flex-direction: column;
  align-items: stretch;
  gap: 0.54rem;
}

.service-section {
  min-width: 0;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;

  & + .service-section {
    // Codex改动：流媒体和 AI 上下分栏之间加横线，增强层次。
    position: relative;
    padding-top: 0.62rem;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0.7rem;
      right: 0.7rem;
      height: 1px;
      background-color: var(--border-color);
    }
  }
}

.service-section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 0.25rem;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  text-align: center;
}

.service-strip {
  min-width: 0;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.42rem;
  // Codex改动：流媒体和 AI 都在右侧分区内部横向滚动，避免手机端把页面整体撑宽。
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.ai-strip {
  flex-wrap: nowrap;
}

.no-unlock {
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.node-name {
  font-size: 0.82rem;
  font-weight: 650;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unlock-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  max-width: 180px;
  min-height: 24px;
  padding: 0.18rem 0.38rem;
  border-radius: 5px;
  background-color: rgba(76, 175, 80, 0.12);
  border: 1px solid rgba(76, 175, 80, 0.24);
  color: #2e7d32;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  gap: 0.22rem;
}

.service-label {
  color: #1f7a32;
}

.service-result {
  overflow: hidden;
  text-overflow: ellipsis;
}

.unlock-empty {
  padding: 1.4rem 1rem;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 650;
  text-align: center;
}

@media (max-width: 768px) {
  .unlock-table-card {
    padding-left: 6px;
    padding-right: 6px;
  }

  .unlock-table-header {
    flex-direction: column;
    align-items: stretch;

    .unlock-count {
      width: fit-content;
    }
  }

  .unlock-filter-bar {
    grid-template-columns: 1fr;
    gap: 0.56rem;
    padding: 0.62rem 0.6rem;
  }

  .filter-mode {
    width: fit-content;
  }

  .filter-services {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 1px 0.75rem 4px 0;
    scroll-padding-right: 0.75rem;
  }

  .filter-chip {
    min-height: 27px;
    padding: 0.16rem 0.44rem;
    font-size: 0.66rem;
  }

  .unlock-row {
    grid-template-columns: 104px minmax(0, 1fr);
  }

  .unlock-sticky-head {
    grid-template-columns: 104px minmax(0, 1fr);
  }

  .sticky-cell {
    min-height: 44px;
    padding: 0.58rem 0.25rem;
    font-size: 0.64rem;
  }

  .node-column,
  .service-column {
    min-height: 54px;
    padding: 0.58rem 0.28rem;
  }

  .node-name {
    font-size: 0.76rem;
  }

  .service-strip {
    gap: 0.3rem;
  }

  .combined-column {
    gap: 0.46rem;
  }

  .service-section {
    grid-template-columns: 50px minmax(0, 1fr);
    gap: 0.36rem;

    & + .service-section {
      padding-top: 0.52rem;

      &::before {
        left: 0.46rem;
        right: 0.46rem;
      }
    }
  }

  .service-section-title {
    font-size: 0.64rem;
    padding: 0 0.18rem;
  }

  .unlock-mark {
    max-width: 132px;
    min-height: 23px;
    padding: 0.15rem 0.3rem;
    font-size: 0.62rem;
  }

  .no-unlock {
    font-size: 0.66rem;
  }
}

:global(body.dark-theme .unlock-table-card) {
  // Codex改动：深色模式表头使用深色卡片背景和可读文字，避免浅色块配白字。
  --unlock-table-head-bg: color-mix(in srgb, var(--card-background, #1e1e1e) 92%, var(--theme-color));
  --unlock-table-head-color: rgba(255, 255, 255, 0.86);
  --unlock-filter-bg: color-mix(in srgb, var(--card-background, #1e1e1e) 94%, var(--theme-color));
  --unlock-filter-chip-bg: color-mix(in srgb, var(--card-background, #1e1e1e) 96%, var(--theme-color));
}
</style>
