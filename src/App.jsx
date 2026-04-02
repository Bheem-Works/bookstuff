import { useEffect, useState } from 'react'

import './index.css'

const accessStorageKey = 'miso-home-library-unlocked'
const libraryStorageKey = 'miso-home-library-items'
const libraryPassword = 'misoloveeggs'
const managementPassword = 'bhimmagar9810'

const sections = [
  {
    id: 'book',
    icon: '📚',
    title: 'Books',
    singularLabel: 'Book',
    description: 'Stories, journals, and beloved reads kept close to the shelf.',
    emptyTitle: 'No books yet',
    emptyText: 'Add your first book with the + Add button.',
  },
  {
    id: 'article',
    icon: '📰',
    title: 'Articles',
    singularLabel: 'Article',
    description: 'Thoughtful notes, essays, and reflections worth returning to.',
    emptyTitle: 'No articles yet',
    emptyText: 'Add your first article with the + Add button.',
  },
  {
    id: 'poetry',
    icon: '🌸',
    title: 'Poetry',
    singularLabel: 'Poetry',
    description: 'Soft lines, verses, and small pieces that deserve quiet space.',
    emptyTitle: 'No poetry yet',
    emptyText: 'Add your first poem with the + Add button.',
  },
]

const initialAddForm = {
  type: 'book',
  title: '',
  author: '',
  description: '',
  content: '',
}

function readStoredItems() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedItems = window.localStorage.getItem(libraryStorageKey)
    const parsedItems = storedItems ? JSON.parse(storedItems) : []
    return Array.isArray(parsedItems) ? parsedItems : []
  } catch {
    return []
  }
}

function createItemId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function parseReaderBlocks(content = '') {
  return content
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line))
      const firstBulletIndex = lines.findIndex((line) => /^[-*•]\s+/.test(line))

      if (bulletLines.length === lines.length) {
        return [
          {
            type: 'list',
            items: bulletLines.map((line) => line.replace(/^[-*•]\s+/, '').trim()),
          },
        ]
      }

      if (
        firstBulletIndex > 0 &&
        lines.slice(firstBulletIndex).every((line) => /^[-*•]\s+/.test(line))
      ) {
        return [
          {
            type: 'paragraph',
            text: lines.slice(0, firstBulletIndex).join(' '),
          },
          {
            type: 'list',
            items: lines
              .slice(firstBulletIndex)
              .map((line) => line.replace(/^[-*•]\s+/, '').trim()),
          },
        ]
      }

      return [
        {
          type: 'paragraph',
          text: lines.join(' '),
        },
      ]
    })
}

