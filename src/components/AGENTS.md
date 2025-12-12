Scene and interaction components

- Instruct that all R3F components (scene content, controls, interaction overlays) must live under `<Canvas>` descendants; place any non-Canvas logic in hooks/context and pass via props. Cite `Scene3D` as the pattern: Canvas at the leaf, hook invocation inside `SceneContent`, and props for placement/selection handlers.
- Remind maintainers to respect placement-mode gating (e.g., disable OrbitControls when drawing, forward clicks to `InteractionManager`/`PlacementPlane`) rather than duplicating state in components.
