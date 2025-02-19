import axios from 'axios'

// 根据环境设置基础 URL
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://pcqjxhexpwzo.sealoshzh.site'  // 生产环境
  : 'https://vrpfuugumlym.sealoshzh.site'  // 开发环境

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // token 过期，清除用户信息并跳转到登录页
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  login: (username, password) => {
    return api.post('/api/auth/login/', { username, password })
  }
}

export const files = {
  getList: () => {
    return api.get('/api/files/')
  },

  upload: (formData) => {
    return api.post('/api/files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  getPdfInfo: (fileId) => {
    return api.get(`/api/files/${fileId}/pdf_info/`)
  },

  getProgress: (fileId) => {
    return api.get(`/api/files/${fileId}/progress/`)
  },

  getHistory: (fileId) => {
    return api.get(`/api/files/${fileId}/history/`)
  }
}

export const annotations = {
  getList: (fileId) => {
    return api.get('/api/annotations/', {
      params: { file_id: fileId }
    })
  },

  add: (data) => {
    return api.post('/api/annotations/', data)
  },

  update: (id, data) => {
    return api.put(`/api/annotations/${id}/`, data)
  },

  delete: (id) => {
    return api.delete(`/api/annotations/${id}/`)
  },

  rollback: (fileId, version, historyId) => {
    return api.post(`/api/annotations/${fileId}/rollback/`, {
      version,
      historyId
    })
  },

  verify: (id, data) => {
    return api.put(`/api/annotations/${id}/verify/`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },
  
  updateContent: (id, data) => {
    return api.put(`/api/annotations/${id}/update_content/`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },

  editField: (annotationId, data) => {
    return api.put(`/api/annotations/${annotationId}/edit_field/`, {
      json_content: data
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },
}

export default api 