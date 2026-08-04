import axios from 'axios'
import type {
  ApiResponse, User, Property, Rating, RatingStats, AgentPublicProfile,
  AgentStats, AdminDashboardStats, CatalogPassword, ContactRequest,
  Favorite, PaymentInitResponse, PaymentStatus, Pagination,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ==================== AUTH ====================
export const authService = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; access_token: string }>>('/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post<ApiResponse<{ user: User; access_token: string }>>('/register', data),
  logout: () => api.post('/logout'),
  me: () => api.get<ApiResponse<{ user: User }>>('/me'),
  updateProfile: (data: Record<string, unknown>) =>
    api.put<ApiResponse<{ user: User }>>('/profile', data),
  changePassword: (current_password: string, new_password: string) =>
    api.put<ApiResponse<null>>('/password', { current_password, new_password, new_password_confirmation: new_password }),
}

// ==================== PROPERTIES ====================
export const propertyService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ properties: Property[]; pagination: Pagination }>>('/properties', { params }),
  getById: (id: number | string) =>
    api.get<ApiResponse<{ property: Property }>>(`/properties/${id}`),
  getFeatured: (limit?: number) =>
    api.get<ApiResponse<{ properties: Property[] }>>('/properties/featured', { params: { limit } }),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get<ApiResponse<{ properties: Property[] }>>('/properties/nearby', { params: { lat, lng, radius } }),
  create: (formData: FormData) =>
    api.post<ApiResponse<{ property: Property }>>('/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number | string, formData: FormData) =>
    api.post<ApiResponse<{ property: Property }>>(`/properties/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: number | string) => api.delete(`/properties/${id}`),
  getMyProperties: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ properties: Property[]; pagination: Pagination }>>('/my-properties', { params }),
}

// ==================== AGENT (PUBLIC) ====================
export const agentService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ agents: AgentPublicProfile[]; pagination: Pagination }>>('/agents', { params }),
  getById: (id: number | string) =>
    api.get<ApiResponse<{ agent: AgentPublicProfile; properties: Property[]; stats: { properties_count: number; total_views: number } }>>(`/agents/${id}`),
  getMyStats: () => api.get<ApiResponse<AgentStats>>('/agent/stats'),
}

// ==================== RATINGS ====================
export const ratingService = {
  getByAgent: (agentId: number | string, params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ agent: { id: number; name: string; rating_average: number; rating_count: number }; ratings: Rating[]; pagination: Pagination }>>(`/agents/${agentId}/ratings`, { params }),
  getStats: (agentId: number | string) =>
    api.get<ApiResponse<RatingStats>>(`/agents/${agentId}/ratings/stats`),
  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<{ rating: Rating }>>('/ratings', data),
  getPending: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ ratings: Rating[]; pagination: Pagination }>>('/ratings/pending', { params }),
  approve: (id: number | string) => api.post(`/ratings/${id}/approve`),
  reject: (id: number | string) => api.post(`/ratings/${id}/reject`),
}

// ==================== CATALOG ====================
export const catalogService = {
  verifyPassword: (password: string) =>
    api.post<ApiResponse<{ valid_until: string; time_remaining: string; uses_remaining: number }>>('/catalog/verify', { password }),
  getCatalog: (password: string) =>
    api.get<ApiResponse<{ properties: Property[]; valid_until: string; time_remaining: string }>>('/catalog', { params: { password } }),
  download: (password: string) =>
    api.get('/catalog/download', { params: { password }, responseType: 'blob' }),
  getCurrentPassword: () =>
    api.get<ApiResponse<CatalogPassword>>('/catalog/password'),
  rotatePassword: () => api.post<ApiResponse<{ password: string; valid_from: string; valid_until: string }>>('/catalog/rotate'),
  getHistory: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ passwords: CatalogPassword[]; pagination: Pagination }>>('/catalog/history', { params }),
  getStats: () => api.get<ApiResponse<Record<string, number>>>('/stats/catalog'),
}

// ==================== FAVORITES ====================
export const favoriteService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ favorites: Favorite[]; pagination: Pagination }>>('/favorites', { params }),
  getIds: () => api.get<ApiResponse<{ ids: number[] }>>('/favorites/ids'),
  add: (propertyId: number) => api.post(`/favorites/${propertyId}`),
  remove: (propertyId: number) => api.delete(`/favorites/${propertyId}`),
  check: (propertyId: number) =>
    api.get<ApiResponse<{ is_favorite: boolean }>>(`/favorites/${propertyId}/check`),
}

// ==================== CONTACT REQUESTS ====================
export const contactService = {
  submit: (propertyId: number, data: { name: string; email: string; phone?: string; message: string }) =>
    api.post<ApiResponse<{ contact_request: { id: number } }>>(`/properties/${propertyId}/contact`, data),
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ contacts: ContactRequest[]; pagination: Pagination }>>('/contact-requests', { params }),
  markRead: (id: number) => api.post(`/contact-requests/${id}/read`),
  markReplied: (id: number) => api.post(`/contact-requests/${id}/replied`),
  archive: (id: number) => api.delete(`/contact-requests/${id}`),
}

// ==================== PAYMENTS ====================
export const paymentService = {
  initiateCatalog: (data: { phone: string; provider: 'mtn' | 'orange'; email?: string }) =>
    api.post<ApiResponse<PaymentInitResponse>>('/payments/catalog', data),
  getStatus: (txId: string) =>
    api.get<ApiResponse<PaymentStatus>>(`/payments/${txId}/status`),
  claimCatalog: (txId: string) =>
    api.get<ApiResponse<{ password: string; valid_until: string }>>(`/payments/${txId}/claim-catalog`),
  sandboxForceComplete: (txId: string) =>
    api.post<ApiResponse<{ status: string }>>(`/payments/sandbox/${txId}/complete`),
}

// ==================== ADMIN ====================
export const adminService = {
  getDashboard: () => api.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard'),
  getProperties: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ properties: Property[]; pagination: Pagination }>>('/admin/properties', { params }),
  toggleFeatured: (id: number, is_featured: boolean) =>
    api.post(`/admin/properties/${id}/featured`, { is_featured }),
  getFeaturedProperties: () =>
    api.get<ApiResponse<{ stats: Record<string, number>; properties: Property[] }>>('/admin/properties/featured'),
  setFeaturedOrder: (properties: { id: number; order: number }[]) =>
    api.post('/admin/properties/featured/order', { properties }),
}
