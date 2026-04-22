# Progress Log - BTDeck 前端

> **项目**: BTDeck 前端应用
> **当前功能**: v1.0.4 实时速度监控
> **更新**: 2026-04-22

---

## 📊 前端任务进度

```
░░░░░░░░░░░░░░░░░░░░ 0%
```

| 任务 ID | 任务名称 | 文件 | 状态 | 完成度 |
|---------|----------|------|------|--------|
| v1.0.4.3 | 前端 API 封装 | `src/api/torrents.ts` | ⏳ 待开始 | 0% |
| v1.0.4.4 | 前端组件改造 | `src/views/torrents/index.vue` | ⏳ 待开始 | 0% |

---

## 🎯 当前任务

### ⏳ 待开始: 前端组件改造

**任务 ID**: v1.0.4.4
**文件**: `src/views/torrents/index.vue`
**预计工时**: 2天

**任务描述**:
改造种子列表组件，实现虚拟分页和1秒轮询，支持复合条件查询。

**实现要点**:
1. Vue 2 Options API 风格
2. 虚拟分页逻辑（活跃+非活跃）
3. 1秒轮询活跃种子
4. 查询条件优先级高于速度
5. 定时器清理

**关键代码结构**:
```vue
<script>
export default {
  name: 'TorrentList',
  data() {
    return {
      queriedTorrents: [],           // 查询结果（静态）
      activeTorrentsInQuery: [],     // 活跃种子（动态）
      activeTotalInQuery: 0,         // 活跃种子总数
      activeHashSpeedMap: {},        // 速度映射
      currentPage: 1,
      pageSize: 20,
      speedTimer: null
    }
  },
  
  computed: {
    // 当前页的完整种子列表
    currentPageTorrents() {
      const active = this.activeTorrentsInQuery.slice(0, this.activeCountInCurrentPage)
      const inactive = this.inactiveTorrentsInCurrentPage
      return [...active, ...inactive]
    }
  },
  
  mounted() {
    this.loadData()
    this.startSpeedPolling()
  },
  
  beforeDestroy() {
    this.stopSpeedPolling()
  },
  
  methods: {
    // 加载查询结果（静态）
    async loadQueriedTorrents() { },
    
    // 加载活跃种子（动态）
    async loadActiveTorrentsForCurrentPage() { },
    
    // 启动轮询
    startSpeedPolling() { },
    
    // 停止轮询
    stopSpeedPolling() { }
  }
}
</script>
```

**性能目标**:
- 1秒轮询不卡顿
- 内存增长 < 20MB/h
- 定时器正确清理

---

## 📝 技术决策

### 决策 1: 虚拟分页算法

**时间**: 2026-04-22

**问题**: 如何在查询结果内实现活跃种子优先的分页？

**方案**: 前端虚拟分页

**算法**:
```
输入: 
- 查询结果: 100个种子
- 活跃种子: 25个
- 每页数量: 20个

第1页:
  - 活跃种子: min(25, 20) = 20个
  - 非活跃种子: 0个

第2页:
  - 活跃种子: min(25-20, 20) = 5个
  - 非活跃种子: 20 - 5 = 15个

第3页:
  - 活跃种子: 0个
  - 非活跃种子: 20个
```

**实现**:
```javascript
computed: {
  activeCountInCurrentPage() {
    const startIdx = (this.currentPage - 1) * this.pageSize
    const endIdx = startIdx + this.pageSize
    
    if (this.activeTotalInQuery >= endIdx) {
      return this.pageSize  // 当前页全是活跃
    }
    
    if (this.activeTotalInQuery > startIdx) {
      return this.activeTotalInQuery - startIdx  // 剩余活跃
    }
    
    return 0  // 当前页无活跃
  }
}
```

### 决策 2: 1秒轮询优化

**时间**: 2026-04-22

**问题**: 如何避免轮询导致页面卡顿？

**方案**: 防抖 + 版本控制

**实现**:
```javascript
data() {
  return {
    pendingUpdate: false,  // 防止重复请求
    dataVersion: 0         // 数据版本号
  }
},

methods: {
  async loadActiveTorrentsForCurrentPage() {
    // 防止重复请求
    if (this.pendingUpdate) return
    
    this.pendingUpdate = true
    try {
      const response = await getActiveTorrents(params)
      this.activeTorrentsInQuery = response.data.torrents
      this.dataVersion++  // 更新版本
    } finally {
      this.pendingUpdate = false
    }
  }
}
```

