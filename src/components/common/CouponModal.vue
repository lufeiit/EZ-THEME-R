<template>
  <div class="coupon-modal" v-if="isVisible" @click="closeModal">
    <div class="coupon-modal-content" @click.stop>
      <div class="coupon-modal-header">
        <h3>优惠券</h3>
        <button class="close-button" @click="closeModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="coupon-modal-body">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 优惠券列表 -->
        <div v-else-if="couponsWithPlanNames && couponsWithPlanNames.length > 0" class="coupon-list">
          <div
            v-for="(coupon, index) in couponsWithPlanNames"
            :key="coupon.code || index"
            class="coupon-item"
          >
            <div class="coupon-info">
              <div class="coupon-header">
                <div class="coupon-code-container">
                  <div class="coupon-code-label">优惠码</div>
                  <div class="coupon-code-wrapper">
                    <div class="coupon-code">{{ coupon.code }}</div>
                    <div class="coupon-code-overlay">
                      <svg class="scissors-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="6" cy="6" r="3"></circle>
                        <circle cx="6" cy="18" r="3"></circle>
                        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                        <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                        <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="coupon-discount-badge">
                  {{ formatDiscount(coupon.type, coupon.value) }}
                </div>
              </div>

              <div class="coupon-name">{{ coupon.name }}</div>

              <div class="coupon-details">
                <div class="coupon-validity">
                  <svg class="validity-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span v-if="getDaysUntilExpiry(coupon.ended_at) > 3">
                    有效期: {{ formatValidity(coupon.started_at, coupon.ended_at) }}
                  </span>
                  <span v-else-if="getDaysUntilExpiry(coupon.ended_at) < 0" class="expired">
                    <svg class="expired-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    优惠码已过期
                  </span>
                  <div v-else class="expiring-soon-container">
                    <div class="expiring-label">
                      <svg class="expiring-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 8v4l2 2"></path>
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                      即将过期:
                    </div>
                    <countdown 
                      :key="coupon.code"
                      :deadline="getCouponExpiryDate(coupon.ended_at)" 
                      :show-days="true" 
                      :show-hours="true" 
                      :show-minutes="true" 
                      :show-seconds="true"
                      :labels="{
                        days: '天',
                        hours: '时',
                        minutes: '分',
                        seconds: '秒'
                      }"
                      countdown-size="1.5rem"
                      label-size="0.6rem"
                      class="flip-countdown"
                    />
                  </div>
                </div>

                <!-- 适用套餐和周期信息 -->
                <div class="coupon-plan-list">
                  <div class="plan-list-header">适用套餐及付款周期</div>
                  <div
                    v-for="(planInfo, planIndex) in coupon.planDetails"
                    :key="planIndex"
                    class="plan-period-item"
                  >
                    <div class="plan-name">{{ planInfo.planName }}</div>
                    <div class="periods">
                      <span
                        v-for="(period, periodIndex) in planInfo.periods"
                        :key="periodIndex"
                        class="period-tag"
                        @click="goToOrder(planInfo.planId, period.value, coupon.code)"
                      >
                        {{ period.name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="copy-coupon-section">
              <button
                class="copy-coupon-btn"
                @click="copyCouponCode(coupon.code)"
              >
                <svg v-if="!copiedCouponCode[coupon.code]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {{ copiedCouponCode[coupon.code] ? '已复制' : '复制优惠码' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 无优惠券状态 -->
        <div v-else class="no-coupons">
          暂无可用优惠券
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { fetchPlans } from '@/api/shop';
import { fetchCoupons } from '@/api/coupon';
import { Countdown } from 'vue3-flip-countdown';

const isVisible = ref(false);
const coupons = ref([]);
const plans = ref([]);
const loading = ref(false);
const router = useRouter();
const { showToast } = useToast();
const copiedCouponCode = ref({});

// 计算属性：将优惠券与套餐名称和周期关联
const couponsWithPlanNames = computed(() => {
  if (!coupons.value || !plans.value) return [];

  return coupons.value.map(coupon => {
    // 根据limit_plan_ids和limit_period匹配套餐和周期
    if (coupon.limit_plan_ids && Array.isArray(coupon.limit_plan_ids) &&
        coupon.limit_period && Array.isArray(coupon.limit_period)) {
      const planDetails = coupon.limit_plan_ids.map(planId => {
        // 注意：API返回的planId是字符串，需要转换为数字进行比较
        const plan = plans.value.find(p => p.id === parseInt(planId));
        if (plan) {
          const periodNames = coupon.limit_period.map(period => {
            return {
              name: getPeriodName(period),
              value: period
            };
          });
          return {
            planId: plan.id,
            planName: plan.name,
            periods: periodNames
          };
        }
        return null;
      }).filter(item => item !== null);

      return {
        ...coupon,
        planDetails: planDetails
      };
    }

    // 如果没有特定的套餐关联，使用默认显示
    return {
      ...coupon,
      planDetails: [{
        planName: '所有套餐',
        periods: [{
          name: '所有周期',
          value: ''
        }]
      }]
    };
  });
});

const openModal = async () => {
  console.log('Opening coupon modal');
  isVisible.value = true;
  document.body.style.overflow = 'hidden';

  // 获取优惠券和套餐数据
  await Promise.all([fetchCouponData(), fetchPlanData()]);
};

const closeModal = () => {
  console.log('Closing coupon modal');
  isVisible.value = false;
  document.body.style.overflow = '';
};

const fetchCouponData = async () => {
  loading.value = true;
  try {
    const response = await fetchCoupons();
    if (response.data) {
      coupons.value = response.data;
    }
  } catch (error) {
    console.error('获取优惠券数据失败:', error);
    showToast('获取优惠券数据失败', 'error');
  } finally {
    loading.value = false;
  }
};

const fetchPlanData = async () => {
  try {
    const response = await fetchPlans();
    if (response.data) {
      plans.value = response.data;
    }
  } catch (error) {
    console.error('获取套餐数据失败:', error);
  }
};

const getPeriodName = (periodKey) => {
  const periodMap = {
    'month_price': '月付',
    'quarter_price': '季付',
    'half_year_price': '半年付',
    'year_price': '年付'
  };
  return periodMap[periodKey] || periodKey;
};

const formatDiscount = (type, value) => {
  if (type === 1) {
    // 固定金额折扣
    return `减免 ${value / 100} 元`;
  } else if (type === 2) {
    // 百分比折扣
    return `${value}% OFF`;
  }
  return '';
};

const formatValidity = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) return '永久有效';
  
  const startDate = new Date(startedAt * 1000);
  const endDate = new Date(endedAt * 1000);
  
  const startStr = startDate.toLocaleDateString('zh-CN');
  const endStr = endDate.toLocaleDateString('zh-CN');
  
  return `${startStr} 至 ${endStr}`;
};

