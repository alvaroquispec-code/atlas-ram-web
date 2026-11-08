const REFRESH_KEY = 'atlasram.refreshToken'

let accessToken: string | null = null

export const tokenStorage = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string | null) => {
    accessToken = token
  },
  getRefreshToken: () => sessionStorage.getItem(REFRESH_KEY),
  setRefreshToken: (token: string | null) => {
    if (token) sessionStorage.setItem(REFRESH_KEY, token)
    else sessionStorage.removeItem(REFRESH_KEY)
  },
  clear: () => {
    accessToken = null
    sessionStorage.removeItem(REFRESH_KEY)
  },
}
