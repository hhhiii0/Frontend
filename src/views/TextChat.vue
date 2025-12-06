<template>
  <div class="chat-container">
    <el-card class="chat-card">
      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <el-empty description="开始你的AI对话吧" />
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
            <div class="message-text">正在思考中...</div>
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-container">
        <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息，按Ctrl+Enter发送"
            @keydown.ctrl.enter="handleSend"
            :disabled="loading"
        />
        <el-button
            type="primary"
            :icon="Promotion"
            @click="handleSend"
            :loading="loading"
            :disabled="!inputMessage.trim()"
        >
          发送
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Promotion, ChatDotRound } from '@element-plus/icons-vue'
import { sendMessage, getMessages } from '@/api/chat'

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messagesContainer = ref(null)
const currentSessionId = ref(null)

// 脑肿瘤专家系统提示词（新增）
const systemPrompt = "你是一名专业的脑肿瘤分析专家，拥有丰富的神经肿瘤学临床经验。请专注于解答脑肿瘤相关的医学问题，包括但不限于肿瘤类型（如胶质瘤、脑膜瘤等）、诊断方法（影像分析、病理检测等）、治疗方案（手术、放疗、化疗等）、预后评估及最新研究进展。回答需专业准确，避免超出领域范围，对于不确定的内容需明确说明，不提供医疗诊断建议（仅作科普参考）。"

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

const handleSend = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  // 添加用户消息到界面
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: message,
    createTime: new Date().toISOString()
  })

  scrollToBottom()
  loading.value = true

  try {
    // 发送消息时携带系统提示词（修改处）
    const response = await sendMessage({
      sessionId: currentSessionId.value,
      message: message,
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

onMounted(() => {
  const sessionId = new URLSearchParams(window.location.search).get('sessionId')
  if (sessionId) {
    currentSessionId.value = parseInt(sessionId)
    loadMessages()
  }
})

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
/* 样式保持不变 */
.chat-container {
  height: 100%;
  padding: 20px;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
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
  background-color: var(--bg-color);
  background-image:
      linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px);
  background-size: 20px 20px;
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
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-item.user .message-text {
  background-color: var(--primary-color);
  color: #fff;
  border-top-right-radius: 4px;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-width: 70%;
}

.message-text {
  padding: 12px 16px;
  border-radius: var(--radius);
  background-color: var(--card-bg);
  box-shadow: var(--shadow-sm);
  word-wrap: break-word;
  white-space: pre-wrap;
  border-top-left-radius: 4px;
  transition: all 0.2s ease;
}

.message-text:hover {
  box-shadow: var(--shadow);
}

.message-time {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 4px;
}

.input-container {
  display: flex;
  gap: 12px;
  padding: 20px;
  background-color: var(--card-bg);
  border-top: 1px solid var(--border-color);
}

.input-container :deep(.el-textarea) {
  flex: 1;
}

.input-container :deep(.el-textarea__inner) {
  border-radius: var(--radius);
  border-color: var(--border-color);
  transition: all 0.2s ease;
}

.input-container :deep(.el-textarea__inner:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.input-container :deep(.el-button) {
  border-radius: var(--radius);
  transition: all 0.2s ease;
}

.input-container :deep(.el-button):hover {
  transform: translateY(-2px);
}
</style>