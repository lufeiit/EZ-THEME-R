<script setup>
import { IconTrash, IconX } from "@tabler/icons-vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { deleteUser } from "@/api/user";
import { useToast } from "@/composables/useToast";
import { forceLogout } from "@/api/auth";
import { useRouter } from "vue-router";

const { t } = useI18n();
const props = defineProps({
  userInfo: Object,
});

const { showToast } = useToast();
const router = useRouter();

const showModal = ref(false);
const loading = ref(false);

const openDeleteModal = () => {
  showModal.value = true;
};

const clostDeleteModal = () => {
  showModal.value = false;
};

const confirmDelete = async () => {
  try {
    loading.value = true;
    const res = await deleteUser({ id: props.userInfo.id });
    if (res.data) {
      forceLogout();
      showToast(t("profile.accountDeletedSuccess"), "success", 3000);
      router.push("/login");
    }
  } catch (e) {
    console.log(e);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="profile-skeleton">
    <div class="profile-card">
      <div class="card-header">
        <h3>{{ $t("profile.deleteAccount") }}</h3>
      </div>
      <div class="settings-content">
        <div class="action-buttons">
          <button class="action-btn danger" @click="openDeleteModal">
            <IconTrash :size="18" />
            {{ $t("profile.delete") }}
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click="clostDeleteModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>{{ $t("profile.deleteAccount") }}</h3>

              <button class="modal-close" @click="clostDeleteModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="modal-body">
              {{ $t("profile.deleteAccountConfirm") }}
            </div>

            <div class="modal-footer">
              <button
                class="btn-submit"
                @click="confirmDelete"
                :disabled="loading"
              >
                <span v-if="loading" class="loader"></span>

                {{ $t("common.confirm") }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.profile-skeleton {
  .profile-card {
    background-color: var(--card-bg);

    border-radius: 12px;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    border: 1px solid var(--border-color);

    margin-bottom: 24px;

    overflow: hidden;

    position: relative;

    &::after {
      content: "";

      position: absolute;

      top: 0;

      right: 0;

      bottom: 0;

      left: 0;

      transform: translateX(-100%);

      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0,

        rgba(255, 255, 255, 0.1) 20%,

        rgba(255, 255, 255, 0.2) 60%,

        rgba(255, 255, 255, 0) 100%
      );

      animation: shimmer 2s infinite;

      z-index: 1;
    }
  }

  .card-header {
    padding: 15px 20px;

    border-bottom: 1px solid var(--border-color);

    background-color: rgba(var(--theme-color-rgb), 0.03);

    h3 {
      font-size: 16px;

      font-weight: 600;

      margin: 0;

      color: var(--text-color);
    }

    .skeleton-title {
      height: 20px;

      width: 120px;

      border-radius: 4px;

      background-color: var(--skeleton-color);
    }
  }

  .settings-content {
    padding: 16px 20px;

    .setting-item {
      display: flex;

      justify-content: space-between;

      align-items: center;

      padding: 12px 0;

      border-bottom: 1px solid rgba(var(--border-color-rgb), 0.5);

      &:last-child {
        border-bottom: none;
      }

      .setting-info {
        flex: 1;

        margin-right: 16px;

        .setting-label {
          display: block;

          font-size: 15px;

          font-weight: 500;

          color: var(--text-color);

          margin-bottom: 4px;
        }

        .setting-description {
          font-size: 13px;

          color: var(--text-muted);
        }
      }
    }

    .action-buttons {
      display: flex;

      flex-wrap: wrap;

      gap: 12px;

      margin-bottom: 16px;

      .action-btn {
        display: flex;

        align-items: center;

        gap: 8px;

        padding: 8px 16px;

        border-radius: 8px;

        background-color: rgba(var(--theme-color-rgb), 0.1);

        color: var(--theme-color);

        border: 1px solid rgba(var(--theme-color-rgb), 0.2);

        font-size: 14px;

        font-weight: 500;

        cursor: pointer;

        transition: all 0.3s ease;

        &:hover {
          background-color: rgba(var(--theme-color-rgb), 0.2);

          transform: translateY(-2px);
        }

        &.danger {
          background-color: rgba(244, 67, 54, 0.1);

          color: #f44336;

          border-color: rgba(244, 67, 54, 0.2);

          &:hover {
            background-color: rgba(244, 67, 54, 0.2);
          }
        }
      }
    }

    .subscription-info {
      margin-top: 16px;

      padding: 12px;

      background-color: rgba(var(--theme-color-rgb), 0.05);

      border-radius: 8px;

      border: 1px dashed rgba(var(--theme-color-rgb), 0.3);

      .subscription-url {
        font-size: 14px;

        color: var(--text-color);

        word-break: break-all;

        line-height: 1.5;
      }
    }

    .gift-card-form {
      margin-top: 8px;

      .input-group {
        display: flex;

        gap: 10px;

        @media (max-width: 576px) {
          flex-direction: column;

          gap: 12px;
        }

        .gift-card-input {
          flex: 1;

          padding: 10px 12px;

          border: 1px solid var(--border-color);

          border-radius: 8px;

          background-color: var(--bg-secondary);

          color: var(--text-color);

          font-size: 15px;

          transition: all 0.3s ease;

          &:focus {
            outline: none;

            border-color: var(--theme-color);

            box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.1);
          }
        }

        .gift-card-btn {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 8px;

          padding: 10px 16px;

          border-radius: 8px;

          background-color: var(--theme-color);

          color: white;

          border: none;

          font-size: 14px;

          font-weight: 500;

          cursor: pointer;

          transition: all 0.3s ease;

          @media (max-width: 576px) {
            width: 100%;

            padding: 12px 16px;
          }

          &:hover:not(:disabled) {
            background-color: rgba(var(--theme-color-rgb), 0.9);

            transform: translateY(-2px);
          }

          &:disabled {
            opacity: 0.7;

            cursor: not-allowed;
          }

          .loader {
            width: 16px;

            height: 16px;

            border: 2px solid rgba(255, 255, 255, 0.3);

            border-radius: 50%;

            border-top-color: white;

            animation: spin 1s linear infinite;
          }
        }
      }
    }
  }

  .skeleton-content {
    padding: 20px;

    .skeleton-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .skeleton-label {
        height: 14px;

        width: 80px;

        border-radius: 4px;

        margin-bottom: 8px;

        background-color: var(--skeleton-color);
      }

      .skeleton-value {
        height: 16px;

        width: 150px;

        border-radius: 4px;

        background-color: var(--skeleton-color);
      }

      .skeleton-description {
        height: 12px;

        width: 200px;

        border-radius: 4px;

        margin-top: 6px;

        background-color: var(--skeleton-color);
      }
    }

    .skeleton-setting {
      display: flex;

      justify-content: space-between;

      padding: 12px 0;

      border-bottom: 1px solid rgba(var(--border-color-rgb), 0.5);

      &:last-child {
        border-bottom: none;
      }

      .skeleton-text {
        flex: 1;

        margin-right: 16px;
      }

      .skeleton-toggle {
        width: 46px;

        height: 24px;

        border-radius: 12px;

        background-color: var(--skeleton-color);
      }
    }

    .skeleton-button {
      height: 36px;

      width: 120px;

      border-radius: 8px;

      background-color: var(--skeleton-color);
    }
  }

  .action-buttons {
    display: flex;

    flex-wrap: wrap;

    gap: 12px;

    margin-bottom: 16px;

    .action-btn {
      display: flex;

      align-items: center;

      gap: 8px;

      padding: 8px 16px;

      border-radius: 8px;

      background-color: rgba(var(--theme-color-rgb), 0.1);

      color: var(--theme-color);

      border: 1px solid rgba(var(--theme-color-rgb), 0.2);

      font-size: 14px;

      font-weight: 500;

      cursor: pointer;

      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(var(--theme-color-rgb), 0.2);

        transform: translateY(-2px);
      }

      &.danger {
        background-color: rgba(244, 67, 54, 0.1);

        color: #f44336;

        border-color: rgba(244, 67, 54, 0.2);

        &:hover {
          background-color: rgba(244, 67, 54, 0.2);
        }
      }
    }
  }
}

