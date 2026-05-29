/**
 * 标签管理API的单元测试
 *
 * 测试新增的聚合接口：
 * - getAllCategories() - 获取所有分类名称
 * - getAllTags() - 获取所有标签名称
 * - getAllTagsDetailed() - 获取所有标签详细信息
 */

import { getAllCategories, getAllTags, getAllTagsDetailed, getTagList } from '@/api/tag-management'
import request from '@/utils/request'

// Mock request模块
jest.mock('@/utils/request')

describe('标签管理API测试', () => {
  beforeEach(() => {
    // 清除所有mock
    jest.clearAllMocks()
  })

  describe('getAllCategories', () => {
    it('应该成功获取所有分类名称', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: ['电影', '剧集', '音乐', '软件'],
          total_count: 4
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllCategories()

      expect(request).toHaveBeenCalledWith({
        url: '/tags/categories',
        method: 'get'
      })
      expect(result.data).toEqual(mockResponse.data)
    })

    it('应该处理空分类列表', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: [],
          total_count: 0
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllCategories()

      expect(result.data.data).toEqual([])
      expect(result.data.total_count).toBe(0)
    })

    it('应该处理API错误', async () => {
      const mockError = new Error('网络错误')
      ;(request as jest.Mock).mockRejectedValue(mockError)

      await expect(getAllCategories()).rejects.toThrow('网络错误')
    })
  })

  describe('getAllTags', () => {
    it('应该成功获取所有标签名称', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: ['PT', 'BT', 'HD', '4K'],
          total_count: 4
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTags()

      expect(request).toHaveBeenCalledWith({
        url: '/tags/tags',
        method: 'get'
      })
      expect(result.data).toEqual(mockResponse.data)
    })

    it('应该处理空标签列表', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: [],
          total_count: 0
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTags()

      expect(result.data.data).toEqual([])
    })

    it('应该处理Unicode字符', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: ['日语タグ', 'Emoji😀标签', '标签测试'],
          total_count: 3
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTags()

      expect(result.data.data).toContain('日语タグ')
      expect(result.data.data).toContain('Emoji😀标签')
    })
  })

  describe('getAllTagsDetailed', () => {
    it('应该成功获取所有标签详细信息（无筛选）', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: [
            { tag_id: 'tag-001', tag_name: '电影', tag_type: 'category', color: '#FF5733' },
            { tag_id: 'tag-002', tag_name: 'PT', tag_type: 'tag', color: '#3357FF' }
          ],
          total_count: 2
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTagsDetailed()

      expect(request).toHaveBeenCalledWith({
        url: '/tags/all',
        method: 'get',
        params: {}
      })
      expect(result.data.data).toHaveLength(2)
    })

    it('应该支持按category类型筛选', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: [
            { tag_id: 'tag-001', tag_name: '电影', tag_type: 'category', color: '#FF5733' }
          ],
          total_count: 1
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTagsDetailed('category')

      expect(request).toHaveBeenCalledWith({
        url: '/tags/all',
        method: 'get',
        params: { tag_type: 'category' }
      })
      expect(result.data.data[0].tag_type).toBe('category')
    })

    it('应该支持按tag类型筛选', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: [
            { tag_id: 'tag-002', tag_name: 'PT', tag_type: 'tag', color: '#3357FF' }
          ],
          total_count: 1
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTagsDetailed('tag')

      expect(request).toHaveBeenCalledWith({
        url: '/tags/all',
        method: 'get',
        params: { tag_type: 'tag' }
      })
      expect(result.data.data[0].tag_type).toBe('tag')
    })

    it('应该处理空结果', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: [],
          total_count: 0
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTagsDetailed()

      expect(result.data.data).toEqual([])
    })
  })

  describe('getTagList（保持兼容性）', () => {
    it('应该保持原有接口正常工作', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: [
            { tag_id: 'tag-001', tag_name: '电影', tag_type: 'category' }
          ],
          total_count: 1
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getTagList({
        downloader_id: 'dl-001',
        tag_type: 'category'
      })

      expect(request).toHaveBeenCalledWith({
        url: '/tags/list/dl-001',
        method: 'get',
        params: {
          tag_type: 'category',
          search: undefined,
          sort_by: 'created_at',
          sort_order: 'desc'
        }
      })
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('边界条件测试', () => {
    it('应该处理大数据集（100个分类）', async () => {
      const largeDataSet = Array.from({ length: 100 }, (_, i) => `分类${i + 1}`)

      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: largeDataSet,
          total_count: 100
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllCategories()

      expect(result.data.total_count).toBe(100)
      expect(result.data.data).toHaveLength(100)
    })

    it('应该处理特殊字符', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: ['标签/测试', '标签\\测试', '标签"测试"', "标签'测试'"],
          total_count: 4
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTags()

      expect(result.data.data).toHaveLength(4)
      expect(result.data.data).toContain("标签'测试'")
    })

    it('应该处理超长标签名称', async () => {
      const longTagName = 'A'.repeat(255)

      const mockResponse = {
        data: {
          status: 'success',
          code: '200',
          data: [longTagName],
          total_count: 1
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllCategories()

      expect(result.data.data[0]).toHaveLength(255)
    })
  })

  describe('错误处理测试', () => {
    it('应该处理401认证错误', async () => {
      const mockResponse = {
        data: {
          status: 'error',
          code: '401',
          msg: 'token验证失败',
          data: null
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllCategories()

      expect(result.data.status).toBe('error')
      expect(result.data.code).toBe('401')
    })

    it('应该处理500服务器错误', async () => {
      const mockResponse = {
        data: {
          status: 'error',
          code: '500',
          msg: '服务器内部错误',
          data: null
        }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getAllTags()

      expect(result.data.status).toBe('error')
      expect(result.data.code).toBe('500')
    })

    it('应该处理网络超时', async () => {
      const mockError = new Error('timeout of 10000ms exceeded')
      ;(request as jest.Mock).mockRejectedValue(mockError)

      await expect(getAllCategories()).rejects.toThrow('timeout of 10000ms exceeded')
    })
  })

  describe('并发请求测试', () => {
    it('应该支持并发请求不同接口', async () => {
      const mockCategoryResponse = {
        data: { status: 'success', code: '200', data: ['电影'], total_count: 1 }
      }
      const mockTagResponse = {
        data: { status: 'success', code: '200', data: ['PT'], total_count: 1 }
      }

      ;(request as jest.Mock)
        .mockResolvedValueOnce(mockCategoryResponse)
        .mockResolvedValueOnce(mockTagResponse)

      const [categories, tags] = await Promise.all([
        getAllCategories(),
        getAllTags()
      ])

      expect(categories.data.data).toEqual(['电影'])
      expect(tags.data.data).toEqual(['PT'])
    })

    it('应该支持同一接口的并发请求', async () => {
      const mockResponse = {
        data: { status: 'success', code: '200', data: ['电影', '剧集'], total_count: 2 }
      }

      ;(request as jest.Mock).mockResolvedValue(mockResponse)

      const promises = Array.from({ length: 5 }, () => getAllCategories())
      const results = await Promise.all(promises)

      // 所有请求都应成功
      results.forEach(result => {
        expect(result.data.status).toBe('success')
        expect(result.data.total_count).toBe(2)
      })
    })
  })
})
