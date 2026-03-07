# CLAUDE.md - BTDeck前端项目

为Claude Code提供前端开发指导，专注于Vue 2 + TypeScript技术栈和最佳实践。

## 1. 项目认知框架

### 项目定位与价值
**BTDeck**是一个全栈Web应用，为用户提供多种BitTorrent客户端(qBittorrent、Transmission)的统一管理界面。

**核心用户价值**：
- 统一管理多个下载器，避免切换不同客户端
- 提供Web界面，支持远程管理和移动设备访问
- 后台任务调度，实现自动化下载管理
- 实时状态监控，及时获取下载进度和问题预警

**关键业务目标**：
- 支持1000+并发下载任务管理
- API响应时间<200ms，界面操作流畅
- 多用户安全访问，支持权限控制
- 7x24小时稳定运行，自动故障恢复

### 技术挑战与解决方案
| 挑战 | 解决方案 |
|------|----------|
| 多协议适配 | 统一下载器接口，支持qBittorrent API和Transmission RPC |
| 实时状态同步 | WebSocket推送 + 后台定时任务双重保障 |
| 高并发处理 | FastAPI异步框架 + SQLAlchemy连接池 |
| 数据安全 | JWT认证 + TOTP二次验证 + 敏感数据SM4加密 |

## 2. 开发工作约束

### 2.1 代码简洁性原则

✅ **追求代码简洁、模块化、可复用，避免过度复杂**

**核心原则**：代码应该足够简洁、模块化，可以直接复用，无须关心内部过程，并非越多越好。

**实现标准**：
1. **简洁性优先**：用最少的代码实现功能，避免不必要的复杂性
2. **模块化设计**：每个模块只做一件事，职责单一明确
3. **封装内部实现**：使用者只需知道"做什么"，无需了解"怎么做"
4. **可复用性第一**：通用功能提取为公共模块，避免重复代码
5. **拒绝过度工程**：不预支未来需求，不添加当前不需要的功能

**判断标准**：
- ✅ 代码行数减少 = 更好（在不损失可读性的前提下）
- ✅ 一个函数能完成 = 绝不拆成两个
- ✅ 现有组件能满足 = 绝不创建新组件
- ❌ 为了"可能将来需要"而添加功能 = 错误
- ❌ 代码"看起来很专业"但实际没用 = 错误

**示例**：

```
✅ 简洁：封装好的按钮组件，直接使用
<SubmitButton @click="handleSubmit" />

❌ 冗余：每次都写完整按钮逻辑
<el-button @click="handleSubmit" :loading="loading" :disabled="disabled">
 {{ buttonText }}
</el-button>
```

**遵循原则**：KISS（保持简单）、DRY（不重复）、YAGNI（不做不需要的事）

### 2.2 交互模式（必读）

🔴 **开始任务前，必须先提出实现假设并获得确认**

- **步骤 1**：分析需求，提出你的实现假设
 - 使用的框架和类库
 - 架构设计方案
 - 涉及的关键文件和模块
- **步骤 2**：检查假设之间的矛盾关系
 - 技术栈兼容性
 - 架构设计一致性
 - 与现有代码的冲突
- **步骤 3**：等待用户确认后再开始编码
 - 不要假设用户会接受你的方案
 - 重大变更必须获得明确批准

**示例**：

```
❌ 错误：直接开始编码
✅ 正确："我计划使用 Vuex 创建新的 module 来管理会话状态，
      会修改 src/store/modules/session.ts，这样设计符合吗？"
```

### 2.3 代码复用优先

✅ **优先复用现有代码和类，仅在必要时创建新的**

- **检查清单**：
 1. 搜索项目中是否已有相似功能
 2. 检查是否可以扩展现有组件/函数
 3. 评估复用 vs 新增的成本
- **创建新代码的条件**：
 - 现有代码无法满足需求
 - 扩展现有代码会导致复杂度显著增加
 - 新代码有明确的复用价值

**示例**：

```
✅ 优先：使用现有的 useSettingsStore 状态管理模式
✅ 优先：复用 ProviderForm 组件的表单验证逻辑
❌ 避免：创建功能重复的工具函数
```

