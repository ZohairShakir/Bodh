# Responsive Navbar Implementation Plan

The user reported that the landing page navbar is redundant on mobile and lacks a functional hamburger menu. I will consolidate the navbar logic into a single responsive component and remove duplicate code.

## Proposed Changes

### [web]

#### [MODIFY] [Navbar.jsx](file:///c:/Users/zohai/Documents/hackathon%2031%20march/web/src/components/Navbar.jsx)
- Use `useState` to manage `isMenuOpen`.
- Implement a responsive structure:
    - Left: Logo.
    - Right: "Try Bodh" (visible on all) and Hamburger button (visible on mobile).
    - Center (Desktop): Links "How it works", "Features", etc.
- Add a mobile slide-down or overlay menu.
- Ensure the logo links to the top of the page.

#### [MODIFY] [Home.jsx](file:///c:/Users/zohai/Documents/hackathon%2031%20march/web/src/pages/Home.jsx)
- Delete the redundant `.top-logo` and `<nav>` blocks at lines 130-150.
- Import and insert the `<Navbar />` component at the top of the return block.

#### [MODIFY] [index.css](file:///c:/Users/zohai/Documents/hackathon%2031%20march/web/src/index.css)
- Refine existing `nav` and `.nav-links` styles for mobile.
- Add `.hamburger` and `.mobile-menu-overlay` styles.
- Ensure the fixed logo link at the top-left is integrated into the navbar or handled consistently.

## Verification Plan

### Manual Verification
- Resize browser to < 820px.
- Confirm links vanish and hamburger appears.
- Confirm clicking hamburger opens menu.
- Confirm clicking a menu item closes the menu and scrolls.
- Confirm "Try Bodh" is always visible.