const getDaysUntilExpiry = (endedAt) => {
  if (!endedAt) return Infinity;
  
  const endDate = new Date(endedAt * 1000);
  const today = new Date();
  
  // 计算剩余天数
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

const formatExpiryCountdown = (endedAt) => {
  if (!endedAt) return '';
  
  const endDate = new Date(endedAt * 1000);
  const today = new Date();
  
  // 计算剩余时间
  const diffTime = endDate - today;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天${diffHours}小时后过期`;
  } else if (diffHours > 0) {
    return `${diffHours}小时${diffMinutes}分钟后过期`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟后过期`;
  } else {
    return '已过期';
  }
};

const getCouponExpiryDate = (endedAt) => {
  if (!endedAt) return '';
  // 根据文档，deadline prop 需要 YYYY-MM-DD HH:mm:ss 格式
  const endDate = new Date(endedAt * 1000);
  return endDate.getFullYear() + '-' + 
         String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
         String(endDate.getDate()).padStart(2, '0') + ' ' + 
         String(endDate.getHours()).padStart(2, '0') + ':' + 
         String(endDate.getMinutes()).padStart(2, '0') + ':' + 
         String(endDate.getSeconds()).padStart(2, '0');
};

const copyCouponCode = (code) => {
  // 复制优惠码到剪贴板
  navigator.clipboard.writeText(code).then(() => {
    // 更新复制状态
    copiedCouponCode.value[code] = true;
    showToast(`优惠码 ${code} 已复制到剪贴板`, 'success');

    // 3秒后重置复制状态
    setTimeout(() => {
      copiedCouponCode.value[code] = false;
    }, 3000);
  }).catch(err => {
    console.error('复制失败', err);
    showToast('复制优惠码失败', 'error');
  });
};

const goToOrder = (planId, period, couponCode) => {
  // 跳转到订单确认页面
  router.push({
    path: '/order-confirm',
    query: {
      id: planId,
      period: period,
      coupon: couponCode
    }
  });

  // 关闭模态框
  closeModal();
};

