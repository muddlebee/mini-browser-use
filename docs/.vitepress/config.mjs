import { defineConfig } from 'vitepress';

// Build:   npm run docs:build   -> docs/.vitepress/dist
// Preview: npm run docs:dev
// For hosting under a sub-path (e.g. GitHub Pages at /mini-browser-use/), set DOCS_BASE.
export default defineConfig({
  title: 'Build a browser agent',
  description: 'A first-principles course: from what a web page is to an AI that uses a browser.',
  base: process.env.DOCS_BASE || '/',
  cleanUrls: true,
  lastUpdated: false,
  themeConfig: {
    nav: [
      { text: 'Course', link: '/' },
      { text: 'Setup', link: '/setup' },
      { text: 'Glossary', link: '/glossary' },
    ],
    sidebar: [
      { text: 'Start here', items: [{ text: 'Introduction', link: '/' }, { text: 'Setup', link: '/setup' }] },
      {
        text: 'Part 1: How the web works',
        items: [
          { text: '1. What is a web page?', link: '/part-1-the-web/01-what-is-a-web-page' },
          { text: '2. The DOM', link: '/part-1-the-web/02-the-dom' },
          { text: '3. How a browser draws a page', link: '/part-1-the-web/03-how-a-browser-draws-a-page' },
          { text: '4. JavaScript and events', link: '/part-1-the-web/04-javascript-and-events' },
        ],
      },
      {
        text: 'Part 2: Controlling a browser',
        items: [
          { text: '5. Programs that drive browsers', link: '/part-2-controlling-a-browser/05-programs-that-drive-browsers' },
          { text: '6. Seeing the page', link: '/part-2-controlling-a-browser/06-seeing-the-page' },
          { text: '7. Acting on the page', link: '/part-2-controlling-a-browser/07-acting-on-the-page' },
          { text: '8. Pictures for the model', link: '/part-2-controlling-a-browser/08-pictures-for-the-model' },
        ],
      },
      {
        text: 'Part 3: Adding a brain',
        items: [
          { text: '9. How models use tools', link: '/part-3-adding-a-brain/09-how-language-models-use-tools' },
          { text: '10. The agent loop', link: '/part-3-adding-a-brain/10-the-agent-loop' },
          { text: '11. act, extract and caching', link: '/part-3-adding-a-brain/11-act-extract-and-caching' },
        ],
      },
      {
        text: 'Part 4: The real world',
        items: [
          { text: '12. The messy real web', link: '/part-4-the-real-world/12-the-messy-real-web' },
          { text: '13. Keeping an agent safe', link: '/part-4-the-real-world/13-safety' },
          { text: '14. Testing and evals', link: '/part-4-the-real-world/14-testing-and-evals' },
          { text: '15. Where to go next', link: '/part-4-the-real-world/15-where-next' },
        ],
      },
      { text: 'Reference', items: [{ text: 'Glossary', link: '/glossary' }] },
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    docFooter: { prev: 'Previous chapter', next: 'Next chapter' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/muddlebee/mini-browser-use' }],
  },
});
