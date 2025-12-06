<template>
  <div class="profile-container">
    <!-- 主布局：左12列 + 右12列，尺寸完全对等 -->
    <el-row :gutter="20">
      <!-- 左侧：个人信息栏（占12列，高度与右侧整体对齐） -->
      <el-col :span="12">
        <el-card class="profile-card left-card" shadow="hover">
          <template #header>
            <span class="card-title">个人信息</span>
          </template>

          <div class="info-content">
            <!-- 头像区域：居中排版 -->
            <div class="avatar-area">
              <el-avatar :size="100" :src="userInfo.avatar || 'https://picsum.photos/200/200'" />
              <el-upload
                  :show-file-list="false"
                  :before-upload="handleBeforeUpload"
                  :http-request="handleAvatarUpload"
                  accept="image/*"
                  class="avatar-upload"
              >
                <el-button type="primary" size="small" icon="Upload" plain>更换头像</el-button>
              </el-upload>
            </div>

            <!-- 信息表单：紧凑对齐 -->
            <el-form :model="userForm" label-width="80px" class="info-form">
              <el-form-item label="用户名">
                <el-input v-model="userForm.username" size="small" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="userForm.email" size="small" />
              </el-form-item>
              <el-form-item label="注册时间">
                <el-input :value="formatTime(userInfo.createTime)" size="small" disabled />
              </el-form-item>
              <el-form-item class="form-btn">
                <el-button type="primary" size="small" @click="handleUpdateProfile" :loading="loading">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：占12列，内部上下分栏（上-快捷操作、下-修改密码） -->
      <el-col :span="12">
        <el-row :gutter="15">
          <!-- 右上：系统快捷操作（横向排列） -->
          <el-col :span="24">
            <el-card class="profile-card shortcut-card" shadow="hover">
              <template #header>
                <span class="card-title">系统快捷操作</span>
              </template>

              <!-- 横向排列的操作项 -->
              <div class="shortcut-group">
                <div class="shortcut-item">
                  <el-icon class="shortcut-icon" color="#409eff"><Setting /></el-icon>
                  <div class="shortcut-text">系统设置</div>
                  <el-button type="text" size="mini" class="shortcut-btn">前往配置</el-button>
                </div>
                <div class="shortcut-item">
                  <el-icon class="shortcut-icon" color="#67c23a"><Bell /></el-icon>
                  <div class="shortcut-text">通知中心</div>
                  <el-button type="text" size="mini" class="shortcut-btn">查看消息</el-button>
                </div>
                <div class="shortcut-item">
                  <el-icon class="shortcut-icon" color="#e6a23c"><Document /></el-icon>
                  <div class="shortcut-text">文档中心</div>
                  <el-button type="text" size="mini" class="shortcut-btn">查看手册</el-button>
                </div>
                <div class="shortcut-item">
                  <el-icon class="shortcut-icon" color="#f56c6c"><UserFilled /></el-icon>
                  <div class="shortcut-text">权限管理</div>
                  <el-button type="text" size="mini" class="shortcut-btn">查看权限</el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右下：修改密码栏 -->
          <el-col :span="24">
            <el-card class="profile-card pwd-card" shadow="hover">
              <template #header>
                <span class="card-title">修改密码</span>
              </template>

              <el-form
                  :model="passwordForm"
                  :rules="passwordRules"
                  ref="passwordFormRef"
                  label-width="90px"
                  class="pwd-form"
              >
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="passwordForm.oldPassword" type="password" size="small" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" size="small" show-password />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" size="small" show-password />
                </el-form-item>
                <el-form-item class="form-btn">
                  <el-button type="primary" size="small" @click="handleUpdatePassword" :loading="passwordLoading">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 保留所有原有功能逻辑，无修改
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Upload, Setting, Bell, Document } from '@element-plus/icons-vue'
import { getProfile, updateProfile, updatePassword, updateAvatar as updateAvatarApi } from '@/api/user'
import { uploadAvatar } from '@/api/upload'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const passwordFormRef = ref(null)
const loading = ref(false)
const passwordLoading = ref(false)

const userInfo = ref({})
const userForm = ref({
  username: '',
  email: ''
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const loadUserInfo = async () => {
  try {
    const data = await getProfile()
    userInfo.value = data
    userForm.value.username = data.username
    userForm.value.email = data.email
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

const handleBeforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) { ElMessage.error('只能上传图片文件'); return false }
  if (!isLt2M) { ElMessage.error('图片大小不能超过2MB'); return false }
  return true
}

const handleAvatarUpload = async ({ file }) => {
  try {
    const result = await uploadAvatar(file)
    await updateAvatarApi(result.url)
    userInfo.value.avatar = result.url
    userStore.setUserInfo(userInfo.value)
    ElMessage.success('头像更新成功')
  } catch (error) {
    ElMessage.error('头像更新失败'); console.error(error)
  }
}

const handleUpdateProfile = async () => {
  loading.value = true
  try {
    const data = await updateProfile(userForm.value)
    userInfo.value = data
    userStore.setUserInfo(data)
    ElMessage.success('信息更新成功')
  } catch (error) {
    ElMessage.error('信息更新失败'); console.error(error)
  } finally { loading.value = false }
}

const handleUpdatePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    await updatePassword(passwordForm.value)
    ElMessage.success('密码修改成功')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    passwordFormRef.value.resetFields()
  } catch (error) { if (error !== false) console.error(error) }
  finally { passwordLoading.value = false }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
/* 容器：适配页面，背景柔和 */
.profile-container {
  padding: 20px;
  background-color: #f8fafc;
  min-height: calc(100vh - 60px);
}

/* 统一卡片样式：圆角、轻阴影，提升精致度 */
.profile-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 卡片标题样式 */
.card-title {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
}

/* 左侧个人信息栏：高度与右侧整体对齐 */
.left-card {
  min-height: 420px;
}
.info-content {
  padding: 20px;
}
.avatar-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 25px;
}
.avatar-upload {
  margin-top: 10px;
}
.info-form .el-form-item {
  margin-bottom: 15px;
}
.form-btn {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

/* 右侧快捷操作栏：横向排列 */
.shortcut-card {
  min-height: 140px;
}
.shortcut-group {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 15px 0;
  height: 100%;
}
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.shortcut-icon {
  font-size: 24px;
  margin-bottom: 8px;
}
.shortcut-text {
  font-size: 13px;
  color: #334155;
  margin-bottom: 5px;
}
.shortcut-btn {
  color: #409eff;
  padding: 0;
}

/* 右侧修改密码栏：填充剩余空间 */
.pwd-card {
  min-height: 260px;
}
.pwd-form {
  padding: 15px 0;
}
.pwd-form .el-form-item {
  margin-bottom: 15px;
}
</style>