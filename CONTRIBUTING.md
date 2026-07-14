# Contributing to Bejkhonda School Tracker

Thank you for your interest in contributing! This document provides guidelines and best practices for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

This project follows a standard open-source code of conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

---

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing [Issues](https://github.com/yourusername/students-tracker/issues) to avoid duplicates
2. Collect relevant information (browser, OS, steps to reproduce)
3. Create a minimal reproduction if possible

**Bug report template:**
```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g. Chrome 120]
- OS: [e.g. Windows 11]
- Version: [e.g. 1.0.0]
```

### Suggesting Features

Feature requests are welcome! Please:
1. Check existing issues and discussions first
2. Describe the problem your feature solves
3. Provide examples of how it would work
4. Consider if it aligns with the project's offline-first, privacy-first philosophy

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run `npm run verify` to ensure everything passes
5. Submit a pull request

---

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/students-tracker.git
cd students-tracker

# Install dependencies
npm ci

# Start dev server
npm run dev
```

### Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Route-level pages
├── lib/              # Business logic
├── db/               # Database layer
├── types/            # TypeScript interfaces
├── hooks/            # Custom React hooks
├── index.css         # Global styles + @font-face
├── print.css         # Print-specific styles
└── main.tsx          # App entry point
```

See [README.md](README.md) for detailed architecture.

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, missing semicolons) |
| `refactor` | Code refactoring (no feature changes) |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks (dependencies, build) |

### Examples

```bash
feat(roster): add bulk marks entry for class roster
fix(import): prevent MTR data loss during xlsx import
docs(readme): add deployment instructions for Vercel
refactor(calculations): extract merit ranking logic
```

### Scopes

Common scopes in this project:
- `roster` — Class Roster page
- `settings` — Settings page
- `import` — Import/Export functionality
- `mtr` — Progress Tracking
- `layout` — Layout, sidebar, navigation
- `fonts` — Typography and font loading
- `ci` — CI/CD pipeline
- `docker` — Docker configuration

---

## Pull Request Process

1. **Update your branch** with the latest `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run the verification suite:**
   ```bash
   npm run verify
   ```
   This runs typecheck, tests, and build. All must pass.

3. **Update documentation** if you changed functionality:
   - Update `README.md` for user-facing changes
   - Update `PROGRESS.md` for roadmap changes
   - Add JSDoc comments for new public functions

4. **Submit PR with a clear description:**
   - What does this PR do?
   - Why is this change needed?
   - How was it tested?
   - Screenshots (for UI changes)

5. **Code review:** Maintainers will review and request changes if needed.

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for object shapes
- Use explicit return types for exported functions
- Avoid `any` — use `unknown` if type is truly unknown

### React

- Functional components with hooks only
- Extract custom hooks for reusable logic (`src/hooks/`)
- Use `useLiveQuery` for Dexie database queries
- Memoize expensive computations with `useMemo`

### Styling

- Use Tailwind CSS utility classes
- Follow the existing glassmorphism design system
- Ensure mobile-first responsive design (test at 375px)
- Use `font-heading` for headings, `font-body` for body text
- All Bengali text must use the `Hind Siliguri` font stack

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `index.ts` or `camelCase.ts`
- CSS: `kebab-case.css`

### Comments

- Write comments for non-obvious logic
- Use Bengali for user-facing strings
- Use English for code comments and variable names

---

## Testing

### Running Tests

```bash
# Run once
npm run test

# Watch mode
npm run test:watch
```

### Writing Tests

- Place tests in the same directory as the source file
- Name test files `*.test.ts`
- Use descriptive test names: `"returns safe fallback for empty grading scale"`
- Cover edge cases, error paths, and boundary conditions

### Test Coverage Focus

Priority areas for new tests:
- `src/lib/calculations.ts` — GPA lookup, averages, merit ranking
- `src/lib/importXlsx.ts` — Spreadsheet parsing edge cases
- `src/pages/Import.tsx` — Import flow validation

---

## Documentation

### README.md

Main project documentation. Update when:
- Adding new features
- Changing deployment process
- Updating tech stack

### INSTALL.md

Installation and setup guide. Update when:
- Adding new prerequisites
- Changing build process
- Adding deployment targets

### PROGRESS.md

Development roadmap. Update when:
- Completing features
- Adding new milestones
- Noting blockers or drift

### Code Comments

- JSDoc for exported functions
- Inline comments for non-obvious logic
- Bengali for UI strings, English for code

---

## Getting Help

- Open an issue for bugs or feature requests
- Check existing documentation in `docs/` (if available)
- Review closed issues for similar problems

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
