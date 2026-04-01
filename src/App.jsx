function App() {
  return (
    <main className="app-shell">
      <header className="top-nav-wrap">
        <nav className="top-nav" aria-label="Primary navigation">
          <a className="brand" href="/">
            <span className="brand-mark">BS</span>
            <span className="brand-text">book stuff</span>
          </a>

          <div className="nav-actions">
            <div className="nav-links">
              <a href="#discover">Discover</a>
              <a href="#library">Library</a>
              <a href="#authors">Authors</a>
              <a href="#reviews">Reviews</a>
            </div>

            <button className="nav-cta" type="button">
              Read Now
            </button>
          </div>
        </nav>
      </header>

      <section className="hero-panel">
        <p className="eyebrow">Curated stories, modern shelf</p>
        <h1>Bring your reading world into one elegant place.</h1>
        <p className="description">
          Browse titles, save favorites, and follow authors through a clean
          interface built around a rich deep-blue mood.
        </p>
      </section>
    </main>
  )
}

export default App
