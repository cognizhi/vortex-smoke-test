# VRTX-0228 TDD Test Cases: Documentation Refactoring Validation

## Test Suite: Documentation Normalization & Boundary Verification

### TC-1: PRODUCT.md Structure & Scope (RED Phase)
**Goal**: Verify PRODUCT.md contains holistic product specification (sections 1-7) with operations (section 8), no implementation details.

**Test 1.1: Sections 1-7 exist and contain product-level content**
- Assert file contains sections: Problem, Users, Value propositions, How it works, Scope, Success metrics, Related docs
- Verify each section uses high-level language (WHAT & WHY, not HOW)
- Assert no technical implementation details in sections 1-7
- Assert no references to specific sprints or implementation timelines

**Test 1.2: Section 8 (Operations) covers health checks**
- Assert Section 8 titled "Operations & monitoring" exists
- Verify `/api/health` endpoint is documented
- Verify `/api/healthz-smoke` endpoint is documented
- Verify "Variant smoke test endpoints" are documented as established capabilities
- Assert endpoints are described as operational/monitoring features, not sprint features

**Test 1.3: No sprint-specific implementation details in PRODUCT.md body**
- Assert main sections (1-8) do not contain SPRINT-XXXX references that describe implementation
- Assert no detailed implementation patterns or technical decisions in body sections
- Assert no code examples or technical specifics

### TC-2: PRODUCT.md Changelog Format & Scope (RED Phase)
**Goal**: Verify changelog entries are product-focused with consistent formatting.

**Test 2.1: Changelog entry format consistency**
- Assert all entries follow pattern: `### YYYY-MM-DD — SPRINT-XXXX: Title`
- Assert all entries have **Overview:** or **Changes:** sections
- Assert no orphaned or malformed entries

**Test 2.2: SPRINT-0045 entry present and correct**
- Assert SPRINT-0045 entry exists
- Verify it references "Product documentation sprint" or "documentation normalization"
- Assert it describes refactoring of PRODUCT.md as holistic specification
- Verify mention of establishing documentation boundaries

**Test 2.3: Changelog entries are product-level, not implementation-level**
- Assert variant endpoint entries (if consolidated) describe product capability, not specific endpoint names like `/api/healthz-smoke-763023087`
- Assert no detailed implementation patterns
- Assert entries summarize customer/product value, not technical details
- Example good entry: "Monitoring and deployment verification capabilities for operations teams"
- Example bad entry: "Variant-specific health check endpoint `/api/healthz-smoke-763023087`..."

**Test 2.4: Historical changelog entries appropriate**
- Assert entries from SPRINT-0005 through SPRINT-0039 maintain historical accuracy
- Verify consolidation doesn't lose important product capability information
- Assert entries are grouped logically if consolidated

### TC-3: ARCHITECTURE.md Changelog (RED Phase)
**Goal**: Verify ARCHITECTURE.md changelog remains detailed and technical (no changes required).

**Test 3.1: ARCHITECTURE.md SPRINT-0045 entry present**
- Assert SPRINT-0045 entry exists in ARCHITECTURE.md
- Verify it references documentation normalization
- Assert it notes ARCHITECTURE.md's role in holding technical implementation details

**Test 3.2: ARCHITECTURE.md maintains technical detail level**
- Assert entries describe technical implementation details (e.g., specific endpoint names, routes, patterns)
- Assert entries like SPRINT-0039 are preserved with full variant endpoint details
- Assert no simplification of technical content

### TC-4: DESIGN.md Changelog (RED Phase)
**Goal**: Verify DESIGN.md changelog appropriately scoped.

**Test 4.1: DESIGN.md SPRINT-0045 entry present**
- Assert SPRINT-0045 entry exists
- Verify it correctly indicates no design changes (documentation only)

**Test 4.2: DESIGN.md entries appropriate for non-design sprints**
- Assert entries for non-design sprints (SPRINT-0039, SPRINT-0038, etc.) indicate "no design changes"
- Verify entries are concise and appropriate

