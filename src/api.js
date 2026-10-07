async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export function isUnauthorized(err) {
  return !!err && err.status === 401
}

export async function getSiteData() {
  return request('/api/site')
}

export async function submitMessage(payload) {
  return request('/api/messages', { method: 'POST', body: JSON.stringify(payload) })
}

export async function adminLogin(password) {
  return request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
}

function authed(token, method, body) {
  return {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }
}

export const adminApi = {
  getSite: (token) => request('/api/admin/site', authed(token, 'GET')),
  saveSite: (token, settings) => request('/api/admin/site', authed(token, 'PUT', settings)),
  getMenu: (token) => request('/api/admin/menu', authed(token, 'GET')),
  createCategory: (token, data) => request('/api/admin/categories', authed(token, 'POST', data)),
  updateCategory: (token, id, data) => request(`/api/admin/categories/${id}`, authed(token, 'PUT', data)),
  deleteCategory: (token, id) => request(`/api/admin/categories/${id}`, authed(token, 'DELETE')),
  createProduct: (token, data) => request('/api/admin/products', authed(token, 'POST', data)),
  updateProduct: (token, id, data) => request(`/api/admin/products/${id}`, authed(token, 'PUT', data)),
  deleteProduct: (token, id) => request(`/api/admin/products/${id}`, authed(token, 'DELETE')),
  getMessages: (token) => request('/api/admin/messages', authed(token, 'GET')),
  deleteMessage: (token, id) => request(`/api/admin/messages/${id}`, authed(token, 'DELETE')),
}

export async function uploadImage(token, file) {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Upload failed')
    err.status = res.status
    throw err
  }
  return data.url
}