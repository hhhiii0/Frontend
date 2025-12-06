<template>
  <div class="chat-container">
    <el-card class="chat-card">
      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <el-empty description="可上传图片直接分析，或输入消息咨询" />
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
            <div class="message-text">{{ msg.content || '[上传了图片]' }}</div>
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
            <div class="message-text">
              {{ uploadedImageUrl ? '正在分析图片...' : '正在思考中...' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <!-- 优化后的图片预览区域 -->
        <div v-if="previewUrl" class="image-preview-box">
          <div class="preview-wrapper">
            <el-image
                :src="previewUrl"
                fit="contain"
                class="preview-image"
                :preview-src-list="[previewUrl]"
            />
            <el-button
                type="danger"
                :icon="Close"
                circle
                size="small"
                class="remove-btn"
                @click="removeImage"
                hover-class="el-button--danger-hover"
            />
          </div>
          <div class="preview-tip">已上传图片，可直接发送</div>
        </div>

        <!-- 输入框和按钮（图片上传图标在右侧） -->
        <div class="input-row">
          <!-- 修复：el-input添加自闭合标签 -->
          <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="输入消息（可仅上传图片直接发送），按Ctrl+Enter发送"
              @keydown.ctrl.enter="handleSend"
              :disabled="loading"
              class="chat-input"
          />

          <!-- 图片上传图标按钮 -->
          <el-upload
              :show-file-list="false"
              :before-upload="handleBeforeUpload"
              :http-request="handleUpload"
              accept="image/*"
              :disabled="loading"
          >
            <el-button
                :icon="Picture"
                :disabled="loading"
                circle
                size="small"
                type="default"
                title="上传图片（可直接发送）"
                class="upload-btn"
            />
          </el-upload>

          <el-button
              type="primary"
              :icon="Promotion"
              @click="handleSend"
              :loading="loading"
              :disabled="!canSend"
              class="send-btn"
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
const previewUrl = ref('')
const uploadedImageUrl = ref('')

// 脑肿瘤专家系统提示词
const systemPrompt = "你是一名专业的脑肿瘤分析专家，擅长解答各类脑肿瘤相关问题，包括文字咨询和影像资料（如MRI、CT等）分析。对于文字问题，可解答肿瘤类型、治疗方案、预后等；对于图片问题，可分析肿瘤位置、影像特征等。回答需专业准确，仅限领域内内容，明确说明仅作科普参考，不替代医疗诊断。"

// 计算属性：文字/图片至少有一个即可发送
const canSend = computed(() => {
  return inputMessage.value.trim() !== '' || uploadedImageUrl.value
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
    const result = await uploadImage(file)
    uploadedImageUrl.value = result.url
    previewUrl.value = URL.createObjectURL(file)
    ElMessage.success('图片上传成功，可直接发送')
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
    ElMessage.warning('请输入消息或上传图片')
    return
  }

  let message = inputMessage.value.trim()
  // 仅传图片时，给message设置默认值（避免后端校验为空）
  if (!message && uploadedImageUrl.value) {
    message = "[图片咨询]"
  }
  inputMessage.value = ''

  // 准备发送的数据（文字/图片可选其一）
  const sendData = {
    sessionId: currentSessionId.value,
    message: message,
    systemPrompt: systemPrompt
  }

  // 若有上传的图片，携带图片URL
  if (uploadedImageUrl.value) {
    sendData.imageUrl = uploadedImageUrl.value
  }

  // 添加用户消息到界面（无文字时显示“[上传了图片]”）
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: message === "[图片咨询]" ? "" : message,  // 前端显示时隐藏默认值
    createTime: new Date().toISOString()
  }
  // 携带图片（若有）
  if (uploadedImageUrl.value) {
    userMessage.imageUrl = uploadedImageUrl.value
  }

  messages.value.push(userMessage)
  // 清空已上传的图片（避免重复发送）
  previewUrl.value = ''
  uploadedImageUrl.value = ''

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
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border-radius: 12px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  border-radius: 0 0 12px 12px;
}

/* 优化后的图片预览区域样式 */
.image-preview-box {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
}

.preview-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 8px;
}

.preview-image {
  width: 140px;
  height: 140px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.preview-image:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.remove-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #f56c6c;
  color: #fff;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background-color: #f78989;
  transform: scale(1.05);
}

.preview-tip {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: center; /* 垂直居中对齐元素 */
}

.chat-input {
  flex: 1; /* 输入框占满剩余宽度 */
  border-radius: 8px;
}

/* 按钮样式优化 */
.upload-btn {
  flex-shrink: 0; /* 防止按钮被压缩 */
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.upload-btn:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.send-btn {
  flex-shrink: 0;
  border-radius: 8px;
  padding: 0 20px;
  height: 40px;
}

/* 适配element-plus的样式穿透 */
:deep(.el-textarea__inner) {
  border-radius: 8px;
  resize: none;
  padding: 12px;
}

:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
</style>