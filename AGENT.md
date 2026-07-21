# Agent Responsibilities & Collaboration

This document defines roles, responsibilities, and working agreements for autonomous agents working on this codebase.

---

## Agent Types & Capabilities

### Product (Sprint Planning)
**Responsibility:** Translate product ideas into actionable sprint plans, decompose work into tickets, coordinate across team roles.

**Capabilities:**
- Create sprint plans (SPRINT-PLAN.md with phases, breakdown, acceptance criteria)
- Decompose ideas into EPIC/STORY/TASK hierarchy
- Write Definition-of-Done criteria with fixed interface contracts
- Create file/module ownership maps
- Maintain holistic documentation (PRODUCT.md, ARCHITECTURE.md, DESIGN.md)
- Coordinate ticket sequencing with depends_on relationships

**Working Agreement:**
- Creates one EPIC per standalone feature with 1–5 STORYs per EPIC
- Each STORY has 1–2 TASKs; each phase in SPRINT-PLAN.md maps to one TASK
- For every TASK: commits `artifacts/SPRINT-{n}/{TICKET-KEY}/PLAN.md` with implementation details
- Avoids parallel TASKs that share files (sequences with depends_on)
- Maintains minimum viable backlog — no over-decomposition
- Runs a2a_sprint_plan_checklist before transitioning planning ticket to done
- Writes docs as holistic, current target-state files (not deltas or sprint-specific sections)

---

### Engineer (Implementation)
**Responsibility:** Build features end-to-end (architecture, code, tests, verification), following the sprint plan.

**Capabilities:**
- Design and implement user-facing and backend features
- Write comprehensive test suites (unit, integration)
- Commit code following git conventions (clear messages, new commits not amendments)
- Verify implementation works locally before pushing
- Collaborate with QA on test strategies

**Working Agreement:**
- Reads TASK PLAN.md for scope, interface contracts, file ownership before starting
- Implements to specification; does not overengineer beyond the sprint goal
- Writes tests with high confidence (target > 85% coverage for new code)
- Commits early and often (not one giant commit)
- Does not run `git push --force`, `git reset --hard`, or destructive operations without explicit approval
- Stops and asks if scope creep or ambiguity arises

---

### QA (Test & Verification)
**Responsibility:** Verify implementation against acceptance criteria, design test strategy, report defects.

**Capabilities:**
- Design and run manual test plans
- Verify acceptance criteria are met
- Discover and report edge cases, regressions
- Coordinate with engineer on test coverage strategy

**Working Agreement:**
- Reads TASK acceptance criteria and PLAN.md to understand scope
- Executes manual test scenarios in addition to automated tests
- Reports defects as DEFECT tickets with repro steps
- Verifies fixes before sign-off
- Coordinates with engineer on coverage gaps

---

### Architect (Design Review)
**Responsibility:** Review design and implementation for consistency with system architecture, scalability, and maintainability.

**Capabilities:**
- Review code for architectural alignment
- Identify technical debt or design issues
- Propose refactorings and improvements
- Help resolve design ambiguities