.modal-overlay {
  position: fixed;

  top: 0;

  left: 0;

  right: 0;

  bottom: 0;

  background-color: rgba(0, 0, 0, 0.5);

  display: flex;

  justify-content: center;

  align-items: center;

  z-index: 1000;

  backdrop-filter: blur(5px);

  -webkit-backdrop-filter: blur(5px);
}

.modal-content {
  background-color: var(--card-background);

  border-radius: 12px;

  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  width: 90%;

  max-width: 480px;

  overflow: hidden;

  display: flex;

  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;

  border-bottom: 1px solid var(--border-color);

  display: flex;

  justify-content: space-between;

  align-items: center;

  h3 {
    margin: 0;

    font-size: 18px;

    font-weight: 600;

    color: #f44336;
  }

  .modal-close {
    background: none;

    border: none;

    color: var(--text-muted);

    cursor: pointer;

    padding: 4px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 6px;

    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.1);

      color: var(--theme-color);
    }
  }
}

.modal-body {
  padding: 20px;

  p {
    color: var(--text-color);

    font-size: 15px;

    line-height: 1.6;

    margin: 0 0 16px;
  }

  .form-group {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;

      font-size: 14px;

      font-weight: 500;

      color: var(--text-color);

      margin-bottom: 8px;
    }

    input {
      width: 100%;

      padding: 10px 12px;

      border: 1px solid var(--border-color);

      border-radius: 8px;

      background-color: var(--bg-secondary);

      color: var(--text-color);

      font-size: 15px;

      transition: all 0.3s ease;

      &:focus {
        outline: none;

        border-color: var(--theme-color);

        box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.1);
      }
    }

    .error-text {
      margin-top: 6px;

      color: #f44336;

      font-size: 13px;
    }
  }
}

.modal-footer {
  padding: 16px 20px;

  border-top: 1px solid var(--border-color);

  display: flex;

  justify-content: flex-end;

  gap: 12px;

  button {
    padding: 8px 16px;

    border-radius: 8px;

    font-size: 14px;

    font-weight: 500;

    cursor: pointer;

    transition: all 0.3s ease;

    &.btn-cancel {
      background-color: transparent;

      border: 1px solid var(--border-color);

      color: var(--text-color);

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    &.btn-submit {
      background-color: var(--theme-color);

      border: none;

      color: white;

      display: flex;

      align-items: center;

      gap: 8px;

      &:hover:not(:disabled) {
        background-color: rgba(var(--theme-color-rgb), 0.9);
      }

      &:disabled {
        opacity: 0.7;

        cursor: not-allowed;
      }

      &.danger {
        background-color: #f44336;

        &:hover:not(:disabled) {
          background-color: #d32f2f;
        }
      }

      .loader {
        width: 16px;

        height: 16px;

        border: 2px solid rgba(255, 255, 255, 0.3);

        border-radius: 50%;

        border-top-color: white;

        animation: spin 1s linear infinite;
      }
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
