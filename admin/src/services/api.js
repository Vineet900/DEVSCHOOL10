import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    // Attempt to get the session token from localStorage (assuming frontend stores it)
    const sbTokenStr = localStorage.getItem('sb-localhost-auth-token')
    if (sbTokenStr) {
      try {
        const sessionData = JSON.parse(sbTokenStr)
        const token = sessionData?.access_token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (e) {
        console.error('Failed to parse auth token')
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response.data, // return just the data payload
  (error) => {
    // Handle auth errors globally if needed
    if (error.response?.status === 401) {
      // e.g. logout user, clear token, redirect to login
      console.error('Unauthorized access. Please login.')
    }
    return Promise.reject(error)
  }
)

export default api
