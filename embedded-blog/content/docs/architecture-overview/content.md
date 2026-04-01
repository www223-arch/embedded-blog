## Architecture Description

### Layers

- `src/app`: Application shell, hash routing, module registry.
- `src/features`: Business modules (home/docs/projects/life/board/playground/pet).
- `src/content`: Content layer (documents, projects, life sharing data).
- `src/shared`: Common animation and interaction tools.
- `src/store`: Game points and score status.

### Extension Mechanism

Register new page modules through `src/app/moduleRegistry.ts` `register()`:

1. Implement `render()`
2. Optionally implement `afterMount()`
3. Configure `visibleInNav` to control appearance in main navigation
4. Register in `bootstrap.ts`

### Routing and Navigation Principles

- Main navigation only includes core information pages: `docs/projects/life/board`.
- `playground` is a hidden route, only triggered through easter egg entry.
- `home` serves as brand entry, not competing with business pages for attention.
