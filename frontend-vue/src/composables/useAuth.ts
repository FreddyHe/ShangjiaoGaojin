import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const token = ref(localStorage.getItem('token') || '')
const username = ref(localStorage.getItem('username') || '')
const role = ref(localStorage.getItem('role') || '')

export function useAuth() {
  const router = useRouter()

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')

  const login = (newToken: string, newUsername: string, newRole: string) => {
    token.value = newToken
    username.value = newUsername
    role.value = newRole
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', newUsername)
    localStorage.setItem('role', newRole)
  }

  const logout = () => {
    token.value = ''
    username.value = ''
    role.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    router.push('/login')
  }

  return {
    token,
    username,
    role,
    isLoggedIn,
    isAdmin,
    login,
    logout
  }
}
