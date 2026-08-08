// Composable: useAuth
// Handles login, register, logout and stores the JWT token in a cookie
export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const token = useCookie('notes_token', { maxAge: 60 * 60 * 24 * 7 })
  const user = useState<Record<string, unknown> | null>('auth_user', () => null)

  const isLoggedIn = computed(() => !!token.value)

  const apiFetch = async (path: string, opts: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string>),
    }
    if (token.value) {
      headers['Authorization'] = 'Bearer ' + token.value
    }

    const res = await fetch(`${apiBase}${path}`, { ...opts, headers })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Request failed')
    return json
  }

  const login = async (loginField: string, password: string) => {
    const json = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginField, password }),
    })
    token.value = json.data.access_token
    user.value = json.data.user
  }

  const register = async (username: string, email: string, password: string) => {
    const json = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
    token.value = json.data.access_token
    user.value = json.data.user
  }

  const logout = async () => {
    try { await apiFetch('/api/auth/logout', { method: 'DELETE' }) } catch {}
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  const fetchMe = async () => {
    if (!token.value) return
    try {
      const json = await apiFetch('/api/auth/me')
      user.value = json.data
    } catch {
      token.value = null
      user.value = null
    }
  }

  return { token, user, isLoggedIn, apiFetch, login, register, logout, fetchMe }
}
