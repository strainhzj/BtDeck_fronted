<template>
  <!-- 自定义弹窗 - 完全采用设计稿样式 -->
  <div
    class="modal-overlay"
    :class="{active: visible}"
    @click.self="handleClose"
  >
    <div class="modal-dialog" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">➕ 添加种子</h3>
        <button class="modal-close" @click="handleClose">✕</button>
      </div>
      <div class="modal-body">
        <!-- 保留 Element UI 表单验证逻辑 -->
        <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="custom-form">
          <!-- 种子文件上传区域 - 使用设计稿样式 -->
          <div class="form-group">
            <label class="form-label">
              种子文件 <span style="color: var(--color-error);">*</span>
            </label>
            <!-- 自定义文件上传区域 -->
            <div
              class="file-upload-area"
              :class="{'has-error': formErrors.torrent_file}"
              @click="triggerFileSelect"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".torrent"
                style="display: none;"
                @change="handleFileChange"
              />
              <div class="file-upload-placeholder" v-if="!form.torrent_file">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">📁</span>
                <span style="color: var(--color-text-secondary);">点击选择 .torrent 文件</span>
              </div>
              <div class="file-upload-info" v-else>
                <span style="color: var(--color-success);">✓</span>
                <span style="margin-left: 8px;">{{ selectedFileName }}</span>
              </div>
            </div>
            <div class="form-error-tip" v-if="formErrors.torrent_file">{{ formErrors.torrent_file }}</div>
            <div style="font-size: 12px; color: var(--color-text-quaternary); margin-top: 6px;">
              只支持 .torrent 文件
            </div>
          </div>

          <!-- 下载器选择 - 使用自定义样式 -->
          <div class="form-group">
            <label class="form-label">
              下载器 <span style="color: var(--color-error);">*</span>
            </label>
            <select
              v-model="form.downloader_id"
              class="form-input"
              :class="{'has-error': formErrors.downloader_id}"
              @change="clearError('downloader_id')"
            >
              <option value="">选择下载器</option>
              <option
                v-for="downloader in downloaders"
                :key="downloader.downloader_id"
                :value="downloader.downloader_id"
              >
                {{ downloader.nickname }}
              </option>
            </select>
            <div class="form-error-tip" v-if="formErrors.downloader_id">{{ formErrors.downloader_id }}</div>
          </div>

          <!-- 保存路径 -->
          <div class="form-group">
            <label class="form-label">
              保存路径 <span style="color: var(--color-error);">*</span>
            </label>
            <input
              type="text"
              v-model="form.save_path"
              class="form-input"
              placeholder="输入保存路径，例如: /downloads"
              :class="{'has-error': formErrors.save_path}"
              @input="clearError('save_path')"
            />
            <div class="form-error-tip" v-if="formErrors.save_path">{{ formErrors.save_path }}</div>
          </div>

          <!-- 分类 -->
          <div class="form-group">
            <label class="form-label">分类</label>
            <input
              type="text"
              v-model="form.category"
              class="form-input"
              placeholder="输入分类（可选）"
            />
          </div>

          <!-- 标签 -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">标签</label>
            <input
              type="text"
              v-model="form.tags"
              class="form-input"
              placeholder="输入标签，多个用逗号分隔（可选）"
            />
          </div>
        </el-form>
      </div>
      <div class="modal-footer">
        <div class="modal-footer-left"></div>
        <div class="modal-footer-right">
          <button class="btn-secondary" @click="handleClose">取消</button>
          <button class="btn-primary" @click="handleConfirm" :disabled="loading">
            {{ loading ? '添加中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator'
import { addTorrent } from '@/api/torrents'

@Component
export default class TorrentAddDialog extends Vue {
  @Prop(Boolean) visible!: boolean
  @Prop(Array) downloaders!: any[]

  // 使用 Ref 装饰器获取引用
  @Ref('formRef') readonly formRef!: any
  @Ref('fileInputRef') readonly fileInputRef!: any

  private loading = false
  private selectedFileName = ''
  private formErrors: Record<string, string> = {}

  private form = {
    torrent_file: null as File | null,
    downloader_id: '',
    save_path: '',
    category: '',
    tags: ''
  }

  private rules = {
    torrent_file: [{ required: true, message: '请选择种子文件', trigger: 'change' }],
    downloader_id: [{ required: true, message: '请选择下载器', trigger: 'change' }],
    save_path: [{ required: true, message: '请输入保存路径', trigger: 'blur' }]
  }

  // 触发文件选择
  triggerFileSelect() {
    this.fileInputRef?.click()
  }

  // 处理文件变更
  handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      const file = input.files[0]

      // 验证文件类型
      if (!file.name.endsWith('.torrent')) {
        this.formErrors.torrent_file = '请选择 .torrent 文件'
        this.form.torrent_file = null
        this.selectedFileName = ''
        return
      }

      this.form.torrent_file = file
      this.selectedFileName = file.name
      this.clearError('torrent_file')
    }
  }

  // 清除错误提示
  clearError(field: string) {
    if (this.formErrors[field]) {
      this.$delete(this.formErrors, field)
    }
  }

  // 验证表单
  validateForm(): boolean {
    this.formErrors = {}

    if (!this.form.torrent_file) {
      this.formErrors.torrent_file = '请选择种子文件'
    }

    // 修复：使用精确判断，避免数字0被误判为false
    if (this.form.downloader_id === null || this.form.downloader_id === undefined || this.form.downloader_id === '') {
      this.formErrors.downloader_id = '请选择下载器'
    }

    if (!this.form.save_path) {
      this.formErrors.save_path = '请输入保存路径'
    }

    return Object.keys(this.formErrors).length === 0
  }

  async handleConfirm() {
    if (!this.validateForm()) {
      return
    }

    this.loading = true
    try {
      const response = await addTorrent({
        torrent_file: this.form.torrent_file as File,
        downloader_id: this.form.downloader_id,
        save_path: this.form.save_path,
        category: this.form.category || '',
        tags: this.form.tags || '',
        paused: false,
        skip_hash_check: false,
        is_sequential_download: false,
        is_first_last_piece_priority: false
      })

      if (response.code === '200') {
        this.$message.success('种子添加成功')
        this.$emit('confirm', this.form)
        this.handleClose()
      } else {
        this.$message.error(response.msg || '种子添加失败')
      }
    } catch (error: any) {
      console.error('添加种子失败:', error)
      this.$message.error(error.message || '种子添加失败，请稍后重试')
    } finally {
      this.loading = false
    }
  }

  handleClose() {
    // 重置表单
    this.form = {
      torrent_file: null,
      downloader_id: '',
      save_path: '',
      category: '',
      tags: ''
    }
    this.selectedFileName = ''
    this.formErrors = {}

    // 清空文件输入
    if (this.fileInputRef) {
      this.fileInputRef.value = ''
    }

    this.$emit('update:visible', false)
  }
}
</script>

