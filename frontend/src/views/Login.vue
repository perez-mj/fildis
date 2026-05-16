<!-- frontend/src/views/Login.vue -->
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <!-- Decorative accent element -->
        <div class="accent-shape"></div>
        
        <v-card class="login-card elevation-0">
          <!-- Logo/Brand section -->
          <div class="text-center mb-6">
            <v-icon 
              icon="mdi-school-outline" 
              size="48" 
              color="primary"
              class="mb-3"
            ></v-icon>
            <h1 class="text-h5 font-weight-light mb-1">Welcome Back</h1>
            <p class="text-body-2 text-medium-emphasis">Sign in to continue to LMS</p>
          </div>

          <v-card-text class="pa-0">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Email address"
                name="email"
                prepend-inner-icon="mdi-email-outline"
                type="email"
                variant="outlined"
                density="comfortable"
                required
                :error-messages="emailError ? 'Email is required' : ''"
                class="mb-2"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                density="comfortable"
                required
                @click:append-inner="showPassword = !showPassword"
                :error-messages="passwordError ? 'Password is required' : ''"
                class="mb-1"
              ></v-text-field>

              <div class="d-flex justify-end mb-4">
                <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  class="text-caption"
                  @click="forgotPassword"
                >
                  Forgot password?
                </v-btn>
              </div>

              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-4"
                closable
                @click:close="error = ''"
              >
                {{ error }}
              </v-alert>

              <v-btn
                color="primary"
                type="submit"
                block
                size="large"
                :loading="loading"
                class="login-btn"
                rounded="lg"
              >
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider class="my-4"></v-divider>

          <div class="text-center">
            <p class="text-caption text-medium-emphasis mb-0">
              Demo credentials:
            </p>
            <div class="demo-creds">
              <v-chip size="x-small" variant="outlined" color="info" class="ma-1">
                student@lms.com / student123
              </v-chip>
              <v-chip size="x-small" variant="outlined" color="warning" class="ma-1">
                teacher@lms.com / teacher123
              </v-chip>
              <v-chip size="x-small" variant="outlined" color="error" class="ma-1">
                admin@lms.com / admin123
              </v-chip>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const emailError = ref(false)
const passwordError = ref(false)
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

const handleLogin = async () => {
  // Basic validation
  emailError.value = !email.value
  passwordError.value = !password.value
  
  if (emailError.value || passwordError.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.login(email.value, password.value)
    
    // Redirect based on role
    const role = authStore.userRole
    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else if (role === 'teacher') {
      router.push('/teacher/dashboard')
    } else if (role === 'student') {
      router.push('/student/dashboard')
    }
  } catch (err) {
    error.value = 'Invalid email or password'
  } finally {
    loading.value = false
  }
}

const forgotPassword = () => {
  // Implement forgot password logic
  console.log('Forgot password clicked')
}
</script>

<style scoped>
/* Minimalist calm theme styling */
.fill-height {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
  position: relative;
}

/* Decorative accent element */
.accent-shape {
  position: absolute;
  top: 10%;
  right: -20px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.03);
  pointer-events: none;
  z-index: 0;
}

.accent-shape::before {
  content: '';
  position: absolute;
  bottom: -30px;
  left: -30px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(var(--v-theme-secondary), 0.03);
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(0px);
  border-radius: 24px;
  padding: 32px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

@media (max-width: 600px) {
  .login-card {
    padding: 24px;
  }
}

/* Custom input styling */
:deep(.v-field) {
  border-radius: 12px;
  transition: all 0.2s ease;
}

:deep(.v-field:hover) {
  transform: translateY(-1px);
}

:deep(.v-field--focused) {
  transform: translateY(-1px);
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.15;
}

/* Login button styling */
.login-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.2);
}

/* Demo credentials styling */
.demo-creds {
  margin-top: 8px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.demo-creds:hover {
  opacity: 1;
}

/* Smooth transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>