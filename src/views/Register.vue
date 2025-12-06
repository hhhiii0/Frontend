<template>
  <div class="register-container">
    <!-- 背景层：承载medical-bg.png + 浅蓝底层 -->
    <div class="register-bg-wrapper">
      <img
          src="@/assets/medical-bg.png"
          alt="AI智能问答系统背景"
          class="register-bg-img"
      />
      <!-- 背景文字：统一风格，避免覆盖 -->
      <div class="irregular-text">
        <h2>AI智能问答系统</h2>
        <p>智能高效 · 让问答更简单</p>
      </div>
    </div>

    <!-- 注册卡片：优化布局间距 -->
    <div class="register-card-wrapper">
      <el-card class="register-form-card">
        <template #header>
          <div class="card-header">
            <span class="title">账号注册</span>
          </div>
        </template>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="70px" style="margin-top: 10px;">
          <el-form-item label="用户名" prop="username" style="margin-bottom: 18px;">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email" style="margin-bottom: 18px;">
            <el-input v-model="form.email" placeholder="请输入邮箱（可选）" />
          </el-form-item>

          <el-form-item label="密码" prop="password" style="margin-bottom: 18px;">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword" style="margin-bottom: 18px;">
            <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                @keyup.enter="handleRegister"
            />
          </el-form-item>

          <el-form-item style="margin-bottom: 18px;">
            <el-button type="primary" @click="handleRegister" :loading="loading" style="width: 100%">
              注册
            </el-button>
          </el-form-item>

          <el-form-item>
            <el-button text @click="$router.push('/login')" style="width: 100%">
              已有账号？立即登录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    const { confirmPassword, ...registerData } = form.value
    const result = await register(registerData)

    userStore.setToken(result.token)
    userStore.setUserInfo(result.user)

    ElMessage.success('注册成功')
    router.push('/')
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage.error('注册失败，请检查输入信息')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 整体容器：浅蓝底层背景，全屏布局 */
.register-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f7ff;
  overflow: hidden;
}

/* 背景层：承载背景图 */
.register-bg-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 背景图片：半透明融合底层 */
.register-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.9;
}

/* 背景文字：调整top避免与卡片重叠 */
.irregular-text {
  position: absolute;
  top: 15%; /* 从25%改为15%，拉开与卡片的距离 */
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  z-index: 2;
  text-align: center;
}

.irregular-text h2 {
  font-size: 42px;
  font-weight: bold;
  font-family: "Comic Sans MS", cursive;
  margin-bottom: 15px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.irregular-text p {
  font-size: 18px;
  opacity: 0.9;
  font-family: "Comic Sans MS", cursive;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 注册卡片容器：居中展示 */
.register-card-wrapper {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 450px;
  padding: 0 20px;
}

/* 注册卡片：优化内边距和阴影 */
.register-form-card {
  background-color: #fff;
  border-radius: 20px !important;
  box-shadow: 0 12px 32px rgba(58, 123, 213, 0.18);
  border: none;
  padding: 30px 25px; /* 调整内边距更舒展 */
  transition: all 0.3s ease;
}

/* 卡片悬停效果 */
.register-form-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(58, 123, 213, 0.25);
}

.card-header .title {
  font-size: 26px;
  font-weight: bold;
  color: #3a7bd5;
  text-align: center;
  margin-bottom: 20px; /* 优化标题与表单的间距 */
  display: block;
}

/* 适配小屏幕 */
@media (max-width: 768px) {
  .irregular-text {
    top: 12%;
  }
  .irregular-text h2 {
    font-size: 32px;
  }
  .register-form-card {
    padding: 25px 20px;
  }
}
</style>