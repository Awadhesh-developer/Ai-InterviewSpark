export function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) return token

    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'auth_token') {
        return value
      }
    }
  }
  return ''
}


