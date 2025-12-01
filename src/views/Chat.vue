<template>
  <div class="chat-container">
    <el-card class="chat-card">
      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <el-empty :description="isTextMode ? '开始你的AI对话吧' : '上传图片并提问'" />
        </div>

        <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['message-item', msg.role]"
        >
          <div class="message-avatar">
            <el-avatar v-if="msg.role === 'user'" :icon="UserFilled" />
            <el-avatar v-else>
              <el-icon><ChatDotRound /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <el-image
                v-if="msg.imageUrl"
                :src="msg.imageUrl"
                fit="cover"
                class="message-image"
                :preview-src-list="[msg.imageUrl]"
            />
            <div class="message-text">{{ msg.content }}</div>
            <div class="message-time">{{ formatTime(msg.createTime) }}</div>
          </div>
        </div>

        <div v-if="loading" class="message-item assistant">
          <div class="message-avatar">
            <el-avatar>
              <el-icon><ChatDotRound /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-text">{{ isTextMode ? '正在思考中...' : '正在分析图片...' }}</div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <!-- 模式切换 -->
        <div class="mode-switch">
          <el-radio-group v-model="isTextMode" @change="resetInput">
            <el-radio :label="true">文字问答</el-radio>
            <el-radio :label="false">图片问答</el-radio>
          </el-radio-group>
        </div>

        <!-- 图片预览（仅图片模式显示） -->
        <div v-if="!isTextMode && previewUrl" class="image-preview-box">
          <el-image :src="previewUrl" fit="contain" class="preview-image" />
          <el-button
              type="danger"
              :icon="Close"
              circle
              size="small"
              class="remove-btn"
              @click="removeImage"
          />
        </div>

        <!-- 输入框和按钮 -->
        <div class="input-row">
          <!-- 图片上传按钮（仅图片模式显示） -->
          <el-upload
              v-if="!isTextMode"
              :show-file-list="false"
              :before-upload="handleBeforeUpload"
              :http-request="handleUpload"
              accept="image/*"
              :disabled="loading"
          >
            <el-button :icon="Picture" :disabled="loading">
              {{ previewUrl ? '更换图片' : '上传图片' }}
            </el-button>
          </el-upload>

          <el-input
              v-model="inputMessage"
              :type="isTextMode ? 'textarea' : 'text'"
              :rows="isTextMode ? 3 : 1"
              :placeholder="isTextMode ? '输入消息，按Ctrl+Enter发送' : '描述你想问的问题...'"
              @keydown.ctrl.enter="handleSend"
              @keyup.enter="!isTextMode && handleSend"
              :disabled="loading"
          />

          <el-button
              type="primary"
              :icon="Promotion"
              @click="handleSend"
              :loading="loading"
              :disabled="!canSend"
          >
            发送
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Promotion, Picture, Close, ChatDotRound } from '@element-plus/icons-vue'
import { sendMessage, getMessages } from '@/api/chat'
import { uploadImage } from '@/api/upload'

// 状态管理
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messagesContainer = ref(null)
const currentSessionId = ref(null)
const isTextMode = ref(true) // true: 文字模式, false: 图片模式
const previewUrl = ref('')
const uploadedImageUrl = ref('')

// 计算属性：判断是否可以发送消息
const canSend = computed(() => {
  const hasMessage = inputMessage.value.trim() !== ''
  if (isTextMode.value) {
    return hasMessage
  } else {
    return hasMessage && uploadedImageUrl.value
  }
})

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 切换模式时重置输入
const resetInput = () => {
  inputMessage.value = ''
  previewUrl.value = ''
  uploadedImageUrl.value = ''
}

// 图片上传前校验
const handleBeforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }
  return true
}

// 处理图片上传
const handleUpload = async ({ file }) => {
  loading.value = true

  try {
    // 上传图片
    const result = await uploadImage(file)
    uploadedImageUrl.value = result.url

    // 创建预览URL
    previewUrl.value = URL.createObjectURL(file)

    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error('图片上传失败')
    console.error('上传失败:', error)
  } finally {
    loading.value = false
  }
}

// 移除图片
const removeImage = () => {
  previewUrl.value = ''
  uploadedImageUrl.value = ''
}

// 发送消息
const handleSend = async () => {
  if (!canSend.value || loading.value) {
    if (!isTextMode.value && !uploadedImageUrl.value) {
      ElMessage.warning('请先上传图片')
    }
    return
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  // 准备发送的数据
  const sendData = {
    sessionId: currentSessionId.value,
    message: message
  }

  // 如果是图片模式，添加图片URL
  if (!isTextMode.value) {
    sendData.imageUrl = uploadedImageUrl.value
  }

  // 添加用户消息到界面
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: message,
    createTime: new Date().toISOString()
  }

  // 如果是图片模式，添加图片URL
  if (!isTextMode.value) {
    userMessage.imageUrl = uploadedImageUrl.value
  }

  messages.value.push(userMessage)

  // 图片模式下清空图片
  if (!isTextMode.value) {
    previewUrl.value = ''
    uploadedImageUrl.value = ''
  }

  scrollToBottom()
  loading.value = true

  try {
    const response = await sendMessage(sendData)

    // 更新会话ID
    if (!currentSessionId.value) {
      currentSessionId.value = response.sessionId
    }

    // 添加AI回复到界面
    messages.value.push(response)
    scrollToBottom()
  } catch (error) {
    ElMessage.error('发送失败，请重试')
    console.error('发送消息失败:', error)
  } finally {
    loading.value = false
  }
}

// 页面挂载时加载历史会话
onMounted(() => {
  const sessionId = new URLSearchParams(window.location.search).get('sessionId')
  if (sessionId) {
    currentSessionId.value = parseInt(sessionId)
    loadMessages()
  }
})

// 加载历史消息
const loadMessages = async () => {
  if (!currentSessionId.value) return

  try {
    const data = await getMessages(currentSessionId.value)
    messages.value = data
    scrollToBottom()
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}
</script>

<style scoped>
.chat-container {
  height: 100%;
  padding: 20px;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-item.user .message-text {
  background-color: #409eff;
  color: #fff;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 70%;
}

.message-image {
  max-width: 300px;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
}

.message-text {
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message-time {
  font-size: 12px;
  color: #999;
  padding: 0 4px;
}

.input-container {
  padding: 20px;
  background-color: #fff;
  border-top: 1px solid #e8e8e8;
}

.mode-switch {
  margin-bottom: 15px;
}

.image-preview-box {
  position: relative;
  margin-bottom: 12px;
  display: inline-block;
}

.preview-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-row :deep(.el-input) {
  flex: 1;
}
</style>