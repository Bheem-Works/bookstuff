const configuredApiBase = import.meta.env.VITE_API_URL?.trim()
const fallbackApiOrigin =
  typeof window !== 'undefined' && window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : 'http://localhost:4000'

const API_BASE = (
  configuredApiBase
    ? configuredApiBase
    : import.meta.env.DEV
      ? '/api'
      : `${fallbackApiOrigin}/api`
).replace(/\/$/, '')

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`

  let response

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      ...options,
    })
  } catch (error) {
    console.error('API network error:', url, error)
    throw new Error(
      `Unable to reach the API at ${API_BASE}. Make sure the backend server is running and CORS is allowed.`,
    )
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const message =
      typeof data === 'object' && data?.message
        ? data.message
        : typeof data === 'string' && data.trim()
          ? data
          : `Request failed with status ${response.status}.`

    console.error('API response error:', {
      url,
      status: response.status,
      message,
      data,
    })

    throw new Error(message)
  }

  return data
}

export function signup(payload) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: payload.identifier,
      password: payload.password,
    }),
  })
}

export function getProfile(token) {
  return request('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getBooks(token) {
  return request('/books', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getArticles(token) {
  return request('/articles', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getContent(token, type, id) {
  return request(`/content/${type}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getHistory(token) {
  return request('/history', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