### 2.4 问题澄清机制

❓ **遇到不清楚的细节时，主动提问获取补充信息**

- **必须提问的场景**：
 - 需求描述模糊或存在歧义
 - 多种实现方案，需要用户决策
 - 涉及架构变更或影响现有功能
 - 不确定业务逻辑或数据流向
- **提问方式**：
 - 描述当前理解
 - 列出可选方案及优劣
 - 推荐方案并说明理由
 - 等待用户决策

**示例**：

```
❌ 错误：自行猜测需求并实现
✅ 正确："你希望提供商列表支持搜索功能吗？
      我建议在前端实现过滤，无需后端修改，性能也更好。
      是否需要我实现这个方案？"
```

### 2.5 API响应格式规范

**所有前端开发者必须严格遵守以下API响应格式规范！**

#### 标准API响应格式

```typescript
interface APIResponse<T = any> {
  code: string;      // 状态码 (200, 401, 403, 422, 500)
  msg: string;       // 接口返回信息
  data: T;           // 接口返回数据
  status: string;    // 接口返回状态描述
}
```

#### 分页响应接口定义（强制）

```typescript
// ✅ 正确的分页响应接口定义
export interface PaginatedResponse<T> {
  total: number
  page: number
  pageSize: number   // ✅ 必须使用pageSize（驼峰命名）
  list: T[]          // ✅ 必须使用list（小写）
}
```

**分页字段定义（强制要求）**：
- **total**: 总记录数（`number`类型）
- **page**: 当前页码（`number`类型，从1开始）
- **pageSize**: 每页记录数（`number`类型）
  - ❌ **严禁使用** `page_size`、`Page_Size`等其他变体
  - ❌ **严禁使用** `limit`、`size`、`per_page`等其他命名
  - ✅ **必须使用** `pageSize`（驼峰命名）
- **list**: 数据列表数组（`Array<T>`类型）
  - ❌ **严禁使用** `items`、`data`、`results`等其他命名
  - ❌ **严禁使用** `rows`、`records`等其他变体
  - ✅ **必须使用** `list`（小写）

#### 前端数据解析规范（强制）

```typescript
// ✅ 正确的前端数据解析
const res = await getSomeList(params)
if (res.code === '200') {
  this.tableData = res.data.list   // ✅ 必须使用list
  this.total = res.data.total
  this.page = res.data.page
  this.pageSize = res.data.pageSize
}

// ❌ 错误示例（严禁使用）
const res = await getSomeList(params)
if (res.code === '200') {
  this.tableData = res.data.items  // ❌ 错误：使用了items
  this.total = res.data.total
}
```

**历史教训**：
- ❌ 2025-01-27: Tracker模块因使用 `items` 和 `page_size` 导致查询无数据问题
- ❌ 修复耗时：30分钟
- ❌ 影响范围：关键词管理、消息记录两个模块

### 2.6 Git操作规范

🔧 **前端项目独立管理，Git操作必须在项目根目录执行**

**Git操作流程**：

```bash
# 1. 查看当前状态
git status

# 2. 添加修改的文件
git add .

# 3. 提交代码（使用约定式提交格式）
git commit -m "feat: 添加XX功能"

# 4. 推送到远程仓库
git push origin feature-branch
```

**提交信息格式**（Conventional Commits）：
```
feat: 新增功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构代码
test: 测试相关
chore: 构建/工具链更新
```

**⚠️ 注意事项**：
- ✅ 提交前确保代码通过 ESLint 检查
- ✅ 提交前确保功能测试通过
- ✅ 提交信息清晰描述变更内容

## 3. 前端常见陷阱

### 3.1 快速交付思维：忽视用户体验一致性

1. **UI组件统一使用**：优先使用Element UI组件，保持界面风格一致
2. **交互模式统一**：遵循现有的交互模式（如确认对话框、加载状态等）

### 3.2 缺乏组件意识：重复实现已有功能

1. **优先使用现有组件**：在创建新组件前，先搜索项目中是否已有类似功能
2. **复用判断标准**：
   - 如果功能 >50% 相似，优先考虑扩展现有组件
   - 如果需要新组件，先与项目负责人确认