const handleEscKey = (event) => {
  if (event.key === 'Escape' && isVisible.value) {
    closeModal();
  }
};

onMounted(() => {
  window.addEventListener('openCouponModal', openModal);
  document.addEventListener('keydown', handleEscKey);
});

onUnmounted(() => {
  window.removeEventListener('openCouponModal', openModal);
  document.removeEventListener('keydown', handleEscKey);
});
</script>

<style lang="scss" scoped>
.coupon-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999999;
  animation: fadeIn 0.3s ease;
}

.coupon-modal-content {
  background: var(--card-background);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 650px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
  position: relative;
  z-index: 1000000;
}

.coupon-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
  }
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--secondary-text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin: -8px;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--text-color);
    transform: rotate(90deg);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.coupon-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 200px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(var(--theme-color-rgb), 0.3);
  border-top: 3px solid var(--theme-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading p {
  color: var(--text-color);
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.coupon-item {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--card-background);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--theme-color), #a747fe);
  }

  &:hover {
    border-color: var(--theme-color);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.coupon-info {
  flex: 1;
}

.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 8px;
}

.coupon-code-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.coupon-code-label {
  font-size: 13px;
  color: var(--secondary-text-color);
  font-weight: 500;
}

.coupon-code-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.coupon-code {
  font-weight: 700;
  font-size: 20px;
  color: var(--theme-color);
  font-family: monospace;
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
  background: rgba(var(--theme-color-rgb), 0.05);
  padding: 6px 24px;
  border-radius: 8px;
  border: 1px dashed var(--theme-color);
  display: inline-block;
  min-width: 130px;
  text-align: center;
}

.coupon-code-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%);
  z-index: 2;
  animation: codeShine 4s infinite;
  pointer-events: none;
  border-radius: 8px;
  overflow: hidden;
}

.scissors-icon {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: var(--theme-color);
  z-index: 3;
  background: var(--card-background);
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 0 0 2px var(--card-background);
}

@keyframes codeShine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.coupon-discount-badge {
  background: linear-gradient(90deg, var(--theme-color), #a747fe);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  box-shadow: 0 4px 8px rgba(var(--theme-color-rgb), 0.2);
}

.coupon-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.coupon-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-validity {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--secondary-text-color);
  
  .validity-icon {
    color: var(--theme-color);
  }
}

.expiring-soon-container {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff5252;
  font-weight: 500;
}

.expiring-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.expiring-icon {
  color: #ff5252;
  flex-shrink: 0;
}

.expired {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9e9e9e;
  font-weight: 500;
}

.expired-icon {
  color: #9e9e9e;
  flex-shrink: 0;
}

.flip-countdown {
  display: flex;
  justify-content: center;
  margin-top: 5px;
}

.coupon-plan-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-color);
}

.plan-list-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.plan-period-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .plan-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-color);
  }

  .periods {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .period-tag {
      font-size: 13px;
      background-color: rgba(var(--theme-color-rgb), 0.1);
      color: var(--theme-color);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;

      &:hover {
        background-color: rgba(var(--theme-color-rgb), 0.2);
        transform: translateY(-2px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
    }
  }
}

.copy-coupon-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.copy-coupon-btn {
  background: linear-gradient(90deg, var(--theme-color), #a747fe);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.3);

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(var(--theme-color-rgb), 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.no-coupons {
  text-align: center;
  padding: 40px;
  color: var(--secondary-text-color);
  font-size: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .coupon-modal-content {
    width: 95%;
    margin: 20px;
    max-height: 90vh;
    border-radius: 12px;
  }

  .coupon-modal-header {
    padding: 20px;
  }

  .coupon-modal-body {
    padding: 20px;
  }

  .coupon-item {
    gap: 16px;
    padding: 20px;
  }

  .coupon-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .coupon-code {
    font-size: 20px;
    padding: 6px 24px;
    min-width: 130px;
  }

  .coupon-code-overlay {
    animation: codeShine 4s infinite;
  }

  .coupon-discount-badge {
    align-self: flex-start;
  }

  .coupon-name {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .coupon-validity {
    font-size: 13px;
  }
  
  .expiring-soon-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .flip-countdown {
    font-size: 11px;
  }
  
  .expired {
    font-size: 13px;
  }

  .plan-period-item {
    .plan-name {
      font-size: 14px;
    }

    .periods {
      .period-tag {
        font-size: 12px;
        padding: 5px 10px;
      }
    }
  }

  .copy-coupon-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
}
</style>