<style lang="scss" scoped>
// ========================================
// 弹窗基础样式
// ========================================
.modal-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  align-items: center;
  justify-content: center;

  &.active {
    display: flex;
  }
}

.modal-dialog {
  background: var(--color-bg-primary);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: white;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer-left,
.modal-footer-right {
  display: flex;
  gap: 10px;
}

// ========================================
// Element UI 表单隐藏
// ========================================
.custom-form {
  ::v-deep .el-form-item__label {
    display: none;
  }

  ::v-deep .el-form-item__content {
    margin-left: 0 !important;
  }

  ::v-deep .el-form-item {
    margin-bottom: 0;
  }
}

// ========================================
// 表单样式
// ========================================
.form-group {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  transition: all 0.2s ease;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  &::placeholder {
    color: var(--color-text-quaternary);
  }

  &:hover {
    border-color: var(--color-border-primary);
  }

  &.has-error {
    border-color: var(--color-error);

    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

select.form-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.form-error-tip {
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
}

// ========================================
// 文件上传区域样式
// ========================================
.file-upload-area {
  border: 2px dashed var(--color-border-primary);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    background: rgba(16, 185, 129, 0.02);
  }

  &.has-error {
    border-color: var(--color-error);

    &:hover {
      border-color: var(--color-error);
      background: rgba(239, 68, 68, 0.02);
    }
  }
}

.file-upload-placeholder {
  color: var(--color-text-secondary);
}

.file-upload-info {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
}

// ========================================
// 按钮样式
// ========================================
.btn-secondary {
  padding: 8px 16px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-bg-tertiary);
  }
}

.btn-primary {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ========================================
// 滚动条样式
// ========================================
.modal-dialog::-webkit-scrollbar {
  width: 8px;
}

.modal-dialog::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
  border-radius: 4px;
}

.modal-dialog::-webkit-scrollbar-thumb {
  background: var(--color-border-primary);
  border-radius: 4px;
}

.modal-dialog::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-quaternary);
}
</style>
