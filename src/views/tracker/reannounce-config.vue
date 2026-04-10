<template>
  <div class="app-container reannounce-config-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        📢 Tracker汇报配置
      </h2>
      <p class="page-description">
        配置站点的Tracker汇报间隔，支持域名通配符匹配
      </p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.domain_display_name"
        placeholder="搜索域名名称..."
        style="width: 250px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      >
        <i slot="prefix" class="el-input__icon el-icon-search" />
      </el-input>

      <el-select
        v-model="listQuery.enabled"
        placeholder="启用状态"
        clearable
        style="width: 150px;"
        class="filter-item"
      >
        <el-option label="已启用" :value="true" />
        <el-option label="已禁用" :value="false" />
      </el-select>

      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        size="small"
        @click="handleFilter"
      >
        搜索
      </el-button>
      <el-button
        class="filter-item"
        type="default"
        icon="el-icon-refresh-left"
        size="small"
        @click="resetFilter"
      >
        重置
      </el-button>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button
          type="primary"
          icon="el-icon-plus"
          @click="openCreateDialog"
        >
          新增配置
        </el-button>
        <el-button
          icon="el-icon-search"
          :loading="autoDetectLoading"
          @click="handleAutoDetect"
        >
          自动检测域名
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button
          icon="el-icon-refresh"
          circle
          size="small"
          @click="getList"
        />
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="加载中..."
      border
      fit
      highlight-current-row
      :cell-style="cellStyle"
      :header-cell-style="headerCellStyle"
      header-row-class-name="reannounce-table-header"
      style="width: 100%;"
    >
      <el-table-column label="域名显示名称" min-width="150" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span>{{ row.domain_display_name }}</span>
        </template>
      </el-table-column>

      <el-table-column label="域名模式" min-width="180" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span v-html="sanitizeDomainPattern(row.domain_pattern)" />
        </template>
      </el-table-column>

      <el-table-column label="间隔分钟" width="100" align="center">
        <template slot-scope="{row}">
          <span>{{ row.interval_minutes }}</span>
        </template>
      </el-table-column>

      <el-table-column label="启用开关" width="100" align="center">
        <template slot-scope="{row}">
          <el-switch
            :value="row.enabled"
            @change="handleToggleEnabled(row)"
          />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template slot-scope="{row}">
          <el-button
            type="text"
            size="small"
            icon="el-icon-edit"
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            type="text"
            size="small"
            icon="el-icon-delete"
            class="danger-text"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.pageSize"
      @pagination="getList"
    />

    <!-- 新增/编辑配置对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="configForm"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="域名模式" prop="domain_pattern">
          <el-input
            v-model="formData.domain_pattern"
            placeholder="%.tracker.com"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            💡 支持使用 % 作为通配符匹配多个子域名
          </div>
        </el-form-item>

        <el-form-item label="域名显示名称" prop="domain_display_name">
          <el-input
            v-model="formData.domain_display_name"
            placeholder="Tracker站点"
          />
        </el-form-item>

        <el-form-item label="汇报间隔（分钟）" prop="interval_minutes">
          <el-input-number
            v-model="formData.interval_minutes"
            :min="1"
            :max="1440"
            style="width: 180px;"
          />
        </el-form-item>

        <el-form-item label="启用配置">
          <el-switch v-model="formData.enabled" />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            开启后将按设定间隔自动汇报Tracker
          </div>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getReannounceConfigs, createReannounceConfig, updateReannounceConfig, deleteReannounceConfig, autoDetectDomains } from '@/api/tracker'
import Pagination from '@/components/Pagination'

