export interface PostSummary {
  id: number
  title: string
  slug: string
  excerpt: string | null
  thumbnailUrl: string | null
  publishedAt: string | null
  authorName: string
  categoryName: string
  categorySlug: string
  viewCount: number
  commentCount: number
}

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
  commentCount: number
}

export interface Comment {
  id: number
  authorName: string
  content: string
  isApproved: boolean
  createdAt: string
  postId: number
  postTitle: string
}
