import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const { tokens } = useAuthStore.getState()
        if (tokens?.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config
        const { tokens } = useAuthStore.getState()

        if (error.response?.status === 401 && tokens?.refresh && originalRequest) {
          try {
            const response = await this.client.post('/auth/token/refresh/', {
              refresh: tokens.refresh,
            })

            const { access } = response.data
            useAuthStore.getState().setTokens({
              ...tokens,
              access,
            })

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${access}`
            return this.client(originalRequest)
          } catch (refreshError) {
            useAuthStore.getState().logout()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.client.post('/auth/login/', { email, password })
  }

  async register(data: any) {
    return this.client.post('/auth/register/', data)
  }

  async logout() {
    return this.client.post('/auth/logout/')
  }

  async getProfile() {
    return this.client.get('/auth/me/')
  }

  async updateProfile(data: any) {
    return this.client.put('/auth/update-profile/', data)
  }

  // Business endpoints
  async getBusinesses(params?: any) {
    return this.client.get('/businesses/', { params })
  }

  async getBusiness(id: string) {
    return this.client.get(`/businesses/${id}/`)
  }

  async searchBusinesses(query: string) {
    return this.client.get('/businesses/', { params: { search: query } })
  }

  // Order endpoints
  async getOrders(params?: any) {
    return this.client.get('/orders/', { params })
  }

  async getOrder(id: string) {
    return this.client.get(`/orders/${id}/`)
  }

  async createOrder(data: any) {
    return this.client.post('/orders/', data)
  }

  async updateOrder(id: string, data: any) {
    return this.client.patch(`/orders/${id}/`, data)
  }

  // Deal endpoints
  async getDeals(params?: any) {
    return this.client.get('/deals/', { params })
  }

  async getDeal(id: string) {
    return this.client.get(`/deals/${id}/`)
  }

  // Payment endpoints
  async createPayment(data: any) {
    return this.client.post('/payments/', data)
  }

  async getPayment(id: string) {
    return this.client.get(`/payments/${id}/`)
  }

  // Generic request method
  async request(method: string, url: string, data?: any, config?: any) {
    return this.client.request({
      method,
      url,
      data,
      ...config,
    })
  }
}

export const apiClient = new ApiClient()
