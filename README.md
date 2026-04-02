# Home Library

Home Library is a warm, cozy personal reading web app built with React and Vite. It opens behind a simple password gate and gives you three clean shelves for manually added books, articles, and poetry. Everything is stored locally in the browser, so the library feels private, lightweight, and easy to return to.

## Features List

- Simple password gate with the password `misoloveeggs`
- Unlock state remembered in `localStorage`
- Subtle `Lock` button to re-lock the library at any time
- Separate management password `bhimmagar9810` required for edit and delete actions
- Three content sections: Books, Articles, and Poetry
- Clean content cards with title, author, and short description
- Manual add flow for books, articles, and poems
- Edit and delete flow for every saved library item
- Full reader page with centered layout and `← Back to Library`
- `localStorage` persistence for all manually added content
- Fully responsive layout for mobile, tablet, and desktop
- Warm earthy palette with softer hover states and page transitions

## Color Theme Reference

- Background: `#FAF6F1`
- Primary Text: `#2C2C2C`
- Headings: `#3B2F2F`
- Accent / Buttons: `#A0522D`
- Cards: `#FFFFFF`
- Card Border: `#E8DDD4`
- Poetry Section Accent: `#7B6D8D`
- Hover Highlight: `#F0E6DA`

## Changelog / Life Process

### Built First

- The project originally started as a fuller reading app structure with protected content flows and a more complex account-based approach.

### Changed Next

- The app was simplified into a local-first home library so it matched a quieter, more personal use case.
- Login and signup were removed in favor of a single password gate because the goal shifted from account management to a private bookshelf experience.
- The home page was rebuilt around manually added content only, so the interface no longer depends on pre-filled items.
- A reader page replaced the old in-place reading panel to create a calmer and more focused reading experience.

### Improved Over Time

- The warm visual design was refined around a soft earthy palette and paper-like cards.
- Hover and transition animations were softened so movement feels elegant instead of busy.
- A third Poetry section was added to give short-form writing its own shelf and accent color.
- A `Lock` button was added so the remembered password gate can still be closed on demand.
- Editing and deleting were added so saved items can be maintained instead of only accumulated.
- The layout was made more responsive so the app reads well across desktop, tablet, and mobile screens.
- The README was rewritten so the project documentation reflects the current app instead of the earlier backend-auth version.

## How to Use

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Open the local Vite URL in your browser.
4. Enter the password `misoloveeggs`.
5. Use `+ Add` to create a Book, Article, or Poetry entry.
6. Click any card to open it in the reader page.
7. Use `Edit` or `Delete` on cards or inside the reader page, then enter `bhimmagar9810` when prompted.
8. Use `Lock` whenever you want to close the library again.

## Known Limitations

- Content is stored only in browser `localStorage`, so it will not sync across browsers or devices.
- The password gate is intentionally simple and is not secure authentication.
- Older backend files still exist in the repository, but the current UI works locally in the frontend and does not depend on them.
- The unlock password and management password are hardcoded for this personal-use experience.
