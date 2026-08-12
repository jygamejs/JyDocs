---
layout: home

hero:
  name: Jygame
  text: Lightweight 2D Game Framework
  tagline: A zero-dependency, canvas + DOM hybrid framework for building browser games with vanilla JavaScript.
  image:
    src: /logo_jygame.avif
    alt: Jygame
  actions:
    - theme: brand
      text: Get Started
      link: /api/game
    - theme: alt
      text: View on GitHub
      link: https://github.com/Bouzidi-Youssef/Jygame

features:
  - title: Zero Dependencies
    details: Pure vanilla JavaScript ES modules. No bundlers, no frameworks, no bloat. Just import and play.
  - title: Pure ECS Architecture
    details: Entity-Component-System design. Sprites are data entities; dedicated systems handle movement, rendering, animation, and collision.
  - title: Scene Stack
    details: Stack-based scene management with pause/resume, blocking rules, and deferred operations for safe mid-frame transitions.
  - title: Camera System
    details: 2D camera with position, zoom, and rotation. Viewport culling, world-to-screen conversion, and follow-target support.
  - title: Animation System
    details: Frame-based sprite animations with per-clip FPS, looping, and completion callbacks — driven by a dedicated AnimationSystem.
  - title: Pointer & Multi-Touch Input
    details: Unified Pointer Events API with action bindings, multi-touch tracking, swipe and tap gestures, and per-scene InputContext instances.
  - title: Advanced Object Pooling
    details: ActivePool with O(1) acquire/release, active tracking, batch operations, and instrumentation for tuning memory pressure.
  - title: Collision System
    details: Centralized collision detection with spatial hashing, callback-based zero-alloc queries, and automatic broad-phase management.
---
