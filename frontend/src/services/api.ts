import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
})

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Service d'authentification
export const authService = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  
  register: (data: any) =>
    api.post('/register', data),
  
  logout: () =>
    api.post('/logout'),
  
  me: () =>
    api.get('/me'),
  
  updateProfile: (data: any) =>
    api.put('/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/password', { current_password: currentPassword, new_password: newPassword, new_password_confirmation: newPassword }),
}

// Service des propriétés
export const propertyService = {
  getAll: (params?: any) =>
    api.get('/properties', { params }),
  
  getById: (id: number | string) =>
    api.get(`/properties/${id}`),
  
  getFeatured: (limit?: number) =>
    api.get('/properties/featured', { params: { limit } }),
  
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get('/properties/nearby', { params: { lat, lng, radius } }),
  
  create: (data: any) =>
    api.post('/properties', data),
  
  update: (id: number | string, data: any) =>
    api.put(`/properties/${id}`, data),
  
  delete: (id: number | string) =>
    api.delete(`/properties/${id}`),
  
  getMyProperties: () =>
    api.get('/my-properties'),
}

// Service du catalogue
export const catalogService = {
  verifyPassword: (password: string) =>
    api.post('/catalog/verify', { password }),

  purchase: (payment_method: string, phone?: string) =>
    api.post('/catalog/purchase', { payment_method, phone }),
  
  getCatalog: (password: string) =>
    api.get('/catalog', { params: { password } }),
  
  download: (password: string) =>
    api.get('/catalog/download', { 
      params: { password },
      responseType: 'blob',
    }),
  
  getCurrentPassword: () =>
    api.get('/catalog/password'),
  
  rotatePassword: () =>
    api.post('/catalog/rotate'),
  
  getHistory: () =>
    api.get('/catalog/history'),
  
  getStats: () =>
    api.get('/stats/catalog'),
}

// Service des avis
export const ratingService = {
  getByAgent: (agentId: number | string) =>
    api.get(`/agents/${agentId}/ratings`),
  
  getStats: (agentId: number | string) =>
    api.get(`/agents/${agentId}/ratings/stats`),
  
  create: (data: any) =>
    api.post('/ratings', data),
  
  getPending: () =>
    api.get('/ratings/pending'),
  
  approve: (id: number | string) =>
    api.post(`/ratings/${id}/approve`),
  
  reject: (id: number | string) =>
    api.post(`/ratings/${id}/reject`),
}

// Service des agents (public + admin)
export const agentService = {
  getAll: (params?: any) =>
    api.get('/agents', { params }),

  getById: (id: number | string) =>
    api.get(`/agents/${id}`),

  adminGetAll: (params?: any) =>
    api.get('/admin/agents', { params }),

  adminUpdateStatus: (id: number | string, status: string) =>
    api.put(`/admin/agents/${id}/status`, { status }),
}

// Service des favoris
export const favoriteService = {
  getAll: () =>
    api.get('/favorites'),

  getIds: () =>
    api.get('/favorites/ids'),

  toggle: (propertyId: number | string) =>
    api.post(`/favorites/${propertyId}/toggle`),
}

// Service d'administration
export const adminService = {
  getDashboard: () =>
    api.get('/admin/dashboard'),

  getProperties: (params?: any) =>
    api.get('/admin/properties', { params }),

  toggleFeatured: (id: number | string, is_featured: boolean, featured_until?: string) =>
    api.post(`/admin/properties/${id}/featured`, { is_featured, featured_until }),

  getPropertiesStats: () =>
    api.get('/stats/properties'),
}
