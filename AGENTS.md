# AGENTS.md - BTDeck 前端项目

> **项目**: BTDeck 前端应用
> **技术栈**: Vue 2.6.12 | TypeScript 4.x | Element UI 2.15.13
> **更新**: 2026-04-22

---

## 🎯 项目定位

BTDeck 前端提供统一的 BitTorrent 客户端管理界面。

**核心价值**:
- 统一的多下载器管理界面
- 种子列表展示与操作
- 实时状态监控
- 批量操作支持

---

## 🚀 启动工作流

### 开始任何工作前，按顺序执行：

```
1. 阅读 AGENTS.md（本文件） ← 你在这里
2. 阅读 CLAUDE.md（前端技术约束）
3. 阅读 docs/constraints/（详细规范）
4. 检查 ../feature_list.json（当前功能状态）
5. 阅读 ../progress.md（会话上下文）
6. 运行 ./scripts/init.sh（验证环境）
```

### 识别当前任务

```bash
# 查看当前进行中的前端任务
cat ../feature_list.json | jq '.features[].tasks[] | select(.status == "in-progress")'

# 查看最近进度
cat ../progress.md | tail -30
```

---

## 📋 工作规则

### 1. Vue 2 Options API（强制）

**必须使用 Options API 风格**:

```vue
<script>
export default {
  name: 'ComponentName',
  components: { /* ... */ },
  props: { /* ... */ },
  data() {
    return {
      // 数据
    }
  },
  computed: {
    // 计算属性
  },
  watch: {
    // 监听器
  },
  mounted() {
    // 生命周期
  },
  beforeDestroy() {
    // 清理逻辑
  },
  methods: {
    // 方法
  }
}
</script>
```

**禁止**:
- ❌ 使用 Vue 3 Composition API
- ❌ 使用 `<script setup>`

### 2. API 响应格式处理（强制）

**必须处理统一响应格式**:

```typescript
// API 返回格式
interface CommonResponse<T> {
  status: string      // 'success' | 'error' | 'failed'
  msg: string         // 消息
  code: string        // '200' | '400' | '500'
  data: T             // 数据
}

// 分页数据格式
interface PaginatedData<T> {
  total: number       // 总数（固定字段名）
  list: T[]          // 列表（固定字段名）
}

// ✅ 正确：解构响应
const { data } = await getTorrentList(params)
const torrentList = data.list || []
const totalCount = data.total || 0

// ❌ 错误：假设字段名
const items = response.data.items  // 字段名错误
```

### 3. TypeScript 类型定义（强制）

**必须定义完整的接口类型**:

```typescript
// ✅ 正确：完整的类型定义
export interface Torrent {
  infoId: string
  downloaderId: string
  hash: string
  name: string
  downloadSpeed?: number | null
  uploadSpeed?: number | null
}

export interface TorrentListParams {
  downloader_id?: string | string[]
  name_like?: string
  skip?: number
  limit?: number
}

// ❌ 错误：使用 any
function handleTorrent(torrent: any) {
  // 失去类型检查
}
```

### 4. 异步操作中的 this 上下文（强制）

**在第一个 `await` 前保存 `this` 属性**:

```javascript
// ✅ 正确：保存 this 引用
async loadData() {
  const vm = this  // 保存 this
  vm.loading = true
  
  try {
    const response = await getTorrentList(vm.listQuery)
    vm.torrents = response.data.list
  } finally {
    vm.loading = false
  }
}

// ❌ 错误：直接使用 this
async loadData() {
  this.loading = true
  
  try {
    const response = await getTorrentList(this.listQuery)
    this.torrents = response.data.list  // 可能已丢失 this
  } finally {
    this.loading = false
  }
}
```

### 5. 定时器清理（强制）

**必须在 `beforeDestroy` 中清理定时器**:

```javascript
export default {
  data() {
    return {
      timer: null
    }
  },
  
  mounted() {
    // 创建定时器
    this.timer = setInterval(() => {
      this.loadData()
    }, 1000)
  },
  
  beforeDestroy() {
    // ✅ 必须清理定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
```

### 6. 代码复用优先

**复用检查清单**:
- [ ] 检查 `src/components/` 是否有现成组件
- [ ] 检查 `src/utils/` 是否有相关工具函数
- [ ] 检查相似度 > 50% 可扩展现有代码

**示例**:
```javascript
// ✅ 正确：复用现有工具
import { formatDate, formatSpeed } from '@/utils/format'

// ❌ 错误：重新实现
const formatSpeed = (speed) => {
  // 重复实现
}
```

### 7. 公共变量优先

**创建组件前检查 `styles/variables.scss`**:

```scss
// ✅ 正确：使用现有变量
.my-component {
  color: $primary-color;
  font-size: $font-size-base;
}

// ❌ 错误：硬编码值
.my-component {
  color: #409EFF;
  font-size: 14px;
}
```

---

## 📁 项目结构

