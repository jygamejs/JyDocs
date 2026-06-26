import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Jygame',
  description: 'A lightweight 2D game framework for the browser',
  cleanUrls: true,
  appearance: 'force-dark',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/g2.svg' }],
  ],

  themeConfig: {
    logo: '/g2.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/game' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'v0.7.1',
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
            { text: 'Camera', link: '/api/camera' },
            { text: 'LoadingTask', link: '/api/loading-task' },
          ],
        },
        {
          text: 'Components',
          items: [
            { text: 'Transform', link: '/api/transform' },
            { text: 'Collider', link: '/api/collider' },
            { text: 'Renderable', link: '/api/renderable' },
            { text: 'Animation', link: '/api/animation' },
          ],
        },
        {
          text: 'Systems',
          items: [
            { text: 'MovementSystem', link: '/api/movement-system' },
            { text: 'AnimationSystem', link: '/api/animation-system' },
            { text: 'RenderSystem', link: '/api/render-system' },
            { text: 'CollisionSystem', link: '/api/collision-system' },
          ],
        },
        {
          text: 'Particle System',
          items: [
            { text: 'Particle System', link: '/api/particle-system' },
            { text: 'Particle Modifiers', link: '/api/particle-modifiers' },
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
            { text: 'InputContext', link: '/api/input-context' },
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
            { text: 'CollisionSystem', link: '/api/collision-system' },
            { text: 'SpatialHash', link: '/api/spatial-hash' },
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
          text: 'Loaders',
          items: [
            { text: 'ImageLoader', link: '/api/image-loader' },
            { text: 'FontLoader', link: '/api/font-loader' },
            { text: 'AudioLoader', link: '/api/audio-loader' },
          ],
        },
        {
          text: 'Memory',
          items: [
            { text: 'Pool', link: '/api/pool' },
            { text: 'ActivePool', link: '/api/active-pool' },
          ],
        },
        {
          text: 'Audio',
          items: [
            { text: 'Audio Manager', link: '/api/audio-manager' },
            { text: 'Audio Playback', link: '/api/audio-playback' },
            { text: 'Audio Definitions', link: '/api/audio-definition' },
            { text: 'Audio Scene', link: '/api/audio-scene' },
            { text: 'Audio Effects', link: '/api/audio-effects' },
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
