<template>
  <div class="upload-chat-container">
    <el-card class="chat-card">
      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <el-empty description="上传图片并提问" />
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
            <div class="message-text">正在分析图片...</div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <!-- 图片预览 -->
        <div v-if="previewUrl" class="image-preview-box">
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
          <el-upload
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
              placeholder="描述你想问的问题..."
              :disabled="loading"
              @keyup.enter="handleSend"
          />

          <el-button
              type="primary"
              :icon="Promotion"
              @click="handleSend"
              :loading="loading"
              :disabled="!inputMessage.trim() || !uploadedImageUrl"
          >
            发送
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Promotion, Picture, Close, ChatDotRound } from '@element-plus/icons-vue'
import { sendMessage } from '@/api/chat'
import { uploadImage } from '@/api/upload'

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messagesContainer = ref(null)
const currentSessionId = ref(null)
const previewUrl = ref('')
const uploadedImageUrl = ref('')

// 脑肿瘤专家系统提示词（新增）
const systemPrompt = "你是一名专业的脑肿瘤分析专家，尤其擅长通过影像资料（如MRI、CT等）分析脑肿瘤特征。请专注于解答与脑肿瘤相关的图片分析问题，包括肿瘤位置、可能类型、影像特征等。回答需专业准确，避免超出领域范围，明确说明仅作科普参考，不替代专业医疗诊断。"

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

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

const handleUpload = async ({ file }) => {
  loading.value = true

  try {
    const result = await uploadImage(file)
    uploadedImageUrl.value = result.url
    previewUrl.value = URL.createObjectURL(file)
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error('图片上传失败')
    console.error('上传失败:', error)
  } finally {
    loading.value = false
  }
}

const removeImage = () => {
  previewUrl.value = ''
  uploadedImageUrl.value = ''
}

const handleSend = async () => {
  if (!inputMessage.value.trim() || !uploadedImageUrl.value || loading.value) {
    ElMessage.warning('请先上传图片并输入问题')
    return
  }

  const message = inputMessage.value.trim()
  const imageUrl = uploadedImageUrl.value

  inputMessage.value = ''

  // 添加用户消息到界面
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: message,
    imageUrl: imageUrl,
    createTime: new Date().toISOString()
  })

  // 清空图片
  previewUrl.value = ''
  uploadedImageUrl.value = ''

  scrollToBottom()
  loading.value = true

  try {
    // 发送消息时携带系统提示词（修改处）
    const response = await sendMessage({
      sessionId: currentSessionId.value,
      message: message,
      imageUrl: imageUrl,
      systemPrompt: systemPrompt
    })

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
</script>

<style scoped>
/* 样式保持不变 */
.upload-chat-container {
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