```
BtDeck_fronted/
├── src/
│   ├── api/                    # API 接口定义
│   │   ├── torrents.ts         # 种子相关 API
│   │   ├── downloader.ts       # 下载器 API
│   │   └── types.d.ts          # 公共类型定义
│   ├── components/             # 通用组件
│   │   ├── BatchButton.vue     # 批量操作按钮
│   │   └── ...
│   ├── views/                  # 页面组件
│   │   ├── torrents/           # 种子管理页面
│   │   │   ├── index.vue       # 种子列表主组件
│   │   │   └── components/     # 种子相关子组件
│   │   ├── downloader/         # 下载器管理页面
│   │   └── dashboard/          # 仪表盘
│   ├── router/                 # 路由配置
│   ├── store/                  # Vuex 状态管理
│   ├── styles/                 # 全局样式
│   │   ├── variables.scss      # 公共变量
│   │   └── mixins.scss         # 公共 mixin
│   ├── utils/                  # 工具函数
│   └── main.js                 # 应用入口
├── scripts/
│   └── init.sh                 # 初始化脚本
├── package.json
└── vue.config.js
```

---

## 🔧 开发命令

### 环境管理

```bash
# 安装依赖
npm install

# 更新依赖
npm update

# 清理依赖
rm -rf node_modules package-lock.json
npm install
```

### 开发服务

```bash
# 启动开发服务（热重载）
npm run serve

# 指定端口
npm run serve -- --port 8080
```

### 代码质量

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint -- --fix

# TypeScript 检查
npm run check
```

### 生产构建

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

---

## ✅ 完成定义

### 一个组件完成当且仅当：

1. **UI 实现**: 模板、样式、交互完整
2. **类型定义**: Props、Data、Computed 有类型
3. **错误处理**: 所有异步操作有 try-catch
4. **加载状态**: 有 loading 状态显示
5. **空状态**: 有空数据提示
6. **定时器清理**: beforeDestroy 清理
7. **代码检查**: ESLint 通过
8. **浏览器测试**: Chrome、Firefox、Edge

### 性能指标

| 操作 | 目标 | 测量方法 |
|------|------|----------|
| 首屏渲染 | < 2s | Performance API |
| 组件更新 | < 100ms | Vue DevTools |
| 内存增长 | < 10MB/h | Chrome DevTools |

---

## 🚨 风险与已知问题

### 当前风险

1. **内存泄漏**
   - 缓解: 严格的定时器清理
   - 缓解: 事件监听器解绑

2. **this 上下文丢失**
   - 缓解: await 前保存 this

3. **类型定义不完整**
   - 缓解: 使用 strict 模式
   - 缓解: 避免使用 any

### 已知问题

- 无

---

## 📁 必需文件

| 文件 | 用途 | 更新频率 |
|------|------|----------|
| `AGENTS.md` | 前端工作流（本文件） | 稳定 |
| `CLAUDE.md` | 前端技术约束 | 稳定 |
| `docs/constraints/` | 约束详细规范（见下表） | 稳定 |

### 约束文档清单（`docs/constraints/`）

| 文件 | 约束内容 | 适用场景 |
|------|----------|----------|
| `api-response-format.md` | API 统一响应格式、分页字段名（`list`/`total`/`pageSize`） | 调用/解析任何 API 时 |
| `code-reuse.md` | 代码复用优先原则、>50% 相似度扩展 | 创建新组件/函数前 |
| `common-variables.md` | 公共 CSS 变量先行、禁止硬编码颜色值 | 编写样式时 |
| `vue-async-context.md` | Vue 2 异步操作 `this` 上下文丢失问题 | 编写 async 方法时 |

---

## 📚 参考资料

### 内部文档
- `CLAUDE.md` - 前端技术约束
- `docs/constraints/` - 详细规范文档
- `../PLANS/v1.0.4.md` - 当前功能规范

### API 文档
- 后端 API: http://localhost:5001/docs
- 前端组件: Storybook（待配置）

### 外部文档
- Vue 2: https://v2.vuejs.org/
- TypeScript: https://www.typescriptlang.org/
- Element UI: https://element.eleme.io/

---

## 🔍 快速诊断

### 遇到问题时

```bash
# 1. 检查环境
./scripts/init.sh

# 2. 查看编译错误
npm run serve

# 3. 检查类型错误
npm run check

# 4. 检查代码风格
npm run lint

# 5. 清理缓存
rm -rf node_modules/.cache
npm run serve
```

---

## 🔄 会话结束清单

### 结束前检查

1. **代码质量**
   - [ ] ESLint 通过
   - [ ] TypeScript 检查通过
   - [ ] 组件命名规范

2. **功能验证**
   - [ ] 浏览器测试通过
   - [ ] 响应式布局正常
   - [ ] 交互功能正常

3. **文档更新**
   - [ ] 更新 ../progress.md
   - [ ] 更新 ../feature_list.json
   - [ ] 添加组件注释

4. **Git 提交**
   - [ ] 仅提交前端代码
   - [ ] 提交信息清晰
   - [ ] 不包含 dist/

---

## 📞 支持与反馈

**问题报告**: GitHub Issues
**技术讨论**: 项目 Wiki
**设计规范**: Figma（待配置）

---

**最后更新**: 2026-04-22
**维护者**: BTDeck Frontend Team
