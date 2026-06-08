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
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/Bouzidi-Youssef/Jygame

features:
  - title: Zero Dependencies
    details: Pure vanilla JavaScript ES modules. No bundlers, no frameworks, no bloat. Just import and play.
  - title: Canvas + DOM Hybrid
    details: Render game graphics on Canvas 2D while layering HTML UI elements on top — best of both worlds.
  - title: Component Architecture
    details: Sprite entities composed of Transform, Collider, and Renderable components with dedicated Movement and Render systems.
  - title: Spatial Acceleration
    details: Built-in SpatialHash broad-phase collision for fast queries on large groups, plus object pooling for memory efficiency.
  - title: Pointer & Multi-Touch Input
    details: Unified Pointer Events API with multi-touch tracking, swipe and tap gestures, and per-scene InputContext instances.
  - title: Scene Management
    details: Lifecycle hooks with auto-cleaning event listeners, interpolation support, and smooth scene transitions.
  - title: Math & Geometry
    details: Vec2 and Rect classes with pool-friendly out parameters for zero-allocation hot paths.
  - title: Asset Loading
    details: Image and Font loaders with progress tracking (LoadingTask), batch loading, and individual asset unloading.
---