**Working Agreement:**
- Reviews during INTEGRATION_QA phase
- Focuses on architecture, not style (style is linter's job)
- Provides actionable feedback
- Escalates blockers to tech lead

---

## Code Collaboration Protocols

### Git Workflow

1. **Branches:**
   - Ticket branches: `vortex/feat/{TICKET-KEY}-{description}`
   - Forked off the sprint branch `vortex/sprint/{SPRINT-KEY}`
   - One branch per ticket; no cherry-picking across tickets

2. **Commits:**
   - Clear, concise messages: present tense, what & why
   - Example: `Add /api/healthz-smoke-{variant} endpoint for deployment verification`
   - Include Co-Authored-By line if applicable
   - One logical change per commit (not one giant commit, not scattered commits)

3. **Pushing:**
   - Push with `-u origin` for new branches
   - Push only to your ticket branch (not sprint/main)
   - Do not run `--force` or `--force-with-lease` without explicit approval

4. **Merging:**
   - System performs squash-merge to sprint branch when TASK is transitioned to done
   - Do not create or merge PRs yourself
   - Merging happens automatically after a2a_transition_ticket(to="done")

### Code Review

**Inline reviews during development:**
- Use /code-review skill (with --comment for PR-style inline feedback)
- Use /simplify skill for cleanup suggestions

**Sign-off review (INTEGRATION_QA phase):**
- Architect or tech lead reviews full change set
- Focus: architecture alignment, consistency, maintainability
- Verdict: approve, request changes, or escalate

### Communication

**Within tickets:**
- Use a2a_comment_ticket to leave progress notes, ask questions, record decisions
- @ mentions in comments are for visibility only; use a2a_send_message with to_role_key to request action

**Across team:**
- Use a2a_send_message with to_role_key to wake up a specific agent role
- Example: `a2a_send_message(to_role_key="engineer", body="Please implement VRTX-1234")`
- Without to_role_key, message is logged but no agent is notified

### Definition of Done (per TASK)

Every TASK has acceptance criteria that define done. For implementation TASKs:

1. **Code written** — all files from PLAN.md exist and are committed
2. **Tests passing** — all test suites run clean; coverage > 85% for new code
3. **Lint clean** — npm run lint with 0 warnings
4. **TypeScript strict** — npm run typecheck with no errors
5. **Build succeeds** — npm run build completes
6. **Manual verification** — feature works as intended (engineer verifies locally or QA signs off)
7. **Documentation updated** — if TASK touches product/architecture, docs are updated in root docs
8. **Branch pushed** — all commits on ticket branch, pushed to remote with -u

### Disputes & Escalation

If there's ambiguity, misalignment, or a blocker:

1. Ask in the ticket (a2a_comment_ticket)
2. If urgent, message the product or tech lead role
3. Tech lead makes the call and updates the ticket
4. Do not guess; ask first

---

## Documentation Standards

### Root Docs (PRODUCT.md, ARCHITECTURE.md, DESIGN.md)

- **Purpose:** Holistic, current-state specifications; source of truth
- **Scope:** What the system does (PRODUCT.md), how it's built (ARCHITECTURE.md), how it looks (DESIGN.md)
- **Updates:** Full-file rewrites that fold sprint changes into the existing narrative (not sprint-specific sections)
- **Changelog:** Dated entry at the end summarizing what changed
- **Ownership:** Product role (planning), Engineer role (implementation updates), Architect (architecture review)

### Sprint Plans (artifacts/SPRINT-{n}/SPRINT-PLAN.md)

- **Purpose:** Roadmap for execution; phase breakdown and success criteria
- **Audience:** Engineers implementing the sprint
- **Content:** Goals, phases, breakdown, effort, blockers, checkpoints
- **Not included:** Per-ticket implementation details (those go in PLAN.md files)

### Task Plans (artifacts/SPRINT-{n}/{TICKET-KEY}/PLAN.md)

- **Purpose:** Detailed specification for a single TASK
- **Content:** Scope, interface contracts, file/module ownership, test strategy, Definition-of-Done
- **Audience:** Engineer implementing the task
- **Not included:** Sprint-wide context (that's in SPRINT-PLAN.md)

### Implementation Notes (per feature, if needed)

- **File:** `IMPLEMENTATION_NOTES_{FEATURE-ID}.md`
- **Purpose:** Deep technical decisions, trade-offs, lessons for future maintainers
- **When:** Only if the feature is complex or has non-obvious design choices
- **Audience:** Maintainers reading the code later

---

## Performance & Reliability Expectations

### Response Times

- **Health check endpoints** — target < 100ms (typical < 10ms), zero dependencies
- **API endpoints** — target < 500ms p95 for 95th percentile response
- **Page load** — target < 2s p95 for customer-facing booking page

### Uptime

- **SLA target:** 99.5% uptime (4.5 hours downtime/month)
- **Health check integration:** All dependencies monitored; `/api/health` endpoint for orchestration platforms

### Testing

- **Unit coverage:** > 80% for new code
- **Integration coverage:** Critical paths and error scenarios
- **Load testing:** Health checks verified under 50+ concurrent requests
- **Manual smoke tests:** Before merge, engineer tests locally

---

## Code Style & Conventions

- **Language:** TypeScript 5 (strict mode)
- **Formatting:** Prettier (auto-formatted)
- **Linting:** ESLint (0 warnings allowed)
- **Type safety:** No `any` without justification; complete annotations
- **Components:** Server Components by default; Client Components marked `"use client"` and kept small
- **Database:** Drizzle ORM with Zod validation; migrations via db:generate / db:migrate
- **Styling:** Tailwind CSS with design tokens in globals.css; shadcn/ui-style primitives in components/ui/

---

## Changelog

### 2026-07-21 — SPRINT-0098: Three independent smoke test endpoints (107173471) (no agent protocol changes)

This sprint focused on adding three independent smoke test endpoints for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-21 — SPRINT-0097: Three independent smoke test endpoints (661868846) (no agent protocol changes)

This sprint focused on adding three independent smoke test endpoints for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-19 — SPRINT-0092: Three independent smoke test endpoints (509572604) (no agent protocol changes)

This sprint focused on adding three independent smoke test endpoints for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-16 — SPRINT-0073: Three independent variant endpoints (121996100) (no agent protocol changes)

This sprint focused on adding three variant-specific health check endpoints for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-15 — SPRINT-0070: Three independent variant endpoints (1012136249) (no agent protocol changes)

This sprint focused on adding three variant-specific health check endpoints for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-15 — SPRINT-0069: Three independent variant endpoints (276127630) (no agent protocol changes)

This sprint focused on adding three variant-specific health check endpoints for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-14 — SPRINT-0067: Three independent variant endpoints (no agent protocol changes)

This sprint focused on adding three variant-specific health check endpoints for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-12 — SPRINT-0064: Three independent variant endpoints (no agent protocol changes)

This sprint focused on adding three variant-specific health check endpoints for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-11 — SPRINT-0054: Variant smoke test endpoint (no agent protocol changes)

This sprint focused on adding a variant-specific health check endpoint for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-11 — SPRINT-0053: Variant smoke test endpoint (no agent protocol changes)

This sprint focused on adding a variant-specific health check endpoint for deployment verification. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-10 — SPRINT-0052: Bugfix smoke test health check endpoints (no agent protocol changes)

This sprint focused on adding deployment verification infrastructure. No changes to agent roles, responsibilities, working agreements, or collaboration protocols.

### 2026-07-10 — SPRINT-0051: Agent roles and collaboration protocols

**Added:**
- AGENT.md created with role definitions and working agreements
- Defined agent types: Product, Engineer, QA, Architect
- Established git workflow, code review protocols, communication standards
- Documented Definition-of-Done criteria for TASKs
- Outlined performance and reliability expectations
- Provided dispute resolution and escalation procedures

**Purpose:**
- Establish clarity on agent responsibilities and working agreements
- Reduce friction and ambiguity in autonomous team collaboration
- Document code style, git conventions, and documentation standards

