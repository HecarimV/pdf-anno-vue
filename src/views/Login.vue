<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo">
        <div class="logo-text">
          <span class="pdf">PDF</span>
          <span class="note">Note</span>
        </div>
      </div>
      <div class="title">PDF 标注系统</div>
      
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { auth } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loginFormRef = ref(null)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = () => {
  loginFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        const response = await auth.login(loginForm.username, loginForm.password)
        localStorage.setItem('token', response.token)
        localStorage.setItem('username', response.username)
        router.push('/files')
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '登录失败')
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.logo {
  text-align: center;
  margin-bottom: 8px;
}

.logo-text {
  font-size: 32px;
  font-weight: bold;
  letter-spacing: -1px;
}

.pdf {
  color: #409EFF;
}

.note {
  color: #303133;
}

.title {
  text-align: center;
  font-size: 24px;
  color: #303133;
  margin-bottom: 40px;
}

.login-btn {
  width: 100%;
  padding: 12px 0;
}

:deep(.el-input__wrapper) {
  padding: 1px 11px;
}

:deep(.el-input__inner) {
  height: 40px;
}
</style> 