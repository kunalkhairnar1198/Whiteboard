# Agent Rule: History and Decision Management

## Objective
Ensure that every architectural change, significant feature addition, or configuration update is documented to maintain context across AI sessions and for human developers.

## Mandatory Protocols

### 1. Decision Logging
- **File**: `DECISIONS.md` (at the project root).
- **Trigger**: Any non-trivial change (new features, refactors, dependency changes).
- **Format**: Must update the table in `DECISIONS.md` with:
  - `Date`: Current date.
  - `Change Type`: Feature, Bugfix, Refactor, or Architecture.
  - `Rationale`: Why was this change made?
  - `Affected Components`: List of files/modules impacted.

### 2. Git Standards
- **Conventional Commits**: Use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat:`, `fix:`, `refactor:`, `chore:`) for all commit messages.

### 3. State Management Standards
- **URL-Based State**: Prioritize URL-based state management (e.g., using `nuqs` or search params) for any UI state that impacts navigation, filters, or view modes. This ensures browser history compatibility (Back/Forward buttons work) and allows for link sharing.

### 4. Continuity Protocol (Self-Correction)
- **Pre-flight Check**: Before starting any new task, the agent **MUST** read `DECISIONS.md` and all files in `.agents/rules/` to align with the project's historical context and established standards.

### 5. Documentation Preservation
- Never remove existing comments or documentation unless explicitly asked or if the code being documented is removed.
