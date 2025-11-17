import request from './request'

export const sendMessage = (data) => {
  return request.post('/chat/send', data)
}

export const getSessions = () => {
  return request.get('/history/sessions')
}

export const getMessages = (sessionId) => {
  return request.get(`/history/messages/${sessionId}`)
}

export const deleteSession = (sessionId) => {
  return request.delete(`/history/session/${sessionId}`)
}

