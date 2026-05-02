<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="show" class="shop-popup-overlay" @click.self="closePopup">
        <div class="shop-popup-container">
          <div class="shop-popup-header">
            <h2 class="popup-title">Apple ID</h2>
            <button class="popup-close-btn" @click="closePopup">
              <IconX :size="20" />
            </button>
          </div>
          <div class="shop-popup-content">
            <iframe
                :src="iframeSrc"
                class="popup-iframe"
                allow="clipboard-write"
                frameborder="0"
            ></iframe>
          </div>
          <div class="shop-popup-footer">
            <button
                class="popup-action-btn"
                @click="closePopup"
            >
              {{ $t('shop.popup.close_btn') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
import { ref, watch } from 'vue';
import { IconX } from '@tabler/icons-vue';

export default {
  name: 'IframePopup',
  components: {
    IconX
  },
  props: {
    showPopup: {
      type: Boolean,
      default: false
    },
    iframeSrc: {
      type: String,
      default: ''
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const show = ref(false);

    const closePopup = () => {
      show.value = false;
      emit('close');
    };

    watch(() => props.showPopup, (newVal) => {
      show.value = newVal;
    }, { immediate: true });

    return {
      show,
      closePopup
    };
  }
};
</script>

<style lang="scss" scoped>
.shop-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  backdrop-filter: blur(4px);

  .shop-popup-container {
    width: 100%;
    max-width: 800px;
    background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(var(--theme-color-rgb), 0.15);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    @media (prefers-color-scheme: dark) {
      background-color: rgba(var(--card-background-rgb, 30, 30, 30), 1);
    }

    .shop-popup-header {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      background-color: rgba(var(--theme-color-rgb), 0.03);

      .popup-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color);
      }

      .popup-close-btn {
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
      }
    }

    .shop-popup-content {
      padding: 0;
      overflow: hidden;
      flex: 1;
      background: linear-gradient(to bottom, rgba(var(--theme-color-rgb), 0.02), transparent);

      .popup-iframe {
        width: 100%;
        height: 100%;
        min-height: 400px;
        border: none;
      }
    }

    .shop-popup-footer {
      padding: 15px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;

      .popup-action-btn {
        padding: 8px 20px;
        background-color: var(--theme-color);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.3);
        }
      }
    }
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-enter-active {
  transition: opacity 0.3s ease;
}

.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .shop-popup-overlay {
    padding: 15px;

    .shop-popup-container {
      max-width: 100%;
      max-height: 85vh;

      .shop-popup-header {
        padding: 15px;

        .popup-title {
          font-size: 16px;
        }
      }

      .shop-popup-content {
        .popup-iframe {
          min-height: 300px;
        }
      }

      .shop-popup-footer {
        padding: 12px 15px;
      }
    }
  }
}
</style>
