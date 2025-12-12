Rules for hook authors

- Clarify separation: UI/business hooks (e.g., `usePlacement`) should stay React-only and receive basket data via props; avoid importing Three.js or R3F unless the hook is meant for Canvas usage.
- For R3F-specific hooks like `useCameraViews`, require they be called from components rendered inside `<Canvas>` and keep OrbitControls mutations centralized there to prevent “hooks outside Canvas” errors.
