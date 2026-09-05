# FlashGuard AI Documentation

This directory contains technical architecture documentation, API specifications, database schemas, setup guides, architectural decision records (ADRs), and demo milestone contracts for **FlashGuard AI (SIH 2026)**.

---

## 📂 Documentation Directory Structure

```text
docs/
├── architecture/         # High-level system architecture and interaction flows
│   ├── communication-flow.md
│   ├── data-flow.md
│   └── system-interfaces.md
├── api/                  # Overarching production REST API specifications
│   └── api-contract.md
├── database/             # PostgreSQL + PostGIS schemas and entity relationship models
├── demo/                 # Milestone-specific demonstration contracts
│   └── api-contract.md   # Monday Director Demo contract (Uttarakhand focus)
├── setup/                # Developer setup, conventions, and environment guides
│   ├── coding-standards.md
│   ├── development-environment.md
│   └── git-workflow.md
└── decisions/            # Architectural Decision Records (ADRs)
    └── 005-data-contracts.md
```

---

## 📌 Key Documents

* **[Demo API Contract](demo/api-contract.md)**: Frozen data contract for the Monday Director Demo, targeting Uttarakhand (Joshimath, Kedarnath, Dharasu, Rishikesh).
* **[System Interfaces & Boundaries](architecture/system-interfaces.md)**: Specifications for how Flutter, FastAPI, AI Risk Engine, PostGIS, MQTT, and Admin Dashboard communicate.
* **[Coding Standards](setup/coding-standards.md)**: Strict code styling rules (PEP 8 / Ruff, Dart format, ESLint), testing mandates, and geospatial standards.
* **[Git & PR Workflow](setup/git-workflow.md)**: Monorepo branching strategies and PR checklists.
