---
description: Iteratively reviews and refactors code in a folder until no DDD, Clean Architecture, or Clean Code violations remain
argument-hint: <relative-folder-path>
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, TodoWrite, Agent
---

You are running an iterative architecture and code quality review loop. Your job is to refactor the code in `$ARGUMENTS` until it is clean, meaning: no DDD layer violations, no Clean Architecture boundary crossings, and no Clean Code issues you can fix without changing observable behaviour.

**Refactoring into the correct structure is the primary tool.** Prefer moving/splitting/renaming files and extracting well-named constructs over leaving a comment or marking something unsolvable.

---

## Project architecture (void-odyssey)

Layers and import rules — violations must be fixed by moving code to the right layer:

| Layer | Location | May import from |
|---|---|---|
| `domain/` | models, services, repository *interfaces* | nothing from the project |
| `application/` | useCases, hooks, store | `domain/`, `shared/` |
| `infrastructure/` | engine, repositories (implementations), lib, api | `domain/`, `shared/` |
| `presentation/` | components, layouts, pages, styles | `application/hooks/`, `shared/` |
| `shared/` | result.ts, constants, error types, utility types | nothing from the project |

DDD building blocks:
- **Entity** — has identity (`id`), mutable state, encapsulates its own invariants
- **Value Object** — immutable, no identity, equality by value
- **Aggregate** — cluster of entities/VOs with one root; the root is the only public entry point
- **Domain Service** — stateless logic that spans multiple entities/aggregates
- **Repository** — interface in `domain/repositories/`, implementation in `infrastructure/repositories/`
- **Use Case** — one file, one public function/class, orchestrates domain objects and repository interfaces
- **Application Hook** — thin React wrapper around a use case, lives in `application/hooks/`

---

## Review checklist

For each pass, evaluate every file in the target folder against **all** of the following. Record every finding with file path, line number, severity (Critical / Major / Minor), category, and a concrete fix action.

### 1. DDD layer boundaries (Critical)
- [ ] Does a `domain/` file import from `application/`, `infrastructure/`, or `presentation/`?
- [ ] Does a `presentation/` file import directly from `application/useCases/`, `domain/`, or `infrastructure/`?
- [ ] Does an `application/` file import from `infrastructure/` (other than via an interface)?
- [ ] Does `shared/` import from any other layer?

### 2. DDD building-block correctness (Major)
- [ ] Is domain logic (invariant checks, business rules, calculations) leaking into use cases, hooks, or presentation?
- [ ] Is an entity or aggregate modified from outside its root (bypassing encapsulation)?
- [ ] Are value objects mutable or compared by reference rather than value equality?
- [ ] Are repository *interfaces* placed in `domain/repositories/` and *implementations* in `infrastructure/repositories/`?
- [ ] Are use cases doing more than orchestrating (e.g. containing business rules)?
- [ ] Are application hooks doing more than wrapping a use case and managing React state?

### 3. Clean Architecture (Major)
- [ ] Do framework types (Excalibur, React, Zustand, Immer) appear in `domain/` or `application/useCases/`?
- [ ] Is a use case tightly coupled to a concrete infrastructure implementation instead of an interface?
- [ ] Are there circular dependencies between modules?
- [ ] Is the dependency direction always pointing inward (toward `domain/`)?

### 4. Clean Code (Minor–Major)
- [ ] **Naming** — classes, functions, variables named for what they *are* or *do* in the domain, not how they're implemented
- [ ] **Single Responsibility** — one reason to change per class/function; split if multiple concerns are mixed
- [ ] **Function length** — functions doing more than one thing at the same abstraction level; extract
- [ ] **Magic numbers / strings** — replace with named constants or domain value objects
- [ ] **Deep nesting** — flatten with early returns, extracted functions, or guard clauses
- [ ] **Boolean traps** — boolean parameters that silently change behaviour; extract into separate functions or an enum
- [ ] **Anemic models** — models that are just data bags with no behaviour; move logic into the model
- [ ] **Path aliases** — all imports from `src/` must use `@/`; relative imports only within the same directory
- [ ] **Dead code** — unused exports, unreachable branches, commented-out code

---

## Loop protocol

Repeat the following cycle until the exit condition is met:

### Step 1 — Audit
Use Glob and Grep to enumerate all `.ts` and `.tsx` files under `$ARGUMENTS`. Read each file. Produce a numbered findings list using the checklist above. For each finding record:
- Finding ID, File path:line, Severity, Category, Description, Proposed fix

If no findings remain → print **"CLEAN: no further violations found."** and stop.

### Step 2 — Triage
Classify each finding:
- **Solvable** — can be fixed by refactoring without changing observable behaviour or requiring external decisions
- **Unsolvable** — requires a design decision, missing context, or touches files outside `$ARGUMENTS` in a way that would break consumers

Only work on **Solvable** findings this pass.

### Step 3 — Fix
Apply fixes in dependency order (layer-boundary moves first, then structural refactors, then Clean Code). Use TodoWrite to track each fix. For each fix:
1. Mark the todo `in_progress`
2. Edit/move files
3. Verify no new import violations were introduced (grep for the changed symbol in files outside `$ARGUMENTS` if it was exported)
4. Mark the todo `completed`

### Step 4 — Re-audit
Re-read every file you touched. Confirm the fix resolved the finding and introduced no new violations. Update the findings list.

### Step 5 — Report unsolvable findings
After all solvable findings are resolved, list the remaining unsolvable findings with a clear explanation of what decision or change is needed to resolve each one.

Then go back to **Step 1** for a final clean-pass confirmation.

---

## Output format

After each full cycle print a short summary:

```
=== Pass N ===
Fixed (K findings):
  [F01] path/to/file.ts:42 — moved domain logic from use case into ShipAggregate.applyDamage()
  ...
Remaining unsolvable (M findings):
  [U01] path/to/file.ts:10 — imports Excalibur Actor; unclear if this belongs in infrastructure or can be abstracted
  ...
```

At the end print the overall result: **CLEAN** or **CLEAN WITH OPEN ITEMS** (listing unsolvables).
