# Commit and PR Workflow

Use this when the user asks to commit, prepare a PR, review changes, or publish work.

## Commit Rules

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`.
- Commit messages should be Chinese unless the surrounding project history indicates otherwise.
- Each commit should pass `npm run lint` and `npm run test` when practical.
- Do not include unrelated dirty worktree changes.

## PR Format

Title format:

```text
[domain] action: brief description
```

PR description should include:

- Why the change exists.
- Related Spectra spec/change when relevant.
- Test commands and results.
- Docker build result when deployment is affected.

## Review Stance

For code review requests, lead with bugs, regressions, missing tests, and risks. Keep summaries secondary.
