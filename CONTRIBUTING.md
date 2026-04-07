# Contributing to Cosmic-Engine

## Branch Naming

Use the following prefixes for all branches:

- `feat/xxx` — New features
- `fix/xxx` — Bug fixes
- `docs/xxx` — Documentation changes
- `chore/xxx` — Maintenance tasks (deps, CI, configs)
- `refactor/xxx` — Code restructuring without behavior change

## Pull Request Flow

1. Create a branch from `main` using the naming convention above.
2. Make your changes and push the branch to the remote.
3. Open a Pull Request against `main`.
4. Ensure all CI checks pass (lint, tests, build).
5. Request review if needed.
6. Squash merge into `main` once approved.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). All commits
must match the format enforced by commitlint (see `commitlint.config.js`):

```
type(scope): description
```

### Types

| Type       | Use for                             |
| ---------- | ----------------------------------- |
| `feat`     | New feature                         |
| `fix`      | Bug fix                             |
| `docs`     | Documentation only                  |
| `style`    | Formatting, whitespace, semicolons  |
| `refactor` | Code change with no new feature/fix |
| `test`     | Adding or updating tests            |
| `chore`    | Build, CI, dependency updates       |
| `perf`     | Performance improvement             |

### Scopes

`frontend`, `backend`, `shared`, `infra`

### Examples

```
feat(frontend): add star lifecycle animation
fix(backend): correct Argon2id salt length
chore(infra): upgrade PostgreSQL to 17.2
docs(shared): document physics constant units
```

## Code Standards

- Follow the conventions documented in `CLAUDE.md`.
- Run `pnpm lint` (frontend) and `golangci-lint run` (backend) before pushing.
- Write tests for new functionality.

## Questions?

Open an issue or check `CLAUDE.md` for detailed technical conventions.
