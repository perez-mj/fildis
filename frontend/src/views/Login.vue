<!-- frontend/src/views/Login.vue -->
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="fill-height ma-0">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3" class="px-3 px-sm-4">
        <!-- Decorative accent elements - hidden on mobile -->
        <div class="accent-shape d-none d-sm-block"></div>
        
        <v-card class="login-card">
          <!-- Logo/Brand section -->
          <div class="text-center mb-4 mb-sm-6">
            <v-icon 
              icon="mdi-school-outline" 
              size="40"
              :size="$vuetify.display.mobile ? 36 : 48"
              color="primary"
              class="mb-2 mb-sm-3"
            ></v-icon>
            <h1 class="text-h6 text-sm-h5 font-weight-light mb-1">Welcome Back</h1>
            <p class="text-caption text-sm-body-2 text-medium-emphasis">Sign in to continue to SIKHAY-ARAL LMS</p>
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
                class="mb-2 mb-sm-3"
                hide-details="auto"
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
                hide-details="auto"
              ></v-text-field>

              <div class="d-flex justify-end mt-1 mb-3 mb-sm-4">
                <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  class="text-caption"
                  @click="forgotPassword"
                  rounded="pill"
                >
                  Forgot password?
                </v-btn>
              </div>

              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-3 mb-sm-4"
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
                rounded="pill"
              >
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider class="my-3 my-sm-4"></v-divider>

          <div class="text-center">
            <p class="text-caption text-medium-emphasis mb-1">Demo credentials:</p>
            <div class="demo-creds d-flex flex-wrap justify-center">
              <v-chip 
                size="x-small" 
                variant="outlined" 
                color="info" 
                class="ma-1"
                @click="fillCredentials('student@lms.com', 'student123')"
              >
                student@lms.com / student123
              </v-chip>
              <v-chip 
                size="x-small" 
                variant="outlined" 
                color="primary" 
                class="ma-1"
                @click="fillCredentials('teacher@lms.com', 'teacher123')"
              >
                teacher@lms.com / teacher123
              </v-chip>
              <v-chip 
                size="x-small" 
                variant="outlined" 
                color="error" 
                class="ma-1"
                @click="fillCredentials('admin@lms.com', 'admin123')"
              >
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
import { useDisplay } from 'vuetify'

const authStore = useAuthStore()
const router = useRouter()
const { mobile } = useDisplay()

const email = ref('')
const password = ref('')
const emailError = ref(false)
const passwordError = ref(false)
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

const fillCredentials = (demoEmail, demoPassword) => {
  email.value = demoEmail
  password.value = demoPassword
  error.value = ''
  emailError.value = false
  passwordError.value = false
}

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
  console.log('Forgot password clicked')
}
</script>

<style scoped>
/* Base layout */
.fill-height {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  position: relative;
  min-height: 100vh;
}

/* Remove default margins on mobile */
.fill-height .v-row {
  margin: 0;
}

/* Decorative accent elements - hidden on mobile */
.accent-shape {
  position: absolute;
  top: 10%;
  right: -20px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.03);
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
  background: rgba(16, 185, 129, 0.03);
}

/* Login card - fully responsive */
.login-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  position: relative;
  z-index: 1;
  border: 1px solid #E2E8F0;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Tablet and up */
@media (min-width: 600px) {
  .login-card {
    padding: 32px;
  }
}

/* Small mobile */
@media (max-width: 400px) {
  .login-card {
    padding: 20px;
    border-radius: 20px;
  }
}

/* Custom input styling */
:deep(.v-field) {
  border-radius: 12px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-btn:hover {
  transform: translateY(-1px);
}

/* Demo credentials styling */
.demo-creds {
  margin-top: 8px;
  opacity: 0.7;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.demo-creds:hover {
  opacity: 1;
}

.demo-creds .v-chip {
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.demo-creds .v-chip:hover {
  transform: translateY(-1px);
}

/* Responsive text adjustments */
@media (max-width: 600px) {
  .text-h5 {
    font-size: 1.25rem !important;
  }
  
  .text-h6 {
    font-size: 1.125rem !important;
  }
}

/* Prevent zoom on input focus on iOS */
@media (max-width: 600px) {
  input, 
  .v-field input {
    font-size: 16px !important;
  }
}

/* Smooth transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>