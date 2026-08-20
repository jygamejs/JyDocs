import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Jygame',
  description: 'A lightweight 2D game framework for the browser',
  cleanUrls: true,
  appearance: 'force-dark',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo_old.svg' }],
  ],

  themeConfig: {
    logo: '/logo.avif',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Reference', link: '/api/game' },
      {
        text: 'v0.8.9',
        items: [
          { text: 'GitHub', link: 'https://github.com/Bouzidi-Youssef/Jygame' },
          { text: 'npm', link: 'https://www.npmjs.com/package/jygame' },
        ],
      },
    ],

    sidebar: {
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Game', link: '/api/game' },
            { text: 'Scene', link: '/api/scene' },
            { text: 'Input', link: '/api/input' },
            { text: 'Keys', link: '/api/keys' },
            { text: 'Image', link: '/api/image' },
            { text: 'Sprite', link: '/api/sprite' },
            { text: 'Audio', link: '/api/audio' },
            { text: 'Font', link: '/api/font' },
            { text: 'Text', link: '/api/text' },
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
