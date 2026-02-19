# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Repository Overview

This is a new, empty repository. No language, framework, or tooling has been committed yet. Update this file as the project evolves.

- **Remote**: `qdeclerck-blip/test`
- **Primary branch**: `main` (or `master` — confirm once established)

---

## Development Branch Conventions

- Feature branches: `feature/<short-description>`
- Bug fix branches: `fix/<short-description>`
- AI-assisted branches: `claude/<session-id>` (auto-created by Claude Code)
- Never push directly to `main`/`master` without a pull request

---

## Git Workflow

```bash
# Create a new branch
git checkout -b feature/my-feature

# Stage specific files (prefer over `git add .`)
git add path/to/file

# Commit with a descriptive message
git commit -m "Add: brief description of what and why"

# Push and set upstream
git push -u origin feature/my-feature
```

### Commit Message Format

Use a short imperative prefix followed by a concise description:

```
Add: new feature or file
Fix: bug or regression
Update: modification to existing functionality
Remove: deletion of code or files
Refactor: restructuring without behavior change
Docs: documentation-only change
Test: test additions or corrections
Chore: tooling, deps, config changes
```

---

## Project Structure (To Be Defined)

As the project grows, document the directory layout here. Example:

```
.
├── src/           # Application source code
├── tests/         # Test files
├── docs/          # Documentation
├── scripts/       # Utility scripts
└── CLAUDE.md      # This file
```

---

## Build & Run (To Be Defined)

Document build and run commands here once the stack is chosen. Example placeholders:

```bash
# Install dependencies
<install command>

# Run development server
<dev command>

# Build for production
<build command>

# Run tests
<test command>

# Lint / format
<lint command>
```

---

## Testing Conventions (To Be Defined)

- Document test framework and runner once selected.
- All new features should include tests.
- Tests must pass before merging a PR.

---

## Code Style & Linting (To Be Defined)

- Document linter and formatter once tooling is chosen.
- Prefer automated formatting over manual style discussions.
- Add a pre-commit hook or CI check to enforce style.

---

## Key Conventions for AI Assistants

1. **Read before editing** — Always read a file before modifying it.
2. **No speculative changes** — Only change what the task explicitly requires.
3. **No unnecessary files** — Do not create README stubs, placeholder docs, or boilerplate unless asked.
4. **Minimal diffs** — Keep changes focused; avoid reformatting unrelated code.
5. **Test awareness** — If tests exist, run them after changes and fix failures before committing.
6. **Security** — Never commit secrets, credentials, or `.env` files. Validate user input at boundaries.
7. **Branch discipline** — Work on the designated branch; never push to `main` without a PR.
8. **Commit granularity** — One logical change per commit; never batch unrelated changes.

---

## CI/CD (To Be Defined)

Document CI/CD pipelines here once configured (GitHub Actions, GitLab CI, etc.).

---

*Last updated: 2026-02-19. Keep this file current as the project evolves.*