### 3.3 设计债务累积：临时方案演变成技术债务

1. **禁止临时方案**：除非项目负责人明确允许，否则不允许使用临时方案
2. **实现前检查清单**（必须全部满足才能开始编码）：
   - [ ] 检查是否与现有功能集成
   - [ ] 确认 UI/UX 一致性
   - [ ] 验证代码风格符合项目规范
   - [ ] 考虑错误处理和边界情况
   - [ ] 确认安全性检查（避免 XSS、注入等漏洞）
   - [ ] 确认主题适配（使用 CSS 变量，不硬编码颜色）

### 3.4 Vue异步操作中this上下文的易变性

**核心原则**:
1. **异步操作前保存快照**: 在第一个 `await` 前保存所有需要的 `this` 属性
2. **避免跨 await 使用 `this`**: 每个 `await` 块后重新读取 `this` 或使用局部变量

**示例**：

```typescript
// ❌ 错误：跨await使用this
async handleSubmit() {
  await validateForm()
  this.formData.name = 'test'  // this可能已失效
}

// ✅ 正确：异步操作前保存快照
async handleSubmit() {
  const form = this.formData  // 保存快照
  await validateForm()
  form.name = 'test'
}
```

### 3.5 使用正则表达式全文替换时的误匹配

```bash
# ❌ 危险：全文正则替换（可能破坏结构）
sed -i 's/this\.draggedKeyword/draggedKeywordCopy/g' file.vue

# ✅ 安全：逐行精确替换 + 语法验证
sed -i '270s/this\.draggedKeyword\.keyword_id/draggedKeywordCopy.keyword_id/' file.vue
npm run lint  # 立即验证语法
```

## 4. 前端架构与最佳实践

### 4.1 技术栈

- **Node.js**: 18.20.1（开发环境指定版本）
- **框架**: Vue 2.6.12 + TypeScript
- **UI组件库**: Element UI 2.15.13
- **状态管理**: Vuex 3.6.2（使用vuex-module-decorators）
- **路由管理**: Vue Router 3.5.3
- **HTTP客户端**: Axios 0.27.2
- **代码编辑器**: Monaco Editor 0.34.1
- **构建工具**: Vue CLI 4.5.12

### 4.2 项目结构

```
btpManager_fronted/
├── public/              # 静态资源
├── src/
│   ├── api/            # API接口定义
│   ├── components/     # 通用组件
│   ├── router/         # 路由配置
│   ├── store/          # Vuex状态管理
│   ├── styles/         # 全局样式
│   ├── utils/          # 工具函数
│   ├── views/          # 页面组件
│   ├── App.vue         # 根组件
│   ├── main.ts         # 入口文件
│   └── permission.ts   # 路由守卫
├── package.json        # 依赖配置
├── tsconfig.json       # TypeScript配置
└── vue.config.js       # Vue CLI配置
```

### 4.3 认证和权限系统

- **Token认证**: 使用`X-Access-Token`请求头进行JWT认证
- **权限控制**: `src/permission.ts`实现路由守卫和权限验证
- **用户状态**: `src/store/modules/user.ts`管理用户信息和登录状态
- **重定向机制**: 未登录用户自动跳转到登录页面，携带redirect参数

### 4.4 HTTP请求架构

- **统一实例**: `src/utils/request.ts`配置axios实例和拦截器
- **拦截器**: 自动处理token、错误响应和加载状态
- **环境配置**: 通过`VUE_APP_BASE_API`环境变量配置API地址
- **错误处理**: 统一处理后端API响应格式

### 4.5 状态管理模式

- **装饰器模式**: 使用vuex-module-decorators实现类风格的Vuex模块
- **动态注册**: 支持模块的动态加载和注册
- **类型安全**: TypeScript接口定义确保状态类型安全
- **模块化**: 按功能域划分状态模块(app/ui, user/auth等)

### 4.6 路由系统

- **布局路由**: 基于布局的嵌套路由结构
- **元数据**: 路由配置包含标题、图标、权限等信息
- **懒加载**: 组件按需加载，优化首屏性能
- **权限守卫**: 基于用户权限的路由访问控制
- **404处理**: 统一的404页面和重定向逻辑

