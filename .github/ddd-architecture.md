# DDD Architecture — void-odyssey

## Layers

### `domain/` — the core, no dependencies
- **models/** — entities and value objects. Pure data + behaviour, no framework imports.
- **services/** — business rules that don't belong to a single entity.
- **repositories/** — *interfaces only* (`IShipRepository`). No implementation here.

> Rule: nothing in `domain/` imports from `application/`, `infrastructure/`, or `presentation/`.

---

### `application/` — orchestration
- **useCases/** — one file per use case (`startGame.ts`, `loadLevel.ts`). Calls domain services and repository interfaces.
- **hooks/** — React hooks that expose use cases to the UI (`useStartGame`).
- **store/** — Zustand stores. Application-level state, not domain state.

> Rule: imports from `domain/` and `shared/`. Never from `infrastructure/` directly (use interfaces).

---

### `infrastructure/` — external world
- **engine/** — Excalibur setup, scenes, actors.
- **lib/** — third-party bootstrapping (i18n, etc.).
- **api/** — HTTP clients.
- **repositories/** — concrete implementations of domain repository interfaces.

> Rule: the only layer allowed to touch frameworks, the DOM, network, and Excalibur directly.

---

### `presentation/` — React UI
- **components/** — reusable, stateless-preferred UI components.
- **layouts/** — shell/chrome wrappers.
- **pages/** — thin route entry points, compose components.
- **styles/** — global CSS.

> Rule: calls `application/hooks/` only. Never calls use cases or repositories directly.

---

### `shared/` — zero-dependency cross-cutting
- `result.ts` — `Result<T,E>`, `ok()`, `err()`
- Constants, error types, utility types used across all layers.

> Rule: no layer imports. `shared/` imports nothing from the project.
