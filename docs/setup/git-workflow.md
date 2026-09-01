# FlashGuard AI — Git & GitHub Workflow

This document defines the official development workflow for the six-member FlashGuard AI team. It is designed to be beginner-friendly while maintaining project stability.

---

## 1. Branch Strategy

We use a simple branching model with a single monorepo (`flashguard-ai`).

* **`main`**: Stable, demo-ready code. Protected.
* **`develop`**: Integration branch to combine completed features.
* **`feature/*`**: Individual development branches for specific tasks.

### Branch Naming Convention
Names should describe the task.

**Features**:
* `feature/flutter-login`
* `feature/backend-auth`
* `feature/risk-engine`
* `feature/osrm-routing`
* `feature/iot-simulator`
* `feature/admin-dashboard`

**Fixes & Docs**:
* `fix/flutter-login`
* `fix/api-validation`
* `docs/api-contract`
* `docs/setup-guide`

Do not introduce GitFlow or unnecessary branch types.

---

## 2. Standard Developer Workflow

Our standard flow is:
`develop` → create feature branch → develop + test → commit → push → Pull Request → review → merge into `develop` → integration testing → Pull Request → `main`

### Common Commands

**Clone the repository:**
```bash
git clone <repository-url>
cd flashguard-ai
```

**Get latest develop:**
```bash
git checkout develop
git pull origin develop
```

**Create feature branch:**
```bash
git checkout -b feature/<feature-name>
```

**Check status:**
```bash
git status
```

**Commit changes:**
```bash
git add .
git commit -m "type: description"
```

**Push branch:**
```bash
git push -u origin feature/<feature-name>
```

---

## 3. Commit Convention

Keep commits small, focused, and descriptive. Avoid meaningless messages like "update", "changes", "final", "working".

Use these prefixes:
* `feat:` A new feature or capability
* `fix:` A bug fix
* `docs:` Documentation changes
* `test:` Adding or updating tests
* `refactor:` Code refactoring without changing functionality
* `chore:` Maintenance tasks, dependency updates, configuration changes

*Examples:*
* `feat: add nearby risk zone API`
* `fix: correct shelter distance calculation`
* `docs: update API contract`

---

## 4. Pull Request Rules

Every PR must use the standard template, outlining:
* **Description**: What was changed?
* **Changes**: List the main changes.
* **Testing**: Explain how it was tested.
* **Contract Changes**: Checkboxes identifying any data contract changes.
* **Checklist**: Ensure testing, security (no secrets), and docs are addressed.

---

## 5. Main Branch Protection

`main` is protected to ensure stability:
* Pull Request required
* 1 approval required
* Deletion restricted
* Force pushes blocked

Do NOT change this protection unless absolutely necessary.

---

## 6. Develop Branch Rules

`develop` is our integration branch.
* Developers create PRs from `feature/*` into `develop`.
* Once features in `develop` are tested and stable, a PR is made from `develop` to `main`.
* The **team lead** or the member responsible for system integration (Member 6) should normally approve the release PR to `main`.

---

## 7. Code Review Process

Reviewers should check PRs for:
* **Correctness**: Does the code solve the issue?
* **Compatibility**: Does it follow the existing API/data contracts?
* **Testing**: Does it have appropriate tests?
* **Security**: Are secrets excluded? Is user/location data handled appropriately?
* **Maintainability**: Is the implementation unnecessarily complex?
* **Documentation**: Are contract changes documented?

---

## 8. Shared Contract Changes (CRITICAL)

If you need to change shared definitions (API endpoint, JSON field, database field, Enum, coordinate format, MQTT topic, P2P structure), **you must NOT silently change it**.

1. Create a GitHub issue.
2. Explain why the change is required.
3. Update the relevant documentation.
4. Notify affected team members.
5. Create the feature branch.
6. Make the change.
7. Submit a PR.
8. Get review before merging.

---

## 9. Merge Strategy

* **Squash and merge**: Recommended for `feature/*` PRs into `develop` to keep the history clean.
* **Merge commit or squash**: For the release PR (`develop` → `main`), depending on team preference.

Avoid complicated Git history policies.

---

## 10. Conflict Resolution

If you encounter a conflict between your branch and `develop`:

```bash
# Update develop
git checkout develop
git pull origin develop

# Go back to your feature branch
git checkout feature/<feature-name>

# Merge develop into your branch
git merge develop
```
If conflicts occur:
1. Open the conflicted files in your editor.
2. Resolve the conflicts (choose what to keep).
3. Test to ensure it works.
4. Stage the resolved files (`git add <file>`).
5. Commit the merge (`git commit -m "Merge develop into feature"`).
6. Push the branch (`git push`).

*Ask another team member for help if you are unsure how to resolve a conflict in their code.*

---

## 11. Keeping Feature Branches Updated

For long-running feature branches, periodically merge updates from `develop` to avoid massive conflicts later:

```bash
git checkout develop
git pull origin develop
git checkout feature/<feature-name>
git merge develop
```
Daily rebasing is not required.

---

## 12. Mistake Recovery

### Accidentally changed files
Discard changes to a file before committing:
```bash
git status
git restore <file>
```

### Wrong commit message
If you haven't pushed yet, amend the commit:
```bash
git commit --amend -m "new: correct message"
```

### Accidentally committed a secret
Simply deleting the file in a new commit is **NOT sufficient** (it remains in history). Stop, do not push, and notify the team lead immediately to remove it from history securely.

### Accidentally committed to main
If you somehow committed directly to `main` locally, do NOT force push. Contact the team lead to determine if a revert is needed.

### Merge conflict mistakes
If you mess up a merge resolution, you can abort the merge:
```bash
git merge --abort
```

---

## 13. Six-Member Responsibilities

Each member should primarily work within their module but must follow shared contracts:
* **Member 1 (Backend + Database)**: Work in `backend/`.
* **Member 2 (Flutter)**: Work in `android/`.
* **Member 3 (Maps + Routing)**: Work in `maps/`.
* **Member 4 (AI/Risk Engine)**: Work in `ai/`.
* **Member 5 (IoT + Offline/P2P/SMS)**: Work in `iot/`.
* **Member 6 (Admin Dashboard + Integration)**: Work in `dashboard/` and oversee system integration.

---

## 14. Shared Files

The following files/directories require extra care as multiple members touch them:
* `docs/api/`
* `docs/architecture/`
* `docs/database/`
* `README.md`
* `docker-compose.yml`
* `.github/`

Shared contract changes in these areas require communication and PR review.
