# Contributing

Thanks for helping improve this project.

## Development Setup

```bash
npm install
npm run dev:web
```

For the Electron client:

```bash
npm start
```

## Before Opening a PR

Run the full local checks:

```bash
npm test
npm run smoke
```

## Contribution Scope

- UI layout and interaction improvements for the generator and skill library
- OpenClaw local data integration improvements
- Windows and macOS compatibility fixes
- Tests for service logic, browser flows, and Electron smoke coverage

## Coding Notes

- Keep the current visual language unless the change is explicitly a redesign task
- Preserve existing local-data behavior unless the change is intentionally altering business rules
- Add or update tests when behavior changes
- Keep file edits focused and avoid unrelated refactors