### 4.7 UI组件和样式系统

- **Element UI**: 基于Element UI 2.15.13组件库
- **自定义主题**: 使用`@/styles/element-variables.scss`定制Element UI主题
- **全局样式**: `@/styles/index.scss`定义全局样式变量
- **SCSS混入**: 通过style-resources-loader自动导入变量和混入
- **SVG图标**: `npm run svg`命令将SVG文件转换为Vue组件
- **自定义指令**: waves指令提供点击波纹效果

## 5. 开发工作流

### 5.1 本地开发启动

```bash
# 1. 安装依赖（首次或依赖更新时）
npm install

# 2. 启动开发服务
npm run serve

# 3. 浏览器访问
# 打开 http://localhost:8080
```

### 5.2 代码检查与格式化

```bash
# ESLint代码检查
npm run lint

# ESLint自动修复
npm run lint:fix
```

### 5.3 生产构建

```bash
# 构建生产版本
npm run build

# 构建产物在 dist/ 目录
# 可部署到nginx等Web服务器
```

### 5.4 环境配置

```bash
# 开发环境 (.env.development)
VUE_APP_BASE_API=http://localhost:5001
VUE_APP_TITLE=BitTorrent管理器

# 生产环境 (.env.production)
VUE_APP_BASE_API=/api
VUE_APP_TITLE=BitTorrent管理器
```

### 5.5 协同开发流程

1. **启动顺序**：先启动后端服务（http://localhost:5001），再启动前端服务
2. **环境验证**：
   - 访问后端API文档：http://localhost:5001/docs
   - 访问前端界面：http://localhost:8080
3. **登录测试**：使用测试用户登录前端界面
4. **API调试**：使用浏览器开发者工具查看网络请求
5. **实时功能**：测试WebSocket连接和状态更新

## 6. 防御性编程与最佳实践

### 6.1 防御性编程原则

- **永不信任外部输入**：包括API响应、用户输入
- **提供默认值**：当数据不符合预期时，使用安全的降级策略
- **日志记录**：在开发环境输出验证失败的警告

### 6.2 提高代码复用意识

- 实现功能前，优先检查是否存在已实现相同功能的方法
- 通用功能提取为公共组件或工具函数
- 避免在不同页面重复实现相同逻辑

### 6.3 公共变量先行

**原则**: 在创建新页面/组件前，先检查是否可复用现有变量

- [ ] 检查 `styles/variables.scss` 是否已有所需变量
- [ ] 新增公共变量需评审是否真正"特有"
- [ ] 页面特定变量添加前缀（如 `--page-xxx-*`）

### 6.4 前后端类型定义一致性

- 使用TypeScript接口定义API请求和响应类型
- 与后端API文档保持同步
- 考虑使用OpenAPI/Swagger自动生成TypeScript类型
- 避免手动维护两套类型定义

### 6.5 完整的测试覆盖

- **单元测试**：组件逻辑、工具函数
- **集成测试**：完整的前后端交互链路
- **端到端测试**：使用Cypress或Playwright进行E2E测试

## 7. 开发调试技巧

### 7.1 浏览器开发工具

- **Vue DevTools**: 组件状态和调试
- **网络面板**: API请求和响应监控
- **控制台**: 错误日志和调试输出

### 7.2 常用开发命令

```bash
# 类型检查
npx vue-tsc --noEmit

# 代码格式化
npm run lint --fix

# 依赖分析
npm why [package-name]

# 端口占用检查
netstat -ano | findstr :8080
```

## 8. 版本更新与维护

### 8.1 依赖更新

```bash
# 检查过时的依赖
npm outdated

# 更新依赖
npm update
```

### 8.2 文档维护

- 遇到文档未覆盖的场景，请记录并更新
- 确保团队知识积累和传承
- 重大架构变更需及时更新此文档

---

**开发协作**: 前端开发人员应共同维护此文档，及时更新架构变更和最佳实践。
**问题反馈**: 遇到文档未覆盖的场景，请记录并更新，确保团队知识积累。
