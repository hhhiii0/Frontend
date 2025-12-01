import request from './request'

export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const uploadAvatar = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const uploadBrainTumorImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload/brain-tumor', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

