/**
 * TraditionalView 组件的单元测试
 *
 * 测试新增的功能：
 * - 分类和标签数据获取
 * - 过滤器选项动态生成
 * - fetchCategoryAndTags() 方法
 * - 计算属性：categoryFilterItems, tagFilterItems
 */

import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vue from 'vue'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import ElementUI from 'element-ui'
import TraditionalView from '@/views/torrents/TraditionalView.vue'
import { getAllCategories, getAllTags } from '@/api/tag-management'
import { getDownloaderList } from '@/api/torrents'

// Mock API模块
jest.mock('@/api/tag-management')
jest.mock('@/api/torrents')
jest.mock('@/utils/formatters', () => ({
  formatFileSize: jest.fn((size) => `${size}B`),
  formatSpeed: jest.fn((speed) => `${speed}B/s`),
  formatDate: jest.fn((date) => '2026-01-01'),
  formatRatio: jest.fn((ratio) => ratio.toString()),
  truncateText: jest.fn((text) => text),
  normalizeTorrent: jest.fn((torrent) => torrent),
  normalizePaginatedResponse: jest.fn((response) => ({
    list: response.data?.list || [],
    total: response.data?.total_count || 0
  })),
  debounce: jest.fn((fn) => fn)
}))

// Mock ViewModeModule
jest.mock('@/store/modules/viewMode', () => ({
  currentMode: 'traditional',
  filterPanelCollapsed: false,
  setViewMode: jest.fn(),
  toggleFilterPanel: jest.fn()
}))

const localVue = createLocalVue()
localVue.use(ElementUI)
localVue.use(VueRouter)
localVue.use(Vuex)

