import request from './request'

export const getProfile = () => {
  return request.get('/user/profile')
}

export const updateProfile = (data) => {
  return request.put('/user/profile', data)
}

export const updateAvatar = (avatarUrl) => {
  return request.post('/user/avatar', { avatarUrl })
}

export const updatePassword = (data) => {
  return request.post('/user/password', data)
}

export const getSettings = () => {
  return request.get('/user/settings')
}

export const updateSettings = (data) => {
  return request.put('/user/settings', data)
}

