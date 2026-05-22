export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: Record<string, string[]> | null
}

export interface PaginationResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}
