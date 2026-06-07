
Skill: Secure Asset Shield

Context

Use this skill when styling premium book pages, securing viewer canvases, or preventing study material scraping.

Guidelines

Canvas Shielding: Render static flat canvas layers of curriculum files using PDF.js instead of serving raw files directly to the browser.

Context Interception: Restrict select, print, copy, and right-click actions on client viewports.

SVG Watermarks: Embed semi-transparent, diagonal watermarks containing the user's email and active timestamp on top of content wrappers.

Code Patterns

Anti-Copy CSS & Context Control

.secure-canvas-wrapper {
  user-select: none;
  -webkit-user-select: none;
}


window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault(); // Stop Ctrl+P
  }
});


