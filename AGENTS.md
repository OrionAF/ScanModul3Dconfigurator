General contributor guidance

- Note that the app is a Vite/React TypeScript project with R3F, so contributors should run `npm run build` before PRs and avoid adding new dev scripts without discussion.
- Emphasize the current architecture: `App.tsx` only wires providers/layout/scene/controls; keep state in the `ConfiguratorProvider` and leave UI/scene composition to dedicated components.
- Encourage consistent Tailwind styling and the `Layout` shell for sidebar/canvas composition instead of ad-hoc wrappers.

Basket geometry and snapping rules

- Basket side column counts: short sides have 12 gap columns and 11 solid-bar columns; long sides have 18 gap columns and 17 solid-bar columns.
- Dividers snap only to solid bars along the basket edges, never to corner posts.
- Prevent dividers from snapping to bars on the same basket side; only cross-side bar snapping is allowed.
