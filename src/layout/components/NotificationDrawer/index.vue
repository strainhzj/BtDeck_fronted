<template>
  <el-drawer
    :visible.sync="drawerVisible"
    direction="rtl"
    size="400px"
    :show-close="false"
    :wrapper-closable="true"
    custom-class="notification-drawer"
    @open="handleOpen"
    @close="handleClose"
  >
    <!-- 自定义头部 -->
    <template slot="title">
      <div class="drawer-header">
        <span class="drawer-title">通知中心</span>
        <div class="drawer-header-actions">
          <el-button
            v-if="unreadCount > 0"
            type="text"
            size="small"
            @click="handleReadAll"
          >
            全部已读
          </el-button>
        </div>
      </div>
    </template>

    <!-- 筛选 Tab -->
    <div class="drawer-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="handleTabChange(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.value === 'unread' && unreadCount > 0" class="tab-badge">{{ unreadCount }}</span>
      </div>
    </div>

    <!-- 通知列表 -->
    <div class="drawer-body">
      <div v-if="loading" class="drawer-loading">
        <i class="el-icon-loading" />
      </div>

      <template v-else-if="notifications.length > 0">
        <notification-item
          v-for="item in notifications"
          :key="item.id"
          :notification="item"
          @read="handleRead"
          @delete="handleDelete"
        />
        <div v-if="hasMore" class="load-more">
          <el-button type="text" size="small" @click="loadMore">加载更多</el-button>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else class="drawer-empty">
        <i class="el-icon-bell" />
        <p>暂无通知</p>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { NotificationModule } from '@/store/modules/notification'
import NotificationItemComp from './NotificationItem.vue'

@Component({
  name: 'NotificationDrawer',
  components: {
    NotificationItem: NotificationItemComp
  }
})
export default class extends Vue {
  private activeTab: string = 'all'
  private pollingTimer: ReturnType<typeof setInterval> | null = null

  private tabs = [
    { label: '全部', value: 'all' },
    { label: '未读', value: 'unread' },
    { label: '更新', value: 'version_update' },
    { label: '系统', value: 'system' }
  ]

  get drawerVisible() {
    return NotificationModule.drawerVisible
  }

  set drawerVisible(val: boolean) {
    NotificationModule.ToggleDrawer(val)
  }

  get notifications() {
    return NotificationModule.notifications
  }

  get unreadCount() {
    return NotificationModule.unreadCount
  }

  get loading() {
    return NotificationModule.loading
  }

  get hasMore() {
    return NotificationModule.total > NotificationModule.notifications.length
  }

  private handleOpen() {
    this.fetchList()
  }

  private handleClose() {
    NotificationModule.ToggleDrawer(false)
  }

  private handleTabChange(tab: string) {
    this.activeTab = tab
    this.fetchList()
  }

  private fetchList() {
    const params: { page?: number; type?: string; is_read?: boolean } = {}
    if (this.activeTab === 'unread') {
      params.is_read = false
    } else if (this.activeTab !== 'all') {
      params.type = this.activeTab
    }
    NotificationModule.FetchNotifications(params)
  }

  private loadMore() {
    // 简单分页：当前页 + 1
    const nextPage = Math.floor(this.notifications.length / 20) + 1
    NotificationModule.FetchNotifications({ page: nextPage })
  }

  private async handleRead(id: number) {
    await NotificationModule.MarkAsRead(id)
  }

  private async handleReadAll() {
    await NotificationModule.MarkAllAsRead()
  }

  private async handleDelete(id: number) {
    await NotificationModule.DeleteNotification(id)
  }

  private startPolling() {
    // 60秒轮询未读数
    this.pollingTimer = setInterval(() => {
      NotificationModule.FetchUnreadCount()
    }, 60000)
  }

  private stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  mounted() {
    // 首次加载未读数
    NotificationModule.FetchUnreadCount()
    this.startPolling()
  }

  beforeDestroy() {
    this.stopPolling()
  }
}
</script>

<style lang="scss" scoped>
/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: var(--spacing-md, 16px);
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1F2937);
}

/* 筛选标签 */
.drawer-tabs {
  display: flex;
  gap: var(--spacing-sm, 8px);
  padding: var(--spacing-md, 12px) var(--spacing-lg, 20px);
  border-bottom: 1px solid var(--color-border-primary, #E5E7EB);
}

.tab-item {
  font-size: 13px;
  color: var(--color-text-secondary, #6B7280);
  padding: 4px 12px;
  border-radius: var(--radius-full, 9999px);
  cursor: pointer;
  transition: all var(--transition-base, 200ms);
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: var(--color-primary, #059669);
    background: rgba(5, 150, 105, 0.08);
  }

  &.is-active {
    color: #fff;
    background: var(--color-primary, #059669);
  }
}

.tab-badge {
  font-size: 11px;
  background: var(--color-error, #EF4444);
  color: #fff;
  border-radius: var(--radius-full, 9999px);
  padding: 0 6px;
  line-height: 18px;
  min-width: 18px;
  text-align: center;

  .is-active & {
    background: rgba(255, 255, 255, 0.3);
  }
}

/* 内容区域 */
.drawer-body {
  padding: var(--spacing-md, 12px) var(--spacing-lg, 20px);
  overflow-y: auto;
  height: calc(100% - 110px);
}

.drawer-loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl, 32px);
  i { font-size: 24px; color: var(--color-text-tertiary, #9CA3AF); }
}

.drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xxl, 48px) 0;
  i { font-size: 48px; color: var(--color-text-quaternary, #D1D5DB); }
  p { margin-top: var(--spacing-md, 12px); color: var(--color-text-tertiary, #9CA3AF); font-size: 14px; }
}

.load-more {
  text-align: center;
  padding: var(--spacing-md, 12px) 0;
}
</style>

<style lang="scss">
/* 全局样式：覆盖 el-drawer 默认样式 */
.notification-drawer {
  .el-drawer__header {
    margin-bottom: 0;
    padding: var(--spacing-md, 16px) var(--spacing-lg, 20px);
    border-bottom: 1px solid var(--color-border-primary, #E5E7EB);
  }

  .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }
}
</style>