### TC-5: No Duplicate Facts (RED Phase)
**Goal**: Verify no duplication across PRODUCT.md, ARCHITECTURE.md, DESIGN.md.

**Test 5.1: Health check endpoint documentation**
- Assert PRODUCT.md describes health checks at product capability level
- Assert ARCHITECTURE.md provides technical implementation details
- Verify complementary, not duplicative

**Test 5.2: Multi-tenancy documentation**
- Assert PRODUCT.md mentions schema provisioning at user/business level
- Assert ARCHITECTURE.md details schema-per-merchant technical model
- Verify no duplication, appropriate level separation

**Test 5.3: Booking lifecycle documentation**
- Assert PRODUCT.md documents states from user perspective
- Assert ARCHITECTURE.md documents data flow from technical perspective
- Verify no fact repeated verbatim across documents

**Test 5.4: Authentication documentation**
- Assert PRODUCT.md mentions merchant registration/login at user level
- Assert ARCHITECTURE.md covers JWT/bcrypt implementation
- Verify no duplication

### TC-6: Documentation Boundaries (RED Phase)
**Goal**: Verify each fact lives in exactly one appropriate planning document.

**Test 6.1: PRODUCT.md boundary - WHAT & WHY**
- Assert all primary facts are user value or business requirement focused
- Assert no technical "HOW" details
- Assert no visual/design details

**Test 6.2: ARCHITECTURE.md boundary - HOW**
- Assert all primary facts are technical implementation focused
- Assert no product capability claims (those belong in PRODUCT.md)
- Assert no visual/design system details

**Test 6.3: DESIGN.md boundary - VISUAL**
- Assert all primary facts are visual design and design system focused
- Assert no product capability claims
- Assert no technical implementation details

### TC-7: Commit & Version Control (RED Phase)
**Goal**: Verify all changes are properly committed.

**Test 7.1: Branch and commit status**
- Assert working on ticket branch `vortex/feat/VRTX-0228-*`
- Assert all artifact files committed (plan.md, tdd-test-cases.md, tdd-test-result.md, summary.md)
- Assert all source file changes committed (PRODUCT.md, ARCHITECTURE.md if needed, DESIGN.md if needed)
- Assert commit message clearly describes documentation refactoring
- Assert commit message references VRTX-0228

**Test 7.2: Artifact files present**
- Assert artifacts/SPRINT-0045/VRTX-0228/plan.md exists
- Assert artifacts/SPRINT-0045/VRTX-0228/tdd-test-cases.md exists
- Assert artifacts/SPRINT-0045/VRTX-0228/tdd-test-result.md exists
- Assert artifacts/SPRINT-0045/VRTX-0228/summary.md exists

## Acceptance Criteria Verification

This test suite directly validates all acceptance criteria from VRTX-0228:
- ✓ TC-1: PRODUCT.md fully refactored with holistic requirements (sections 1-7) and operations (section 8)
- ✓ TC-2.3: All SPRINT-XXXX-specific implementation details removed from PRODUCT.md
- ✓ TC-1.2: Health check endpoints documented as established operational capabilities
- ✓ TC-2: PRODUCT.md changelog with consistent formatting for all sprints including SPRINT-0045
- ✓ TC-3, TC-4: ARCHITECTURE.md and DESIGN.md changelogs updated for SPRINT-0045
- ✓ TC-5: No duplicate facts between the three documents
- ✓ TC-7: All changes committed on ticket branch
- ✓ TC-6: Documentation boundaries adhered to

## Test Execution Strategy

1. **RED phase** (this document): Define all test cases before implementation
2. **IMPLEMENTATION**: Execute refactoring based on test requirements
3. **GREEN phase** (tdd-test-result.md): Run validation tests and record results
4. All tests must pass before marking ticket as done
