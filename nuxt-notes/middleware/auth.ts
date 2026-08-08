// Middleware: auth — redirect unauthenticated users to /login
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('notes_token')
  if (!token.value) {
    return navigateTo('/login')
  }
})
