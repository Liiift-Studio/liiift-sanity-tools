# Git Workflow — Liiift Sanity Tools

## Commit Before Task Complete

A task is NOT complete until changes are committed.

Sequence for every non-trivial task:
1. Implement and verify the changes
2. Stage all relevant files: `git add -A` or stage selectively
3. Write a commit with a clear message
4. Then summarize the work and declare the task complete

## Commit Message Style
- Be concise but descriptive — reference the main change or feature
- **No exclamation marks** in commit messages
- Keep them professional, clear, and direct
- Match the message to the actual changes made

**Good examples:**
```
Add bulk delete confirmation dialog to sanity-search-and-delete
Fix font extractor not handling variable font axes
Export new reference converter utility from sanity-convert-references
```

**Bad examples:**
```
Fixed it!
updates
WIP
plugin changes
```

## Branch Conventions
- Feature work goes on named branches: `feature/<name>`
- Hotfixes: `fix/<name>`
- Always check current branch with `git status` before starting work

## Pull / Push
- Pull before starting new work on a shared branch
- Push after committing — do not leave committed work unpushed at end of task

## Safety
- Never force push to `main` without explicit user instruction
- Never run `git reset --hard` without explicit user instruction
- Always show the user what will be committed before committing