export default {
  name: 'TrackerReannounceConfig',
  components: {
    Pagination
  },
  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,
      autoDetectLoading: false,
      submitLoading: false,
      listQuery: {
        domain_display_name: undefined,
        enabled: undefined,
        page: 1,
        pageSize: 20  // ✅ 修复：使用驼峰命名 pageSize
      },
      dialogVisible: false,
      dialogTitle: '新增配置',
      formData: {
        config_id: undefined,
        domain_pattern: '',
        domain_display_name: '',
        interval_minutes: 30,
        enabled: true
      },
      formRules: {
        domain_pattern: [
          { required: true, message: '请输入域名模式', trigger: 'blur' }
        ],
        interval_minutes: [
          { required: true, message: '请输入汇报间隔', trigger: 'blur' },
          {
            type: 'number',
            min: 1,
            max: 1440,
            message: '汇报间隔必须在 1-1440 分钟之间',
            trigger: 'blur',
            transform: (value) => Number(value)  // ✅ 修复：确保类型转换
          }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    cellStyle({ columnIndex }) {
      // 在操作列(第5列，索引4)添加左边框，使其在固定列上方显示
      if (columnIndex === 4) {
        return { borderLeft: '1px solid #DCDFE6' }
      }
      return null
    },

    headerCellStyle({ columnIndex }) {
      // 表头同样在操作列添加左边框
      if (columnIndex === 4) {
        return { borderLeft: '1px solid #DCDFE6' }
      }
      return null
    },

    getList() {
      this.listLoading = true
      getReannounceConfigs(this.listQuery).then(response => {
        if (response.code === '200') {
          this.list = response.data.list
          this.total = response.data.total
        } else {
          this.$message.error(response.msg || '获取配置列表失败')
        }
        this.listLoading = false
      }).catch(error => {
        console.error('获取配置列表失败:', error)
        this.$message.error('获取配置列表失败')
        this.listLoading = false
      })
    },

    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    resetFilter() {
      this.listQuery = {
        domain_display_name: undefined,
        enabled: undefined,
        page: 1,
        pageSize: 20  // ✅ 修复：使用驼峰命名 pageSize
      }
      this.getList()
    },

    highlightWildcard(pattern) {
      // ✅ 修复：移除v-html，使用CSS类避免XSS风险
      // 由于使用v-html存在XSS风险，改为在模板中使用条件渲染
      return pattern  // 返回原始pattern，在模板中处理
    },

    sanitizeDomainPattern(pattern) {
      // ✅ 修复：安全的HTML转义方法，防止XSS攻击
      // 只转义通配符%为高亮样式，其他HTML字符进行转义
      const escapeHtml = (text) => {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
      }

      // 先转义整个pattern
      const escapedPattern = escapeHtml(pattern)
      // 然后将转义后的%替换为高亮的%
      return escapedPattern.replace(/%/g, '<span class="wildcard-highlight">%</span>')
    },

    openCreateDialog() {
      this.dialogTitle = '新增配置'
      this.formData = {
        config_id: undefined,
        domain_pattern: '',
        domain_display_name: '',
        interval_minutes: 30,
        enabled: true
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.configForm?.clearValidate()
      })
    },

    openEditDialog(row) {
      this.dialogTitle = '编辑配置'
      this.formData = {
        config_id: row.config_id,
        domain_pattern: row.domain_pattern,
        domain_display_name: row.domain_display_name,
        interval_minutes: row.interval_minutes,
        enabled: row.enabled
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.configForm?.clearValidate()
      })
    },

    handleSubmit() {
      // ✅ 修复：在异步操作前保存this引用
      const form = this.$refs.configForm
      const that = this

      form.validate(valid => {
        if (valid) {
          this.submitLoading = true

          const data = {
            domain_pattern: this.formData.domain_pattern,
            domain_display_name: this.formData.domain_display_name || this.formData.domain_pattern,
            interval_minutes: this.formData.interval_minutes,
            enabled: this.formData.enabled
          }

          if (this.formData.config_id) {
            // 更新
            updateReannounceConfig(this.formData.config_id, data).then(response => {
              if (response.code === '200') {
                that.$message.success('配置更新成功')
                that.dialogVisible = false
                that.getList()
              } else {
                that.$message.error(response.msg || '配置更新失败')
              }
              that.submitLoading = false
            }).catch(error => {
              console.error('配置更新失败:', error)
              that.$message.error('配置更新失败')
              that.submitLoading = false
            })
          } else {
            // 新增
            createReannounceConfig(data).then(response => {
              if (response.code === '200') {
                that.$message.success('配置创建成功')
                that.dialogVisible = false
                that.getList()
              } else {
                that.$message.error(response.msg || '配置创建失败')
              }
              that.submitLoading = false
            }).catch(error => {
              console.error('配置创建失败:', error)
              that.$message.error('配置创建失败')
              that.submitLoading = false
            })
          }
        }
      })
    },

    handleToggleEnabled(row) {
      const originalEnabled = row.enabled  // ✅ 保存原始状态
      const newEnabled = !originalEnabled

      // 先更新UI状态（乐观更新）
      this.$set(row, 'enabled', newEnabled)

      updateReannounceConfig(row.config_id, { enabled: newEnabled }).then(response => {
        if (response.code === '200') {
          this.$message.success(newEnabled ? '配置已启用' : '配置已禁用')
        } else {
          // 失败时回滚UI状态
          this.$set(row, 'enabled', originalEnabled)
          this.$message.error(response.msg || '配置状态更新失败')
        }
      }).catch(error => {
        // 异常时也要回滚UI状态
        this.$set(row, 'enabled', originalEnabled)
        console.error('配置状态更新失败:', error)
        this.$message.error('配置状态更新失败')
      })
    },

    handleDelete(row) {
      this.$confirm(`确定要删除配置「${row.domain_display_name}」吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteReannounceConfig(row.config_id).then(response => {
          if (response.code === '200') {
            this.$message.success('配置删除成功')
            this.getList()
          } else {
            this.$message.error(response.msg || '配置删除失败')
          }
        }).catch(error => {
          console.error('配置删除失败:', error)
          this.$message.error('配置删除失败')
        })
      }).catch(() => {})
    },

    handleAutoDetect() {
      this.autoDetectLoading = true
      autoDetectDomains().then(response => {
        if (response.code === '200') {
          const { detected, created } = response.data
          this.$message.success(`检测到 ${detected} 个域名，新增 ${created} 个配置`)
          this.getList()
        } else {
          this.$message.error(response.msg || '自动检测失败')
        }
        this.autoDetectLoading = false
      }).catch(error => {
        console.error('自动检测失败:', error)
        this.$message.error('自动检测失败')
        this.autoDetectLoading = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.reannounce-config-page {
  padding: 20px;
}

.filter-container {
  background-color: #fff;
  border-radius: 4px;
  padding: 18px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  border: 1px solid #E4E7ED;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;

  .filter-item {
    margin-bottom: 0;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

/* ✅ 修复：添加通配符高亮样式 */
.wildcard-highlight {
  color: #059669;
  font-weight: 600;
}

/* ✅ 修复：添加危险文本样式 */
.danger-text {
  color: #F56C6C;
}

/* ✅ 修复：页面头部样式 */
.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  color: #303133;
  font-weight: 600;
  margin: 0;
}

.page-description {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
  margin-bottom: 0;
}

/* 表格表头渐变背景样式 */
::v-deep .reannounce-table-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-bottom: 2px solid var(--color-primary);

  th {
    background: transparent;
    font-weight: var(--font-weight-semibold);
    color: white;
    border-bottom: none;
  }
}
</style>
