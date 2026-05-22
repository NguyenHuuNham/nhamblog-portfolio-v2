import api from './api'

export const uploadService = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<{ url: string }>('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.url
  },
}
