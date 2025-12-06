<template>
  <div class="layout-container">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="220px" class="sidebar">
        <div class="logo">
          <el-icon size="24"><ChatDotRound /></el-icon>
          <span>医疗问答</span>
        </div>

        <el-menu
            :default-active="currentRoute"
            router
            class="menu"
            text-color="#e5eaf3"
            active-text-color="#ffffff"
            background-color="#001529"
        >
          <!-- 调整后的菜单顺序 -->
          <el-menu-item index="/brain-tumor">
            <el-icon slot="icon"><Grid /></el-icon>
            <span>脑肿瘤分析</span>
          </el-menu-item>
          <el-menu-item index="/chat">
            <el-icon slot="icon"><ChatDotRound /></el-icon>
            <span>智能问答</span>
          </el-menu-item>
          <el-menu-item index="/history">
            <el-icon slot="icon"><Clock /></el-icon>
            <span>历史记录</span>
          </el-menu-item>
          <el-menu-item index="/analytics">
            <el-icon slot="icon"><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
          <el-menu-item index="/profile">
            <el-icon slot="icon"><UserFilled /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部栏 -->
        <el-header class="header">
          <div class="header-left">
            <h2>{{ pageTitle }}</h2>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <el-avatar
                    :src="userStore.userInfo?.avatar || undefined"
                    :icon="UserFilled"
                    size="large"
                />
                <span class="username">{{ userStore.userInfo?.username || '未登录' }}</span>
                <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><UserFilled /></el-icon>
                    <span>个人中心</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    <span>退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 内容区 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
// 补充导入需要的图标
import {
  UserFilled, ChatDotRound, Grid, Clock,
  DataAnalysis, ArrowDown, SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 当前激活的路由
const currentRoute = computed(() => route.path)

// 页面标题映射（补全所有路由）
const pageTitle = computed(() => {
  const titles = {
    '/chat': '智能问答',
    '/history': '历史记录',
    '/profile': '个人中心',
    '/analytics': '数据分析',  // 补充数据分析标题
    '/brain-tumor': '脑肿瘤分析' // 补充脑肿瘤分析标题
  }
  return titles[route.path] || '医疗问答系统'
})

// 下拉菜单处理逻辑
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    }).catch(() => {
      // 取消退出时的空处理，避免控制台警告
    })
  }
}
</script>

<style scoped>
/* 全局布局容器 */
.layout-container {
  height: 100vh;
  overflow: hidden;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 侧边栏样式优化 */
.sidebar {
  background-color: #001529;
  height: 100vh;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* Logo区域样式 */
.logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  height: 64px;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 20px;
  background-color: #001529;
}

/* 菜单样式优化 */
.menu {
  border-right: none;
  background-color: #001529;
  padding-top: 16px;
}

/* 消除Element默认样式影响 */
:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 0 8px;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #165dff !important;
  color: #ffffff !important;
}

:deep(.el-menu-item__icon) {
  font-size: 16px;
  margin-right: 10px;
}

/* 顶部栏样式优化 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f2f5;
  padding: 0 24px;
  height: 64px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

/* 用户信息区域 */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 12px;
  color: #666;
}

/* 主内容区域 */
.main-content {
  background-color: #f8f9fa;
  height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 20px;
}

/* 滚动条优化（可选） */
:deep(.main-content::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(.main-content::-webkit-scrollbar-thumb) {
  background-color: #dcdfe6;
  border-radius: 3px;
}

:deep(.main-content::-webkit-scrollbar-track) {
  background-color: #f5f5f5;
}
</style>