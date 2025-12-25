const API_BASE = 'http://localhost:3000/api'

export const api = {
  // 获取所有图片
  async getImages(category?: string, search?: string) {
    const params = new URLSearchParams()
    if (category && category !== 'all') params.append('category', category)
    if (search) params.append('search', search)
    
    const response = await fetch(`${API_BASE}/images?${params}`)
    return response.json()
  },

  // 获取单张图片
  async getImage(id: number) {
    const response = await fetch(`${API_BASE}/images/${id}`)
    return response.json()
  },

  // 上传图片
  async uploadImage(formData: FormData) {
    const response = await fetch(`${API_BASE}/images`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  },

  // 更新图片信息
  async updateImage(id: number, data: any) {
    const response = await fetch(`${API_BASE}/images/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  },

  // 删除图片
  async deleteImage(id: number) {
    const response = await fetch(`${API_BASE}/images/${id}`, {
      method: 'DELETE'
    })
    return response.json()
  },

  // 获取分类列表
  async getCategories() {
    const response = await fetch(`${API_BASE}/categories`)
    return response.json()
  },

  // 添加分类
  async addCategory(category: string) {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    })
    return response.json()
  },

  // 获取统计信息
  async getStats() {
    const response = await fetch(`${API_BASE}/stats`)
    return response.json()
  }
}
