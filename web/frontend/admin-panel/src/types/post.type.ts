export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  thumbnailUrl: string | null
  status: string
  viewCount: number
  createdAt: string
  publishedAt: string | null
  authorName: string
  categoryName: string
  categorySlug: string
  categoryId?: number
  commentCount: number
}

export interface CreatePostRequest {
  title: string
  content: string
  excerpt?: string
  thumbnailUrl?: string
  status: string
  categoryId: number
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  postCount: number
}
