<div align="center">

# Interactive Comments Section

A responsive conversation interface with threaded replies, voting, and persistent comments.

**HTML · CSS · Vanilla JavaScript · localStorage**

[Source code](https://github.com/CodexTalha/interactive-comments-section) · [Explore the challenge](https://www.frontendmentor.io/challenges/interactive-comments-section-iG1RugEG9) · [GitHub profile](https://github.com/CodexTalha) · [Screenshots](#screenshots) · [Getting started](#getting-started)

</div>

![Desktop view of the comments section with an open reply form](./screenshots/Screenshot%202026-10-21%20214128.png)

## Table of contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Built with](#built-with)
- [Getting started](#getting-started)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Accessibility and input handling](#accessibility-and-input-handling)
- [Testing](#testing)
- [Development notes](#development-notes)
- [Future improvements](#future-improvements)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

## Overview

This project is a solution to the **Interactive comments section** challenge from Frontend Mentor. It recreates the supplied desktop and mobile designs while adding working comment management with plain JavaScript.

Users can participate as the demo user, `juliusomo`: write a comment, reply within a conversation, vote on contributions, and manage their own posts. Changes stay in the same browser after a refresh.

## Screenshots

### Desktop and reply composer

The desktop preview above shows the comment cards, voting controls, and reply form.

### Delete confirmation

![Delete confirmation dialog with cancel and confirm controls](./screenshots/Screenshot%202026-10-21%20214146.png)

### Mobile layout

<img src="./screenshots/Screenshot%202026-10-21%20214317.png" alt="Mobile layout showing stacked comments, nested replies, and voting controls" width="375">

## Features

- **Comments and replies:** add new comments and reply to either a top-level comment or an existing reply.
- **Threaded conversations:** replies appear beneath their parent comment and include an `@username` mention.
- **Editing:** update your own comments and replies, or cancel without saving.
- **Deletion:** confirm before deleting, cancel with the button, or dismiss the dialog with Escape.
- **Voting:** upvote, downvote, switch your vote, or remove it by clicking the same control again.
- **Sorting:** top-level comments are ordered by score; replies remain in insertion order.
- **Persistence:** comments, replies, edits, deletions, and votes are saved with `localStorage`.
- **Relative dates:** newly created comments and replies show a relative age whenever rendered.
- **Responsive presentation:** comment controls and forms adapt to mobile and desktop widths.
- **Validation:** empty and whitespace-only submissions are rejected; inputs allow up to 5,000 characters.
- **Graceful fallback:** invalid saved data does not stop the interface from loading, and unavailable storage produces a status message when saving is attempted.

## Built with

| Technology | Purpose |
| --- | --- |
| Semantic HTML | Comment articles, forms, labels, reply lists, and a native dialog |
| CSS custom properties | Shared colors and consistent styling |
| CSS Grid and Flexbox | Responsive cards, headers, controls, and forms |
| Vanilla JavaScript | Rendering, event handling, comment state, and validation |
| Fetch API | Loading initial comments from `data.json` when served locally |
| Web Storage API | Saving state between browser sessions |
| Rubik / Google Fonts | Typography, with a sans-serif fallback |

There are no application dependencies, frameworks, or build tools to install.

## Getting started

1. Download the project and extract it into a folder.
2. Open the folder in your editor.
3. Open `index.html` using VS Code Live Server or another local static server.

You can also open `index.html` directly in a modern browser. In that mode, JavaScript reads the initial comments from the HTML instead of fetching `data.json`.

An internet connection is needed to load Rubik from Google Fonts; the interface uses a system sans-serif fallback if it cannot load.

### Reset the demo

To restore the initial comments, run this in the browser's developer console on the project page, then refresh:

```js
localStorage.removeItem("interactive-comments-v1");
location.reload();
```

This removes this project's saved comments and votes. It does not clear unrelated browser storage.

## How it works

### Loading and saving

On startup, the app checks for valid saved state. If none is available, it loads `data.json` when served over HTTP, or reads the static HTML as a fallback. After a change, it saves the updated state in the browser.

### Voting behavior

Each comment supports one active vote in the current browser state:

| Action | Effect |
| --- | --- |
| Click `+` with no active vote | Add one point |
| Click `+` again | Remove the upvote |
| Click `−` with no active vote | Subtract one point |
| Click `−` again | Remove the downvote |
| Switch from `+` to `−` | Remove the upvote and apply a downvote: a two-point decrease |

Repeated clicks do not create unlimited votes.

### Replies and ownership

Replies to an existing reply are appended to the same parent thread, with a mention identifying the person being addressed. Edit and Delete controls are shown for the demo user's own contributions, and JavaScript checks ownership before making those changes.

This is a frontend demo with a fixed current user. It does not provide authentication, a backend, or shared conversations between browsers or devices. Ownership checks demonstrate the interface behavior; server-side authorization would be needed for a multi-user service.

## Project structure

```text
interactive-comments-section-main/
├── design/          # Supplied challenge design references
├── images/          # Avatars, icons, and favicon
├── screenshots/     # Screenshots of the implementation
├── data.json        # Initial comments and demo user
├── index.html       # Initial markup, comment form, and dialog
├── script.js        # Rendering, interactions, and persistence
├── style.css        # Responsive styles and component rules
├── style-guide.md   # Supplied colors and typography
└── README.md        # Project documentation
```

## Accessibility and input handling

- Comment contributions use `<article>` elements; ordered lists group replies.
- Textareas have associated labels, and voting buttons have descriptive accessible names.
- `aria-pressed` communicates whether an upvote or downvote is selected.
- Visible focus outlines support keyboard navigation.
- A native `<dialog>` provides modal interaction and Escape dismissal, with Cancel focused initially.
- Focus moves to a newly added or updated comment, returns to the trigger after cancellation, or moves to the new-comment field after deletion.
- A polite live region announces changes and storage problems.
- User content is inserted as text rather than HTML, so typed markup is displayed as content.

These are implemented accessibility features, not a claim of a complete accessibility audit.

## Testing

Browser automation was run in headless Microsoft Edge during development, covering:

- Creating comments and replying to both comments and replies.
- Editing a comment and preserving changes after refresh.
- Vote toggling and switching between upvotes and downvotes.
- Canceling deletion, dismissing with Escape, and confirming deletion.
- Persisting comment changes and deletions after refresh.
- Recovering from invalid stored state.
- Opening the project directly through `file://`.
- Rendering HTML-like user input as plain text.
- Checking for horizontal overflow at **320px, 375px, 768px, and 1440px**.

Desktop, mobile, and dialog screenshots were also visually reviewed. The temporary browser test script is not included in this repository.

## Development notes

The project began with HTML structure, then CSS foundations, and finally the complete interactive implementation. The main techniques demonstrated are:

- Reusing component classes across comments and replies.
- Combining CSS Grid for card layout with Flexbox for smaller groups of controls.
- Keeping comment data in a state object and rendering the interface from that data.
- Using event delegation to handle dynamically rendered comment controls.
- Validating saved state before using it and handling storage failures.
- Preserving user text safely with `textContent` and text nodes.

## Future improvements

- Add a backend and real user authentication for shared conversations.
- Expand automated checks across browsers and assistive technologies.
- Refresh relative timestamps without requiring another render.
- Add an explicit in-app reset control for the demo data.

## Author

**Muhammad Talha Khan**

- GitHub: [@CodexTalha](https://github.com/CodexTalha)
- LinkedIn: [Talha Khan](https://www.linkedin.com/in/talha-khan-2608aa384)

## Acknowledgments

Design, avatars, icons, and initial comment data were supplied by [Frontend Mentor](https://www.frontendmentor.io). This project implements the [Interactive comments section challenge](https://www.frontendmentor.io/challenges/interactive-comments-section-iG1RugEG9).
