<template>
  <div class="history-container">
    <el-row :gutter="20" style="height: 100%">
      <!-- 会话列表 -->
      <el-col :span="8">
        <el-card class="session-list-card">
          <template #header>
            <div class="card-header">
              <span>会话列表</span>
              <el-button
                type="primary"
                size="small"
                :icon="Plus"
                @click="createNewChat"
              >
                新建会话
              </el-button>
            </div>
          </template>
          
          <div v-if="sessions.length === 0" class="empty-state">
            <el-empty description="暂无会话记录" />
          </div>
          
          <div v-else class="session-list">
            <div
              v-for="session in sessions"
              :key="session.id"
              :class="['session-item', { active: currentSession?.id === session.id }]"
              @click="selectSession(session)"
            >
              <div class="session-info">
                <div class="session-title">{{ session.title }}</div>
                <div class="session-time">{{ formatTime(session.updateTime) }}</div>
              </div>
              <el-button
                type="danger"
                :icon="Delete"
                size="small"
                circle
                @click.stop="handleDelete(session)"
              />
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 消息详情 -->
      <el-col :span="16">
        <el-card class="messages-card">
          <template #header>
            <div class="card-header">
              <span>{{ currentSession?.title || '选择一个会话查看详情' }}</span>
            </div>
          </template>
          
          <div v-if="!currentSession" class="empty-state">
            <el-empty description="请选择一个会话查看消息" />
          </div>
          
          <div v-else class="messages-list">
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
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Plus, Delete } from '@element-plus/icons-vue'
import { getSessions, getMessages, deleteSession } from '@/api/chat'

const router = useRouter()
const sessions = ref([])
const currentSession = ref(null)
const messages = ref([])

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const loadSessions = async () => {
  try {
    const data = await getSessions()
    sessions.value = data
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
}

const selectSession = async (session) => {
  currentSession.value = session
  
  try {
    const data = await getMessages(session.id)
    messages.value = data
  } catch (error) {
    ElMessage.error('加载消息失败')
    console.error('加载消息失败:', error)
  }
}

const handleDelete = async (session) => {
  try {
    await ElMessageBox.confirm('确定要删除这个会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteSession(session.id)
    ElMessage.success('删除成功')
    
    // 如果删除的是当前选中的会话，清空消息
    if (currentSession.value?.id === session.id) {
      currentSession.value = null
      messages.value = []
    }
    
    // 重新加载会话列表
    await loadSessions()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const createNewChat = () => {
  router.push('/chat')
}

onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.history-container {
  height: 100%;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-list-card,
.messages-card {
  height: calc(100vh - 140px);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
}

.session-list-card:hover,
.messages-card:hover {
  box-shadow: var(--shadow);
}

:deep(.el-card__body) {
  height: calc(100% - 56px);
  overflow-y: auto;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
  background-color: var(--card-bg);
}

.session-item:hover {
  background-color: var(--bg-color);
  transform: translateX(5px);
}

.session-item.active {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
}

.session-info {
  flex: 1;
  overflow: hidden;
}

.session-title {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.session-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.messages-list {
  padding: 10px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
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
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 70%;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.message-image:hover {
  transform: scale(1.02);
}

.message-text {
  padding: 12px 16px;
  border-radius: var(--radius);
  background-color: var(--card-bg);
  word-wrap: break-word;
  white-space: pre-wrap;
  box-shadow: var(--shadow-sm);
}

.message-time {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 4px;
}
</style>
