import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Jygame',
  description: 'A lightweight 2D game framework for the browser',
  cleanUrls: true,
  appearance: 'force-dark',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.avif',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/game' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'v0.2.0',
        items: [
          { text: 'GitHub', link: 'https://github.com/Bouzidi-Youssef/Jygame' },
          { text: 'npm', link: 'https://www.npmjs.com/package/jygame' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Best Practices', link: '/guide/best-practices' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'Core',
          items: [
            { text: 'Game', link: '/api/game' },
            { text: 'Scene', link: '/api/scene' },
          ],
        },
        {
          text: 'Display',
          items: [
            { text: 'Sprite', link: '/api/sprite' },
            { text: 'Group', link: '/api/group' },
          ],
        },
        {
          text: 'Math & Geometry',
          items: [
            { text: 'Vec2', link: '/api/vec2' },
            { text: 'Rect', link: '/api/rect' },
          ],
        },
        {
          text: 'Input',
          items: [
            { text: 'Input', link: '/api/input' },
          ],
        },
        {
          text: 'Time',
          items: [
            { text: 'Clock', link: '/api/clock' },
            { text: 'Timer', link: '/api/timer' },
          ],
        },
        {
          text: 'Collision',
          items: [
            { text: 'Collision', link: '/api/collision' },
          ],
        },
        {
          text: 'State & Storage',
          items: [
            { text: 'State', link: '/api/state' },
            { text: 'Storage', link: '/api/storage' },
          ],
        },
        {
          text: 'Assets',
          items: [
            { text: 'ImageLoader', link: '/api/image-loader' },
            { text: 'FontLoader', link: '/api/font-loader' },
          ],
        },
        {
          text: 'Color',
          items: [
            { text: 'Color / Colors', link: '/api/colors' },
          ],
        },
      ],

      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Snake Game', link: '/examples/snake-game' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Bouzidi-Youssef/Jygame' },
    ],

    footer: {
      message: 'Released under the GPL-3.0 License.',
      copyright: 'Copyright © Bouzidi Youssef',
    },

    search: {
      provider: 'local',
    },
  },
})
