<template>
  <div class="auth-wrap">
    <div class="auth-card card">
      <h1 class="auth-title">📝 Notes</h1>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <!-- Login form -->
      <form v-if="mode === 'login'" @submit.prevent="doLogin">
        <div class="form-group">
          <label>Email or Username</label>
          <input v-model="loginField" type="text" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <!-- Register form -->
      <form v-else @submit.prevent="doRegister">
        <div class="form-group">
          <label>Username</label>
          <input v-model="username" type="text" placeholder="johndoe" required minlength="3" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="min 6 chars" required minlength="6" />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%" :disabled="busy">
          {{ busy ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="toggle-link">
        <span v-if="mode === 'login'">No account?
          <button @click="switchMode('register')">Register</button>
        </span>
        <span v-else>Already have an account?
          <button @click="switchMode('login')">Sign in</button>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { login, register, isLoggedIn } = useAuth()

if (isLoggedIn.value) await navigateTo('/')

const mode = ref<'login' | 'register'>('login')
const loginField = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

const switchMode = (m: 'login' | 'register') => {
  mode.value = m
  error.value = ''
}

const doLogin = async () => {
  error.value = ''
  busy.value = true
  try {
    await login(loginField.value, password.value)
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

const doRegister = async () => {
  error.value = ''
  busy.value = true
  try {
    await register(username.value, email.value, password.value)
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>
