# Contributing to FlashGuard AI

Thank you for contributing to **FlashGuard AI**! All contributors should follow our standard Git/GitHub workflow to ensure smooth integration across the team.

For the complete, detailed guide, please read: **[Git & GitHub Workflow (docs/setup/git-workflow.md)](docs/setup/git-workflow.md)**.

---

## 🌿 Branches

- **`main`** → Stable, production/demo-ready code. Protected branch.
- **`develop`** → Central integration branch for ongoing development.
- **`feature/*`** → Individual feature branches (e.g., `feature/flutter-login`, `fix/api-validation`).

---

## 📝 Commit Convention

Please use concise, conventional commit messages:

- `feat:` A new feature or capability
- `fix:` A bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring without changing functionality
- `chore:` Maintenance tasks, dependency updates, configuration changes

*Example:* `feat: add postgis schema definition for risk zones`

---

## 🔄 Standard Developer Workflow

1. Update your local integration branch: `git checkout develop` && `git pull origin develop`
2. Create your feature branch: `git checkout -b feature/<feature-name>`
3. Develop and commit using conventional commit prefixes.
4. Push your branch: `git push -u origin feature/<feature-name>`
5. Open a Pull Request targeting **`develop`**.
6. Fill out the PR template checklist and request a code review.
7. Merge into `develop` (preferably squash and merge).
8. Once integrated and tested, `develop` is PR'd into `main` for release.

---

## ⚠️ Important Rules

- **Do NOT push directly to `main`**.
- **Do NOT force-push to `main` or `develop`**.
- **Keep commits clean and focused**.
- **Never commit passwords, tokens, or sensitive API keys**.
- **Shared Contract Changes require communication:** Changing APIs, DB fields, Enums, etc., MUST be documented and reviewed first.