function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(accessStorageKey) === 'true'
  })
  const [password, setPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [items, setItems] = useState(() => readStoredItems())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [form, setForm] = useState(initialAddForm)
  const [activeItem, setActiveItem] = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [protectedAction, setProtectedAction] = useState(null)
  const [actionPasswordInput, setActionPasswordInput] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(libraryStorageKey, JSON.stringify(items))
  }, [items])

  function handleUnlock(event) {
    event.preventDefault()

    if (password.trim() !== libraryPassword) {
      setUnlockError('That password does not match.')
      return
    }

    window.localStorage.setItem(accessStorageKey, 'true')
    setIsUnlocked(true)
    setUnlockError('')
    setPassword('')
  }

  function handleLock() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(accessStorageKey)
    }

    setIsUnlocked(false)
    setIsAddOpen(false)
    setActiveItem(null)
    setEditingItemId(null)
    setProtectedAction(null)
    setActionPasswordInput('')
    setActionError('')
    setUnlockError('')
    setPassword('')
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function closeAddPanel() {
    setIsAddOpen(false)
    setForm(initialAddForm)
    setEditingItemId(null)
  }

  function closeProtectedAction() {
    setProtectedAction(null)
    setActionPasswordInput('')
    setActionError('')
  }

  function handleAddItem(event) {
    event.preventDefault()

    const nextItem = {
      id: editingItemId ?? createItemId(),
      type: form.type,
      title: form.title.trim(),
      author: form.author.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
      createdAt:
        items.find((item) => item.id === editingItemId)?.createdAt ??
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setItems((current) => {
      if (editingItemId) {
        return current.map((item) => (item.id === editingItemId ? nextItem : item))
      }

      return [nextItem, ...current]
    })

    if (activeItem?.id === nextItem.id) {
      setActiveItem(nextItem)
    }

    closeAddPanel()
  }

  function openProtectedAction(type, item) {
    setProtectedAction({
      type,
      itemId: item.id,
    })
    setActionPasswordInput('')
    setActionError('')
  }

  function completeEdit(item) {
    setEditingItemId(item.id)
    setForm({
      type: item.type,
      title: item.title,
      author: item.author,
      description: item.description,
      content: item.content,
    })
    setIsAddOpen(true)
  }

  function completeDelete(itemId) {
    setItems((current) => current.filter((item) => item.id !== itemId))

    if (activeItem?.id === itemId) {
      setActiveItem(null)
    }
  }

  function handleProtectedActionSubmit(event) {
    event.preventDefault()

    if (actionPasswordInput.trim() !== managementPassword) {
      setActionError('That management password does not match.')
      return
    }

    const targetItem = items.find((item) => item.id === protectedAction?.itemId)

    if (!targetItem || !protectedAction) {
      closeProtectedAction()
      return
    }

    if (protectedAction.type === 'edit') {
      completeEdit(targetItem)
    }

    if (protectedAction.type === 'delete') {
      completeDelete(targetItem.id)
    }

    closeProtectedAction()
  }

  const readerBlocks = activeItem ? parseReaderBlocks(activeItem.content) : []

  if (!isUnlocked) {
    return (
      <main className="app-shell">
        <section className="password-gate page-fade">
          <div className="gate-copy">
            <p className="eyebrow">Private reading room</p>
            <h1>Home Library</h1>
            <p>
              A warm little library for your own books, articles, and poems. Unlock
              the shelf once and it will stay open until you choose to lock it again.
            </p>
          </div>

          <form className="gate-card" onSubmit={handleUnlock}>
            <label className="field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => {
                  setPassword(event.target.value)
                  setUnlockError('')
                }}
                placeholder="Enter the library password"
                type="password"
                value={password}
              />
            </label>

            {unlockError ? <p className="feedback error-text">{unlockError}</p> : null}

            <button className="primary-button" type="submit">
              Unlock Library
            </button>
          </form>
        </section>
      </main>
    )
  }

  if (activeItem) {
    return (
      <main className="app-shell">
        <section className="reader-shell page-fade">
          <div className="reader-toolbar">
            <button className="back-button" onClick={() => setActiveItem(null)} type="button">
              ← Back to Library
            </button>
            <div className="reader-actions">
              <button
                className="secondary-button"
                onClick={() => openProtectedAction('edit', activeItem)}
                type="button"
              >
                Edit
              </button>
              <button
                className="lock-button"
                onClick={() => openProtectedAction('delete', activeItem)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>

          <article className={`reader-page reader-${activeItem.type}`}>
            <p className="eyebrow">
              {sections.find((section) => section.id === activeItem.type)?.title ?? 'Reading'}
            </p>
            <h1 className="reader-title">{activeItem.title}</h1>
            <p className="reader-author">by {activeItem.author}</p>
            {activeItem.description ? (
              <p className="reader-description">{activeItem.description}</p>
            ) : null}

            <div className="reader-content">
              {readerBlocks.map((block, index) =>
                block.type === 'list' ? (
                  <ul className="reader-list" key={`${activeItem.id}-list-${index}`}>
                    {block.items.map((entry) => (
                      <li key={`${activeItem.id}-list-item-${index}-${entry}`}>{entry}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={`${activeItem.id}-paragraph-${index}`}>{block.text}</p>
                ),
              )}
            </div>
          </article>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="library-shell page-fade">
        <header className="library-hero">
          <div>
            <p className="eyebrow">Private reading room</p>
            <h1>Home Library</h1>
            <p className="hero-text">
              Your books, articles, and poems live here in one calm, uncluttered
              space. Everything is manually added and stored in your browser.
            </p>
          </div>

          <div className="hero-actions">
            <button className="lock-button" onClick={handleLock} type="button">
              Lock
            </button>
            <button
              className="primary-button add-button"
              onClick={() => {
                setEditingItemId(null)
                setForm(initialAddForm)
                setIsAddOpen(true)
              }}
              type="button"
            >
              + Add
            </button>
          </div>
        </header>

        {sections.map((section) => {
          const sectionItems = items.filter((item) => item.type === section.id)

          return (
            <section
              className={`library-section section-${section.id}`}
              key={section.id}
            >
              <div className="section-heading">
                <div>
                  <h2>{section.icon} {section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <span className="count-pill">{sectionItems.length}</span>
              </div>

              {sectionItems.length ? (
                <div className="card-grid">
                  {sectionItems.map((item) => (
                    <article className={`library-card card-${section.id}`} key={item.id}>
                      <span className="card-label">{section.singularLabel}</span>
                      <h3>{item.title}</h3>
                      <p className="card-author">{item.author}</p>
                      <p className="card-description">{item.description}</p>
                      <div className="card-actions">
                        <button
                          className="card-action card-action-open"
                          onClick={() => setActiveItem(item)}
                          type="button"
                        >
                          Open
                        </button>
                        <button
                          className="card-action"
                          onClick={() => openProtectedAction('edit', item)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="card-action card-action-delete"
                          onClick={() => openProtectedAction('delete', item)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-card">
                  <h3>{section.emptyTitle}</h3>
                  <p>{section.emptyText}</p>
                </div>
              )}
            </section>
          )
        })}
      </section>

      {isAddOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="add-content-title"
            aria-modal="true"
            className="add-panel page-fade"
            role="dialog"
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow">Add content</p>
                <h2 id="add-content-title">
                  {editingItemId ? 'Update your shelf item' : 'Place something new on the shelf'}
                </h2>
              </div>
              <button className="close-button" onClick={closeAddPanel} type="button">
                Close
              </button>
            </div>

            <form className="add-form" onSubmit={handleAddItem}>
              <label className="field">
                <span>Section</span>
                <select name="type" onChange={handleFormChange} value={form.type}>
                  <option value="book">Book</option>
                  <option value="article">Article</option>
                  <option value="poetry">Poetry</option>
                </select>
              </label>

              <label className="field">
                <span>Title</span>
                <input
                  name="title"
                  onChange={handleFormChange}
                  placeholder="Give it a title"
                  required
                  value={form.title}
                />
              </label>

              <label className="field">
                <span>Author</span>
                <input
                  name="author"
                  onChange={handleFormChange}
                  placeholder="Who wrote it?"
                  required
                  value={form.author}
                />
              </label>

              <label className="field">
                <span>Short Description</span>
                <textarea
                  name="description"
                  onChange={handleFormChange}
                  placeholder="A short note for the card"
                  required
                  rows="3"
                  value={form.description}
                />
              </label>

              <label className="field">
                <span>Content</span>
                <textarea
                  name="content"
                  onChange={handleFormChange}
                  placeholder="Paste or write the full text here"
                  required
                  rows="10"
                  value={form.content}
                />
              </label>

              <div className="form-actions">
                <button className="secondary-button" onClick={closeAddPanel} type="button">
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  {editingItemId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {protectedAction ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="management-password-title"
            aria-modal="true"
            className="auth-panel page-fade"
            role="dialog"
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow">Protected action</p>
                <h2 id="management-password-title">
                  {protectedAction.type === 'edit' ? 'Enter password to update' : 'Enter password to delete'}
                </h2>
              </div>
              <button className="close-button" onClick={closeProtectedAction} type="button">
                Close
              </button>
            </div>

            <form className="auth-form" onSubmit={handleProtectedActionSubmit}>
              <label className="field">
                <span>Management Password</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => {
                    setActionPasswordInput(event.target.value)
                    setActionError('')
                  }}
                  placeholder="Enter the update/delete password"
                  type="password"
                  value={actionPasswordInput}
                />
              </label>

              {actionError ? <p className="feedback error-text">{actionError}</p> : null}

              <div className="form-actions">
                <button
                  className="secondary-button"
                  onClick={closeProtectedAction}
                  type="button"
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Continue
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
