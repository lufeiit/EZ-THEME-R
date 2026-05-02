<script setup lang="js">
import { IconCopy, IconX } from "@tabler/icons-vue";
import {ref, watch} from "vue";
import { useRoute } from "vue-router";
import { getTelegramCode, checkTelegram } from "@/api/auth";
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useToast } from "@/composables/useToast";
import { useI18n } from "vue-i18n";

const props = defineProps({
  config: {
    telegram_bot_name: ''
  }
})

const route = useRoute();

const { showToast } = useToast();
const { t } = useI18n();

const showModal = ref(false);
const code = ref('');
const loading = ref(false);
const expires = ref(0);
let timer = null
let checkTimer = null

const startCountDown = () => {
  timer = setInterval(() => {
    expires.value--;
  }, 1000)
}

const check = () => {
  checkTimer = setInterval(async ()=> {
    try {
      const res = await checkTelegram({code: code.value});
      console.log(res);
      const { status, data } = res;
      if(status === 'success') {
        clearInterval(checkTimer);
        const { auth_data, is_admin, token } = data;
        localStorage.setItem('token', token)
        localStorage.setItem('is_admin', is_admin)
        localStorage.setItem('auth_data', auth_data)

        setTimeout(() => {
          localStorage.setItem('oauth_login_success', Date.now()) // 触发事件
          showModal.value = false;
          window.location.reload();
        }, 500)
      }
    } catch (error) {
      console.log(error)
    }
  }, 1000)

}

const getCode = async () => {
  clearInterval(timer)
  clearTimeout(checkTimer)
  loading.value = true;
  try {
    const res = await getTelegramCode(route.query.code || '');
    const { hash, expires_in } = res.data;
    code.value = hash;
    expires.value = expires_in;
    startCountDown()
    check();
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false;
  }
}

const copy = () => {
  navigator.clipboard.writeText(`/login ${ code.value }`)
      .then(() => {
        showToast(t('auth.copySuccess'), 'success', 3000);
      })
      .catch(() => {
        showToast(t('auth.copyFailed'), 'error', 3000);
      });
}

const openModal = () => {
  getCode()
  showModal.value = true;
}

const closeModal = () => {
  clearInterval(timer)
  clearTimeout(checkTimer)
  showModal.value = false;
}

watch(() => showModal.value, (newVal) => {
  if (!newVal) {
    clearInterval(timer)
    clearTimeout(checkTimer)
  }
}, { immediate: true, deep: true });

defineExpose({ openModal })
</script>

<template>
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ $t("auth.telegramLogin") }}</h3>

          <button class="close-btn" @click="closeModal">
            <IconX :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <div class="message-loading" v-if="loading">
            <LoadingSpinner />

            <p>{{ $t("common.loading") }}</p>
          </div>

          <ol v-else>
            <li>
              <div>
                1.{{ $t("auth.telegramStep1Text") }}
                <span class="expires"> {{ expires }}s </span>
                {{ $t("auth.telegramExpires") }}
                <br />
              </div>
              <div class="command">
                <div class="info">/login {{ code }}</div>
                <div class="icon">
                  <IconCopy :size="24" @click="copy" />
                </div>
              </div>
            </li>
            <li class="send">
              2.{{ $t("auth.telegramStep2Text") }}
              <a
                :href="`https://t.me/${props.config.telegram_bot_name}`"
                target="_blank"
              >
                @{{ props.config.telegram_bot_name }}
              </a>
            </li>
          </ol>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">
            {{ $t("common.cancel") }}
          </button>

          <button class="submit-btn" @click="closeModal">
            {{ $t("common.submit") }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;

  top: 0;

  left: 0;

  right: 0;

  bottom: 0;

  background-color: rgba(0, 0, 0, 0.6);

  backdrop-filter: blur(6px);

  display: flex;

  justify-content: center;

  align-items: center;

  z-index: 1000;

  animation: fadeIn 0.3s ease;

  padding: 0.5rem;
}

.modal-content {
  width: 96%;

  max-width: 500px;

  background-color: var(--card-background);

  border-radius: 16px;

  overflow: hidden;

  animation: slideIn 0.3s ease;

  border: 1px solid var(--border-color);

  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);

  &.closing {
    animation: slideOut 0.3s ease forwards;
  }
}

.modal-header {
  padding: 1.5rem;

  border-bottom: 1px solid var(--border-color);

  display: flex;

  justify-content: space-between;

  align-items: center;

  background-color: var(--bg-color);

  h3 {
    margin: 0;

    font-size: 1.25rem;

    font-weight: 600;

    color: var(--text-color);
  }

  .close-btn {
    background: none;

    border: none;

    color: var(--text-muted);

    cursor: pointer;

    padding: 0.5rem;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 50%;

    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.1);

      color: var(--theme-color);
    }
  }
}

.modal-body {
  padding: 1rem;

  background-color: var(--bg-color);

  color: var(--text-color);

  ol {
    li {
      text-align: left;
      margin: 2rem 0;

      div {
        display: inline-flex;
        .expires {
          color: var(--theme-color);
          margin: 0 3px;
        }
      }

      .command {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .info {
          background-color: var(--bg-color);
          border: solid 1px var(--shadow-color);
          padding: 2px 4px;
          border-radius: 5px;
        }

        .icon {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
      }

      .send {
        display: flex;
        justify-content: flex-start;
      }
    }
  }

  p {
    color: var(--text-color);

    font-size: 1rem;

    line-height: 1.6;

    margin-bottom: 1.5rem;
  }
}

.modal-footer {
  padding: 1.5rem;

  border-top: 1px solid var(--border-color);

  display: flex;

  justify-content: flex-end;

  gap: 1rem;

  background-color: var(--bg-color);

  button {
    padding: 0.85rem 1.75rem;

    border-radius: 10px;

    font-size: 1rem;

    font-weight: 500;

    cursor: pointer;

    transition: all 0.3s ease;

    &.cancel-btn {
      background-color: var(--card-bg);

      border: 1px solid var(--border-color);

      color: var(--text-color);

      &:hover {
        background-color: var(--bg-secondary);

        border-color: var(--text-muted);
      }
    }

    &.submit-btn {
      background-color: var(--theme-color);

      color: white;

      border: none;

      display: flex;

      align-items: center;

      justify-content: center;

      gap: 0.75rem;

      box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.25);

      &:hover:not(:disabled) {
        background-color: rgba(var(--theme-color-rgb), 0.9);

        transform: translateY(-2px);

        box-shadow: 0 6px 15px rgba(var(--theme-color-rgb), 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.7;

        cursor: not-allowed;
      }

      .loader {
        width: 18px;

        height: 18px;

        border: 2px solid rgba(255, 255, 255, 0.3);

        border-radius: 50%;

        border-top-color: white;

        animation: spin 1s linear infinite;
      }
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);

    opacity: 0;
  }

  to {
    transform: translateY(0);

    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateY(0);

    opacity: 1;
  }

  to {
    transform: translateY(30px);

    opacity: 0;
  }
}

.message-loading {
  flex: 1;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  color: var(--text-muted);

  height: 100%;

  min-height: 200px;

  .no-selection-icon,
  .no-messages-icon {
    margin-bottom: 1.2rem;

    opacity: 0.6;

    color: var(--text-muted);

    @media (prefers-color-scheme: dark) {
      opacity: 0.4;
    }
  }

  p {
    font-size: 1rem;

    text-align: center;

    margin-top: 0.8rem;
  }
}
</style>
