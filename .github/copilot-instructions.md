# GitHub Copilot Instructions — void-odyssey

This is a TypeScript game project using React, Excalibur, Zustand, Immer, i18next, Tailwind CSS, and Lucide icons.

## Architecture

The project follows Domain-Driven Design (DDD). See [ddd-architecture.md](ddd-architecture.md) for the full layer breakdown.

**Rules priority: import layer boundaries > path alias > file extension > naming conventions.**

**Import rules (strictly enforced):**

| Layer | May import from |
|---|---|
| `domain/` | nothing from the project |
| `application/` | `domain/`, `shared/` |
| `infrastructure/` | `domain/`, `shared/` |
| `presentation/` | `application/hooks/`, `shared/` |
| `shared/` | nothing from the project |

## Self-Review After Implementation

After implementing any non-trivial change, run a self-review against the checklist in `.github/prompts/review.prompt.md` before reporting done. Scope the review to the files and folders the user explicitly added to the context — do not review unrelated files. Fix all violations found, then verify the fixes introduced no new issues. Only report completion once no violations remain.

## Path alias

Use `@/` for all imports from `src/` across all layers. The only exception is relative imports within the same directory (e.g. `./resource`):
```ts
import { useGameStore } from '@/application/store/gameStore'
```

## Key conventions

- All files are `.ts` or `.tsx` — never `.js` or `.jsx`
- Zustand stores use Immer middleware
- Domain repository interfaces are prefixed with `I` (e.g. `IShipRepository`)
- Use `Result<T, E>` from `@/shared/result` instead of throwing in domain/application code
- i18n keys live in `src/infrastructure/lib/i18n.ts`
- Excalibur engine lifecycle is managed in `src/infrastructure/engine/engine.ts`
