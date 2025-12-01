<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <span>个人信息</span>
          </template>

          <div class="profile-section">
            <div class="avatar-section">
              <el-avatar :size="100" :src="userInfo.avatar || undefined" :icon="UserFilled" />
              <el-upload
                  :show-file-list="false"
                  :before-upload="handleBeforeUpload"
                  :http-request="handleAvatarUpload"
                  accept="image/*"
              >
                <el-button type="primary" size="small" :icon="Upload">
                  更换头像
                </el-button>
              </el-upload>
            </div>

            <el-form :model="userForm" label-width="80px" style="margin-top: 30px">
              <el-form-item label="用户名">
                <el-input v-model="userForm.username" />
              </el-form-item>

              <el-form-item label="邮箱">
                <el-input v-model="userForm.email" />
              </el-form-item>

              <el-form-item label="注册时间">
                <el-input :value="formatTime(userInfo.createTime)" disabled />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handleUpdateProfile" :loading="loading">
                  保存修改
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <!-- 修改密码卡片 -->
      <el-col :span="12">
        <el-card class="password-card">
          <template #header>
            <span>修改密码</span>
          </template>

          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleUpdatePassword" :loading="passwordLoading">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Upload } from '@element-plus/icons-vue'
import { getProfile, updateProfile, updatePassword, getSettings, updateSettings, updateAvatar as updateAvatarApi } from '@/api/user'
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

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return false
  }
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
    ElMessage.error('头像更新失败')
    console.error('头像上传失败:', error)
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
    ElMessage.error('信息更新失败')
    console.error('更新失败:', error)
  } finally {
    loading.value = false
  }
}

const handleUpdatePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true

    await updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })

    ElMessage.success('密码修改成功')

    // 清空表单
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    passwordFormRef.value.resetFields()
  } catch (error) {
    if (error !== false) {
      console.error('密码修改失败:', error)
    }
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-section {
  padding: 20px 0;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.info-card,
.password-card {
  margin-bottom: 20px;
  height: 100%; /* 让卡片高度适应内容 */
}
</style>