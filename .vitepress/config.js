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
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/game' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'v0.8.4',
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
          text: 'Engine',
          items: [
            { text: 'Game', link: '/api/game' },
            { text: 'Scene', link: '/api/scene' },
            { text: 'Camera', link: '/api/camera' },
            { text: 'LoadingTask', link: '/api/loading-task' },
          ],
        },
        {
          text: 'ECS Core',
          items: [
            { text: 'World', link: '/api/ecs/world' },
            { text: 'Entity Lifecycle', link: '/api/ecs/entity' },
            { text: 'Component Schemas', link: '/api/ecs/component-schemas' },
            { text: 'Tag Components', link: '/api/ecs/tag-components' },
            { text: 'Systems', link: '/api/ecs/systems' },
            { text: 'Queries', link: '/api/ecs/queries' },
            { text: 'Events', link: '/api/ecs/events' },
            { text: 'Prefabs', link: '/api/ecs/prefabs' },
            { text: 'Serialization', link: '/api/ecs/serialization' },
            { text: 'Streaming', link: '/api/ecs/streaming' },
            { text: 'Hierarchy', link: '/api/ecs/hierarchy' },
            { text: 'DefaultWorldBuilder', link: '/api/ecs/default-world-builder' },
          ],
        },
        {
          text: 'Components',
          items: [
            { text: 'Transform', link: '/api/transform' },
            { text: 'Collider', link: '/api/collider' },
            { text: 'Renderable', link: '/api/renderable' },
            { text: 'Animation', link: '/api/animation' },
            { text: 'Trail', link: '/api/trail' },
            { text: 'WorldTransform', link: '/api/world-transform' },
          ],
        },
        {
          text: 'Systems',
          items: [
            { text: 'MovementSystem', link: '/api/movement-system' },
            { text: 'AnimationSystem', link: '/api/animation-system' },
            { text: 'RenderSystem', link: '/api/render-system' },
            { text: 'CollisionSystem', link: '/api/collision-system' },
            { text: 'TrailSystem', link: '/api/trail-system' },
            { text: 'HierarchySystem', link: '/api/hierarchy-system' },
          ],
        },
        {
          text: 'Particle System',
          items: [
            { text: 'Particle System', link: '/api/particle-system' },
            { text: 'Particle Modifiers', link: '/api/particle-modifiers' },
            { text: 'Emitter Shapes', link: '/api/emitter-shapes' },
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
          text: 'Input System',
          items: [
            { text: 'InputSystem Overview', link: '/api/input/input-system' },
            { text: 'Input Devices', link: '/api/input/devices' },
            { text: 'Action System', link: '/api/input/actions' },
            { text: 'Gesture Recognition', link: '/api/input/gestures' },
            { text: 'Coordinate System', link: '/api/input/coordinate-system' },
            { text: 'Input Events & Backends', link: '/api/input/events' },
          ],
        },
        {
          text: 'Input (Legacy)',
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
        {
          text: 'Debug / Diagnostics',
          items: [
            { text: 'Getting Started', link: '/api/debug/getting-started' },
            { text: 'Diagnostics Engine', link: '/api/debug/diagnostics' },
            { text: 'In-Game Overlay', link: '/api/debug/overlay' },
            { text: 'Debug Workspace', link: '/api/debug/workspace' },
            { text: 'World Snapshots', link: '/api/debug/snapshots' },
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
