import { useEffect, useState } from 'react'

import './index.css'
import {
  getArticles,
  getBooks,
  getContent,
  getHistory,
  getProfile,
  login,
  signup,
} from './api'

const tokenStorageKey = 'book-stuff-token'

const initialForm = {
  username: '',
  email: '',
  identifier: '',
  password: '',
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [token, setToken] = useState(() => localStorage.getItem(tokenStorageKey) ?? '')
  const [user, setUser] = useState(null)
  const [books, setBooks] = useState([])
  const [articles, setArticles] = useState([])
  const [history, setHistory] = useState([])
  const [activeSection, setActiveSection] = useState('books')
  const [activeItem, setActiveItem] = useState(null)
  const [isBooting, setIsBooting] = useState(Boolean(localStorage.getItem(tokenStorageKey)))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setIsBooting(false)
      return
    }

    bootstrapAuthenticatedState(token)
  }, [token])

  async function bootstrapAuthenticatedState(sessionToken) {
    setIsBooting(true)
    setError('')

    try {
      const [profileResponse, booksResponse, articlesResponse, historyResponse] =
        await Promise.all([
          getProfile(sessionToken),
          getBooks(sessionToken),
          getArticles(sessionToken),
          getHistory(sessionToken),
        ])

      setUser(profileResponse.user)
      setBooks(booksResponse.items)
      setArticles(articlesResponse.items)
      setHistory(historyResponse.items)
    } catch (requestError) {
      clearSession()
      setError(requestError.message)
    } finally {
      setIsBooting(false)
    }
  }

  function updateFormField(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setStatusMessage('')

    try {
      const response =
        authMode === 'signup'
          ? await signup({
              username: form.username,
              email: form.email,
              password: form.password,
            })
          : await login({
              identifier: form.identifier,
              password: form.password,
            })

      persistSession(response.token, response.user)
      setForm(initialForm)
      setStatusMessage(
        authMode === 'signup'
          ? 'Your account is ready. Explore books and articles below.'
          : 'Welcome back. Your content is unlocked.',
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function persistSession(nextToken, nextUser) {
    localStorage.setItem(tokenStorageKey, nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }

  function clearSession() {
    localStorage.removeItem(tokenStorageKey)
    setToken('')
    setUser(null)
    setBooks([])
    setArticles([])
    setHistory([])
    setActiveItem(null)
    setForm(initialForm)
    setStatusMessage('')
  }

  async function handleRead(type, id) {
    if (!token) {
      setError('Please log in to access books and articles.')
      return
    }

    setIsReading(true)
    setError('')

    try {
      const response = await getContent(token, type, id)
      setActiveItem({
        type,
        ...response.item,
      })

      // Refresh profile-linked history after each protected read.
      const historyResponse = await getHistory(token)
      setHistory(historyResponse.items)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsReading(false)
    }
  }

  const activeCollection = activeSection === 'books' ? books : articles

  return (
    <main className="app-shell">
      <header className="top-nav-wrap">
        <nav className="top-nav" aria-label="Primary navigation">
          <a className="brand" href="/">
            <span className="brand-mark">BS</span>
            <span className="brand-text">book stuff</span>
          </a>

          <div className="nav-links">
            <button
              className={`nav-link ${activeSection === 'books' ? 'is-active' : ''}`}
              onClick={() => setActiveSection('books')}
              type="button"
            >
              Books
            </button>
            <button
              className={`nav-link ${activeSection === 'articles' ? 'is-active' : ''}`}
              onClick={() => setActiveSection('articles')}
              type="button"
            >
              Articles
            </button>
          </div>

          <div className="nav-auth">
            {user ? (
              <>
                <div className="profile-chip" title={`${user.username} (${user.id})`}>
                  <span className="profile-avatar" aria-hidden="true">
                    {user.avatarLabel}
                  </span>
                  <div className="profile-copy">
                    <strong>{user.username}</strong>
                    <span>{user.id.slice(0, 8)}</span>
                  </div>
                </div>
                <button className="nav-ghost" onClick={clearSession} type="button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className={`nav-ghost ${authMode === 'login' ? 'is-active' : ''}`}
                  onClick={() => {
                    setAuthMode('login')
                    setForm(initialForm)
                    setError('')
                    setStatusMessage('')
                  }}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={`nav-cta ${authMode === 'signup' ? 'is-active' : ''}`}
                  onClick={() => {
                    setAuthMode('signup')
                    setForm(initialForm)
                    setError('')
                    setStatusMessage('')
                  }}
                  type="button"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Protected library experience</p>
          <h1>Read books and articles through your own account.</h1>
          <p className="description">
            Secure sign up, login, protected content access, and a personal reading
            history all live together in one responsive interface.
          </p>

          <div className="hero-highlights" aria-label="Platform highlights">
            <span className="highlight-pill">Soft gradient UI</span>
            <span className="highlight-pill">Protected reading</span>
            <span className="highlight-pill">Personal history</span>
          </div>

          {user ? (
            <div className="user-meta-card">
              <h2>Welcome, {user.username}</h2>
              <p>Email: {user.email}</p>
              <p>User ID: {user.id}</p>
            </div>
          ) : (
            <form className="auth-card" onSubmit={handleAuthSubmit}>
              <div className="auth-header">
                <h2>{authMode === 'signup' ? 'Create account' : 'Login to continue'}</h2>
                <p>
                  {authMode === 'signup'
                    ? 'Create a secure account to unlock the library.'
                    : 'Use your email or username to access protected content.'}
                </p>
              </div>

              {authMode === 'signup' ? (
                <label className="field">
                  <span>Username</span>
                  <input
                    name="username"
                    onChange={updateFormField}
                    placeholder="readername"
                    required
                    value={form.username}
                  />
                </label>
              ) : null}

              <label className="field">
                <span>{authMode === 'signup' ? 'Email' : 'Email or username'}</span>
                <input
                  name={authMode === 'signup' ? 'email' : 'identifier'}
                  onChange={updateFormField}
                  placeholder={
                    authMode === 'signup'
                      ? 'reader@example.com'
                      : 'reader@example.com or readername'
                  }
                  required
                  type={authMode === 'signup' ? 'email' : 'text'}
                  value={authMode === 'signup' ? form.email : form.identifier}
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  name="password"
                  onChange={updateFormField}
                  placeholder="Minimum 6 characters"
                  required
                  type="password"
                  value={form.password}
                />
              </label>

              <button className="auth-submit" disabled={isSubmitting} type="submit">
                {isSubmitting
                  ? 'Please wait...'
                  : authMode === 'signup'
                    ? 'Create account'
                    : 'Login'}
              </button>
            </form>
          )}

          {error ? <p className="feedback error-text">{error}</p> : null}
          {statusMessage ? <p className="feedback success-text">{statusMessage}</p> : null}
        </div>

        <aside className="dashboard-panel">
          <div className="dashboard-header">
            <h2>{user ? 'Reading dashboard' : 'Why sign in?'}</h2>
            <p>
              {user
                ? 'Your latest reading activity appears here.'
                : 'Authentication unlocks protected books, articles, and your personal history.'}
            </p>
          </div>

          {user ? (
            <div className="history-list">
              {history.length ? (
                history.slice(0, 6).map((entry) => (
                  <article className="history-card" key={entry.id}>
                    <span className="history-badge">{entry.contentType}</span>
                    <h3>{entry.contentTitle}</h3>
                    <p>{entry.contentAuthor}</p>
                    <time>{new Date(entry.accessedAt).toLocaleString()}</time>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <h3>No history yet</h3>
                  <p>Open a book or article to start building your reading trail.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="guest-points">
              <div className="guest-point">
                <strong>Secure access</strong>
                <span>Passwords are hashed and sessions are token-based.</span>
              </div>
              <div className="guest-point">
                <strong>User profile</strong>
                <span>Your account keeps a unique ID and visible profile details.</span>
              </div>
              <div className="guest-point">
                <strong>Reading history</strong>
                <span>Every book and article read is saved back to your account.</span>
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="content-layout">
        <div className="catalog-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow section-tag">
                {activeSection === 'books' ? 'Books collection' : 'Articles collection'}
              </p>
              <h2>{activeSection === 'books' ? 'Protected books' : 'Protected articles'}</h2>
            </div>
            <span className="count-pill">{activeCollection.length} items</span>
          </div>

          {!user ? (
            <div className="locked-card">
              <h3>Login required</h3>
              <p>
                Only authenticated users can access books and articles. Sign up or log
                in to continue.
              </p>
            </div>
          ) : isBooting ? (
            <div className="locked-card">
              <h3>Loading your library</h3>
              <p>Fetching books, articles, and history for your account.</p>
            </div>
          ) : (
            <div className="content-grid">
              {activeCollection.map((item) => (
                <article className="content-card" key={item.id}>
                  <span className="content-type">
                    {activeSection === 'books' ? item.genre : item.topic}
                  </span>
                  <h3>{item.title}</h3>
                  <p className="content-author">{item.author}</p>
                  <p>{item.description ?? item.summary}</p>
                  <button
                    className="read-button"
                    onClick={() => handleRead(activeSection === 'books' ? 'book' : 'article', item.id)}
                    type="button"
                  >
                    Read now
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="reader-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow section-tag">Reader</p>
              <h2>Current content</h2>
            </div>
          </div>

          {activeItem ? (
            <article className="reader-card">
              <span className="history-badge">{activeItem.type}</span>
              <h3>{activeItem.title}</h3>
              <p className="content-author">{activeItem.author}</p>
              <p className="reader-body">{activeItem.content}</p>
            </article>
          ) : (
            <div className="empty-state reader-empty">
              <h3>{isReading ? 'Opening content...' : 'Nothing open yet'}</h3>
              <p>
                {user
                  ? 'Choose a book or article to read. Each access is saved to your history.'
                  : 'Your reader will appear here after login and content selection.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