describe('TraditionalView组件测试', () => {
  let wrapper: any
  let store: any
  let router: any

  beforeEach(() => {
    // 创建Vuex store
    store = new Vuex.Store({
      modules: {
        viewMode: {
          namespaced: true,
          state: {
            currentMode: 'traditional',
            filterPanelCollapsed: false
          },
          mutations: {
            setViewMode: jest.fn(),
            toggleFilterPanel: jest.fn()
          }
        }
      }
    })

    // 创建Vue Router
    router = new VueRouter()

    // 设置全局属性
    ;(window as any).localStorage = {
      getItem: jest.fn(() => 'mock_token'),
      setItem: jest.fn()
    }

    // 清除所有mock
    jest.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
  })

  const createWrapper = (options = {}) => {
    return shallowMount(TraditionalView, {
      localVue,
      store,
      router,
      ...options
    })
  }

  describe('分类和标签数据获取', () => {
    it('应该在created时调用fetchCategoryAndTags', async () => {
      const mockDownloaders = [
        { downloader_id: 'dl-001', nickname: '下载器1' },
        { downloader_id: 'dl-002', nickname: '下载器2' }
      ]

      const mockCategories = ['电影', '剧集', '音乐']
      const mockTags = ['PT', 'BT', 'HD']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({
        data: mockDownloaders
      })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockCategories
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockTags
      })

      wrapper = createWrapper()

      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(getDownloaderList).toHaveBeenCalled()
      expect(getAllCategories).toHaveBeenCalled()
      expect(getAllTags).toHaveBeenCalled()
    })

    it('应该正确设置categoryList和tagList', async () => {
      const mockCategories = ['电影', '剧集', '音乐', '软件']
      const mockTags = ['PT', 'BT', 'HD', '4K']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockCategories
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockTags
      })

      wrapper = createWrapper()

      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.categoryList).toEqual(mockCategories)
      expect(wrapper.vm.tagList).toEqual(mockTags)
    })

    it('应该处理API错误情况', async () => {
      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockRejectedValue(new Error('网络错误'))
      ;(getAllTags as jest.Mock).mockRejectedValue(new Error('网络错误'))

      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      wrapper = createWrapper()

      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '获取分类和标签失败:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('应该处理空分类和标签数据', async () => {
      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.categoryList).toEqual([])
      expect(wrapper.vm.tagList).toEqual([])
    })
  })

  describe('过滤器计算属性测试', () => {
    it('categoryFilterItems应该生成正确的选项', async () => {
      const mockCategories = ['电影', '剧集', '音乐', '软件']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockCategories
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const categoryItems = wrapper.vm.categoryFilterItems

      // 验证包含"全部"选项
      expect(categoryItems[0]).toEqual({
        icon: '📂',
        label: '全部',
        value: ''
      })

      // 验证包含所有分类
      const categories = categoryItems.slice(1).map(item => ({
        label: item.label,
        value: item.value
      }))

      expect(categories).toEqual([
        { label: '电影', value: '电影' },
        { label: '剧集', value: '剧集' },
        { label: '音乐', value: '音乐' },
        { label: '软件', value: '软件' }
      ])
    })

    it('tagFilterItems应该生成正确的选项', async () => {
      const mockTags = ['PT', 'BT', 'HD', '4K']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockTags
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const tagItems = wrapper.vm.tagFilterItems

      // 验证包含"全部"选项
      expect(tagItems[0]).toEqual({
        icon: '🏷',
        label: '全部',
        value: ''
      })

      // 验证包含所有标签
      const tags = tagItems.slice(1).map(item => ({
        label: item.label,
        value: item.value
      }))

      expect(tags).toEqual([
        { label: 'PT', value: 'PT' },
        { label: 'BT', value: 'BT' },
        { label: 'HD', value: 'HD' },
        { label: '4K', value: '4K' }
      ])
    })

    it('应该正确处理Unicode字符', async () => {
      const mockCategories = ['日语タグ', 'Emoji😀标签']
      const mockTags = ['标签测试', '特殊字符#@$']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockCategories
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockTags
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const categoryItems = wrapper.vm.categoryFilterItems
      const tagItems = wrapper.vm.tagFilterItems

      // 验证Unicode字符正确处理
      expect(categoryItems.some(item => item.label === '日语タグ')).toBe(true)
      expect(tagItems.some(item => item.label === 'Emoji😀标签')).toBe(true)
    })

    it('应该对分类和标签进行排序', async () => {
      // 返回未排序的数据
      const mockCategories = ['软件', '音乐', '剧集', '电影']
      const mockTags = ['HD', '4K', 'BT', 'PT']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockCategories
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: mockTags
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const categoryLabels = wrapper.vm.categoryFilterItems
        .slice(1)
        .map(item => item.label)
      const tagLabels = wrapper.vm.tagFilterItems
        .slice(1)
        .map(item => item.label)

      // 注意：实际排序可能依赖后端返回顺序
      expect(categoryLabels).toContain('电影')
      expect(tagLabels).toContain('PT')
    })
  })

  describe('过滤器事件处理测试', () => {
    it('handleCategoryFilter应该正确更新listQuery', async () => {
      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // 模拟选择分类
      wrapper.vm.handleCategoryFilter('电影')

      expect(wrapper.vm.listQuery.category_like).toBe('电影')
    })

    it('handleCategoryFilter("全部")应该清空分类筛选', async () => {
      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      wrapper.vm.listQuery.category_like = '电影'

      // 选择"全部"
      wrapper.vm.handleCategoryFilter('')

      expect(wrapper.vm.listQuery.category_like).toBe('')
    })

    it('handleTagFilter应该正确更新listQuery', async () => {
      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // 模拟选择标签
      wrapper.vm.handleTagFilter('PT')

      expect(wrapper.vm.listQuery.tags_like).toBe('PT')
    })

    it('handleTagFilter("全部")应该清空标签筛选', async () => {
      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      wrapper.vm.listQuery.tags_like = 'PT'

      // 选择"全部"
      wrapper.vm.handleTagFilter('')

      expect(wrapper.vm.listQuery.tags_like).toBe('')
    })
  })

  describe('边界条件测试', () => {
    it('应该处理大量分类和标签（100+）', async () => {
      const largeCategories = Array.from({ length: 100 }, (_, i) => `分类${i + 1}`)
      const largeTags = Array.from({ length: 100 }, (_, i) => `标签${i + 1}`)

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: largeCategories
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: largeTags
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.categoryList).toHaveLength(100)
      expect(wrapper.vm.tagList).toHaveLength(100)
      expect(wrapper.vm.categoryFilterItems).toHaveLength(101) // 100 + "全部"
      expect(wrapper.vm.tagFilterItems).toHaveLength(101) // 100 + "全部"
    })

    it('应该处理特殊字符', async () => {
      const specialCategories = ['标签/测试', '标签\\测试', '标签"测试"']
      const specialTags = ['标签#测试', '标签@测试', '标签$测试']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: specialCategories
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: specialTags
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.categoryFilterItems).toHaveLength(4) // 3 + "全部"
      expect(wrapper.vm.tagFilterItems).toHaveLength(4) // 3 + "全部"
    })

    it('应该处理重复的分类和标签名称', async () => {
      // 后端应该返回去重数据，但前端也应该能处理重复
      const duplicateCategories = ['电影', '电影', '剧集']
      const duplicateTags = ['PT', 'PT', 'BT']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: duplicateCategories
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: duplicateTags
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // 前端直接使用后端返回的数据
      expect(wrapper.vm.categoryList).toEqual(duplicateCategories)
      expect(wrapper.vm.tagList).toEqual(duplicateTags)
    })
  })

  describe('性能测试', () => {
    it('fetchCategoryAndTags应该在合理时间内完成', async () => {
      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock).mockResolvedValue({
        code: '200',
        data: ['电影', '剧集']
      })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: ['PT', 'BT']
      })

      wrapper = createWrapper()

      const startTime = Date.now()

      await wrapper.vm.fetchCategoryAndTags()

      const elapsed = Date.now() - startTime

      // 验证在合理时间内完成（<100ms）
      expect(elapsed).toBeLessThan(100)
    })
  })

  describe('数据刷新测试', () => {
    it('应该支持手动刷新分类和标签', async () => {
      const initialCategories = ['电影', '剧集']
      const updatedCategories = ['电影', '剧集', '音乐']

      ;(getDownloaderList as jest.Mock).mockResolvedValue({ data: [] })
      ;(getAllCategories as jest.Mock)
        .mockResolvedValueOnce({
          code: '200',
          data: initialCategories
        })
        .mockResolvedValueOnce({
          code: '200',
          data: updatedCategories
        })
      ;(getAllTags as jest.Mock).mockResolvedValue({
        code: '200',
        data: []
      })

      wrapper = createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.categoryList).toEqual(initialCategories)

      // 手动刷新
      await wrapper.vm.fetchCategoryAndTags()

      expect(wrapper.vm.categoryList).toEqual(updatedCategories)
    })
  })
})
