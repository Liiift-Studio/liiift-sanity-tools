---
name: cleanup
description: Commit all changes, update agent memory files, and push. Use after completing a task or when the user says "cleanup", "wrap up", or "commit everything".
---

# Cleanup

Finalize the current work session by committing changes, updating memory, and pushing.

## Steps

### 1. Update Agent Memory

If `.agent/memory/` exists in the repo:

- **activeContext.md** — Update with what was just worked on, recent changes, and current state. Replace stale content, don't just append.
- **progress.md** — Update if a feature was completed, a bug was fixed, or a milestone was reached.
- **systemPatterns.md** — Update only if architecture or patterns changed.
- **techContext.md** — Update only if dependencies or stack changed.

If `.agent/` does not exist, skip this step.

Also update any Claude Code memory files if relevant context was learned during the session.

### 2. Check Git Status

Run `git status` across the repo and any submodules to identify all uncommitted changes. Show the user a summary of what will be committed.

### 3. Verify Git Identity

Run `git config user.name` to confirm the current account. The user commits code with their **QuiteQuinn (quinn-keaveney)** account. If the identity looks wrong, warn the user before proceeding.

### 4. Commit and Push

- Stage relevant files (avoid `.DS_Store`, build artifacts, `.env` files)
- Write a clear, concise commit message describing what changed
- No exclamation marks in commit messages
- Push to remote
- If working in submodules, commit inside each submodule first, then update the parent repo's submodule references

### 5. Confirm

Report what was committed and pushed across all repos.
