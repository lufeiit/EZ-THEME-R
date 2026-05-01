<template>
  <div class="plan-selection-tip">
    <div class="tip-content">
      <div class="tip-text-wrapper">
        <IconInfoCircle :size="20" class="tip-icon" />
        <span class="tip-text">关于节点、订阅、续费、流量等等相关的说明，不清楚的点击这里</span>
      </div>
      <a
        href="#/docs/10"
        target="_blank"
        rel="noopener noreferrer"
        class="tip-link"
      >
        <IconExternalLink :size="16" class="link-icon" />
        看这里
      </a>
    </div>
  </div>
</template>

<script>
import { IconInfoCircle, IconExternalLink } from '@tabler/icons-vue';

export default {
  name: 'PlanSelectionTip',
  components: {
    IconInfoCircle,
    IconExternalLink
  }
};
</script>

<style lang="scss" scoped>
.plan-selection-tip {
  background-color: rgba(255, 152, 0, 0.08); /* info 警告色背景 */
  border: 1px solid rgba(255, 152, 0, 0.2); /* info 警告色边框 */
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 152, 0, 0.12);
    border-color: rgba(255, 152, 0, 0.3);
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);
  }

  .tip-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;

    .tip-text-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0; /* 防止flex项目溢出 */

      .tip-icon {
        color: #ff9800; /* info 警告色 */
        flex-shrink: 0;
      }

      .tip-text {
        color: var(--text-color);
        font-size: 14px;
        white-space: nowrap;
      }
    }

    .tip-link {
      color: #ff9800; /* info 警告色 */
      font-weight: 500;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      background-color: rgba(255, 152, 0, 0.1);
      transition: all 0.3s ease;
      white-space: nowrap;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;

      &:hover {
        background-color: rgba(255, 152, 0, 0.2);
        transform: translateY(-1px);
      }

      .link-icon {
        width: 16px;
        height: 16px;
      }
    }
  }
}
</style>