---

## ⚠️ 已知问题

### 无（新功能）

---

## 🔧 阻塞与依赖

### 当前阻塞
无

### 依赖文件
- `src/api/torrents.ts` - API 接口（需先扩展）
- `src/utils/request.js` - HTTP 请求工具

---

## 📈 性能指标

### 目标指标

| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| 1秒轮询性能 | 不卡顿 | - | ⏳ 待测试 |
| 内存增长 | < 20MB/h | - | ⏳ 待测试 |
| 定时器清理 | 无泄漏 | - | ⏳ 待测试 |
| 首屏渲染 | < 2s | - | ⏳ 待测试 |

### 测试方法

```javascript
// 在浏览器控制台运行

// 1. 监控内存
let snapshots = []
setInterval(() => {
  const memory = performance.memory
  snapshots.push(memory.usedJSHeapSize / 1024 / 1024)
  console.log(`内存: ${memory.usedJSHeapSize / 1024 / 1024} MB`)
}, 10000)

// 2. 检查定时器
setTimeout(() => {
  console.log('定时器数量:', window.setInterval.toString().length)
}, 60000)

// 3. 查看内存增长趋势
console.log(snapshots.map((v, i) => i * 10 + 's: ' + v.toFixed(2) + 'MB').join('\n'))
```

---

## 🧪 测试场景

### 前端测试场景

1. **无查询 + 有活跃**
   - 预期: 活跃种子优先显示

2. **有查询 + 有活跃**
   - 预期: 查询结果内活跃种子优先

3. **有查询 + 无活跃**
   - 预期: 显示查询结果，按默认排序

4. **翻页功能**
   - 预期: 跨类型分页正确

5. **1秒轮询**
   - 预期: 速度数据每秒更新，页面不卡顿

6. **定时器清理**
   - 预期: 离开页面后定时器停止

7. **快速翻页**
   - 预期: 快速翻页时数据正确

8. **空状态**
   - 预期: 无数据时显示提示

**状态**: ⏳ 待实现

---

## 🔄 会话交接信息

### 下次继续时

**当前位置**: 前端组件改造待实现

**下一步行动**:
1. 扩展 `src/api/torrents.ts` 添加速度 API
2. 改造 `src/views/torrents/index.vue` 核心逻辑
3. 实现虚拟分页算法
4. 实现1秒轮询
5. 实现定时器清理

**参考文件**:
- `src/views/torrents/index.vue` - 现有组件
- `src/api/torrents.ts` - 现有 API
- `src/components/` - 可复用组件

**关键约束**:
- Vue 2 Options API 风格
- 统一响应格式处理
- 异步操作保存 this
- 定时器必须清理

---

## 📚 参考资料

### 内部文档
- `AGENTS.md` - 前端工作流
- `CLAUDE.md` - 前端技术约束
- `docs/constraints/api-response-format.md` - API 响应格式
- `docs/constraints/vue-async-context.md` - 异步上下文

### 代码参考
- `src/views/torrents/index.vue` - 现有组件结构
- `src/views/downloader/index.vue` - 下载器页面示例
- `src/components/` - 可复用组件

### 外部文档
- Vue 2: https://v2.vuejs.org/
- Element UI: https://element.eleme.io/
- TypeScript: https://www.typescriptlang.org/

---

## 💡 开发技巧

### Vue DevTools 使用

```bash
# 安装 Vue DevTools
Chrome: https://chrome.google.com/webstore
Firefox: https://addons.mozilla.org/

# 使用技巧
1. 查看 data 状态
2. 查看 computed 依赖
3. 查看 events 事件流
4. 性能分析
```

### 性能分析

```javascript
// 在代码中添加性能标记
console.time('loadActiveTorrents')
await this.loadActiveTorrents()
console.timeEnd('loadActiveTorrents')

// 输出: loadActiveTorrents: 123.45ms
```

### 调试定时器

```javascript
// 在组件中添加调试信息
beforeDestroy() {
  console.log('清理定时器:', this.speedTimer)
  if (this.speedTimer) {
    clearInterval(this.speedTimer)
    this.speedTimer = null
    console.log('定时器已清理')
  }
}
```

---

**最后更新**: 2026-04-22
**下次更新**: 前端组件实现完成后
