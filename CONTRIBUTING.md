# Contributing to FlashGuard AI

Thank you for contributing to **FlashGuard AI**! All contributors should follow these branch, commit, and workflow conventions to ensure smooth integration across the team.

---

## 🌿 Branches

- **`main`** → Stable, production/demo-ready code.
- **`develop`** → Central integration branch for ongoing development.
- **`feature/*`** → Individual feature branches branched off `develop`.

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

## 🔄 Development Workflow

1. **Pull latest integration branch**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/<feature-name>
   ```

3. **Develop & commit changes**:
   - Keep commits focused on a single concern.
   - Do not commit secrets, credentials, API keys, or `.env` files.
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

4. **Push and open a Pull Request**:
   ```bash
   git push -u origin feature/<feature-name>
   ```
   - Open a Pull Request targeting **`develop`**.
   - Fill out the PR template checklist.

5. **Code Review & Integration**:
   - Request review from teammates.
   - Merge into `develop` after approval.
   - After testing and verification, `develop` is merged into `main`.

---

## ⚠️ Important Rules

- **Do NOT push directly to `main`**.
- **Do NOT force-push to `main` or `develop`**.
- **Keep commits clean and focused**.
- **Never commit passwords, tokens, or sensitive API keys**.
