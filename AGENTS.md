General contributor guidance

- Note that the app is a Vite/React TypeScript project with R3F, so contributors should run `npm run build` before PRs and avoid adding new dev scripts without discussion.
- Emphasize the current architecture: `App.tsx` only wires providers/layout/scene/controls; keep state in the `ConfiguratorProvider` and leave UI/scene composition to dedicated components.
- Encourage consistent Tailwind styling and the `Layout` shell for sidebar/canvas composition instead of ad-hoc wrappers.
