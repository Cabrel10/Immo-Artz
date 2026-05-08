import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import type { User, LoginCredentials, RegisterData, ApiResponse } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser()
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/me')
      if (response.data.success) {
        setState({
          user: response.data.data?.user || null,
          isAuthenticated: true,
          isLoading: false,
        })
      }
    } catch {
      localStorage.removeItem('token')
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<ApiResponse<{ user: User; access_token: string }>>('/login', credentials)
      
      if (response.data.success && response.data.data?.access_token) {
        localStorage.setItem('token', response.data.data.access_token)
        setState({
          user: response.data.data.user,
          isAuthenticated: true,
          isLoading: false,
        })
        return { success: true }
      }
      
      return { success: false, message: response.data.message }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion',
      }
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await api.post<ApiResponse<{ user: User; access_token: string }>>('/register', data)
      
      if (response.data.success && response.data.data?.access_token) {
        localStorage.setItem('token', response.data.data.access_token)
        setState({
          user: response.data.data.user,
          isAuthenticated: true,
          isLoading: false,
        })
        return { success: true }
      }
      
      return { success: false, message: response.data.message }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur d\'inscription',
        errors: error.response?.data?.errors,
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const response = await api.put<ApiResponse<{ user: User }>>('/profile', data)
      
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          user: response.data.data?.user || prev.user,
        }))
        return { success: true }
      }
      
      return { success: false, message: response.data.message }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de mise à jour',
      }
    }
  }, [])

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshUser: fetchUser,
  }
}
