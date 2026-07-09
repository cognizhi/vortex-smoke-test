# VRTX-0227 TDD Test Cases: PRODUCT.md Holistic Specification Validation

## Test Suite: PRODUCT.md Refactoring Verification

### TC-1: PRODUCT.md Structure - Holistic Requirements (RED Phase)
**Goal:** Verify PRODUCT.md contains sections 1-7 with holistic product requirements, not implementation details.

**Test 1.1: All required sections present**
- Assert Section 1 "Problem" exists — describes business problem from customer perspective
- Assert Section 2 "Users" exists — defines user tiers (Merchants, Staff, Customers) and their needs
- Assert Section 3 "Value propositions" exists — lists 5 product value propositions
- Assert Section 4 "How it works" exists — describes user workflows (merchant onboarding, booking flow, admin dashboard, booking lifecycle)
- Assert Section 5 "Scope" exists — lists in-scope (shipped) and out-of-scope (post-MVP) features
- Assert Section 6 "Success metrics" exists — defines launch and adoption success metrics
- Assert Section 7 "Related docs" exists — references ARCHITECTURE.md, DESIGN.md, and product brief

**Test 1.2: Sections 1-7 are product-focused, not implementation-focused**
- Assert no technical implementation details in sections 1-7 (no Drizzle, PostgreSQL schemas, JWT, route handlers)
- Assert no specific stack technology mentions in main sections
- Assert no code examples or implementation patterns
- Assert high-level business/user language throughout

**Test 1.3: No SPRINT-XXXX references in sections 1-7**
- Assert no SPRINT-specific feature announcements in main sections
- Assert all SPRINT references confined to Changelog section
- Assert main sections describe capabilities, not sprint deliverables

### TC-2: Operations & Monitoring Section - User-Facing Capabilities (RED Phase)
**Goal:** Verify Section 8 documents operational capabilities without implementation details.

**Test 2.1: Section 8 exists with health check content**
- Assert Section 8 titled "Operations & monitoring" exists
- Assert subsection "Health check endpoints" exists
- Assert `/api/health` endpoint is documented
- Assert `/api/healthz-smoke` endpoint is documented
- Assert "Variant smoke test endpoints" are documented

**Test 2.2: Health checks framed as operational capabilities**
- Assert endpoints described from operations team perspective (monitoring systems, load balancers)
- Assert `/api/health` framed as "General health check... for monitoring"
- Assert `/api/healthz-smoke` framed as "smoke test for load balancers and monitoring systems"
- Assert Variant endpoints framed as deployment verification and A/B testing support
- Assert all endpoints marked as "public" (no authentication required)

**Test 2.3: No implementation details in Operations section**
- Assert no technical details about response envelopes (e.g., no description of exact JSON structure)
- Assert no implementation patterns (e.g., no mention of specific code files or architecture)
- Assert focus on what endpoints provide, not how they're implemented
- Assert appropriate for non-technical operations audience

### TC-3: No SPRINT-XXXX-Specific Feature Sections (RED Phase)
**Goal:** Verify all sprint-specific feature announcements removed from main content.

**Test 3.1: Main sections (1-8) contain no sprint-specific features**
- Assert no sections titled like "SPRINT-XXXX: Feature Name"
- Assert no inline sprint feature announcements
- Assert all capability descriptions are current target-state, not sprint-specific
- Assert features described as permanent product capabilities, not temporary sprint deliverables

**Test 3.2: Changelog is the only sprint-focused section**
- Assert SPRINT references only appear in Changelog section
- Assert Changelog clearly separated from main product spec (after "---" section break)
- Assert main specification could stand alone without changelog

### TC-4: Health Check Endpoints - Established Capabilities (RED Phase)
**Goal:** Verify health checks documented as established, mature operational capabilities.

**Test 4.1: Endpoints presented as established, not new**
- Assert endpoints described as "The platform provides health check endpoints" (established language)
- Assert not described as "New in SPRINT-XXXX" or similar
- Assert endpoints integrated into Operations section as standard capability
- Assert no "beta" or "experimental" terminology

**Test 4.2: Capability focus over implementation**
- Assert descriptions explain what endpoints do from user perspective
- Assert descriptions explain why operations teams need them
- Assert descriptions explain use cases (monitoring, load balancers, deployment verification)
- Assert no technical implementation details (response envelope structure, JSON field names, status codes)

### TC-5: Comprehensive Changelog (RED Phase)
**Goal:** Verify changelog includes dated entries for all sprint work.

**Test 5.1: Changelog section exists and is complete**
- Assert "## Changelog" section exists
- Assert SPRINT-0045 entry present (documentation normalization sprint)
- Assert entries for prior sprints present (SPRINT-0033, SPRINT-0005+)
- Assert entries are dated with format "YYYY-MM-DD — SPRINT-XXXX: Title"

**Test 5.2: Changelog entries are product-level summaries**
- Assert entries describe product capabilities delivered, not implementation details
- Assert each entry includes overview or summary of what was added
- Assert entries appropriate for product audience (business/user focused)
- Assert entries maintain consistent formatting

**Test 5.3: Changelog accurately reflects sprint history**
- Assert SPRINT-0045 entry describes documentation normalization and boundary establishment
- Assert prior sprint entries describe product capabilities
- Assert no implementation-specific details in PRODUCT.md changelog
- Assert detailed implementation history preserved in ARCHITECTURE.md

### TC-6: Content Boundaries - No Duplication (RED Phase)
**Goal:** Verify clear boundaries and no duplicate facts across PRODUCT.md, ARCHITECTURE.md, DESIGN.md.

**Test 6.1: Health check endpoints - proper boundary**
- PRODUCT.md: Describes what endpoints do and why operations teams need them
- ARCHITECTURE.md: Describes technical implementation, specific variants, response formats
- Assert no fact repeated verbatim across documents
- Assert complementary, not duplicative

**Test 6.2: Multi-tenancy - proper boundary**
- PRODUCT.md: "provisions a private PostgreSQL schema" (user benefit perspective)
- ARCHITECTURE.md: Detailed schema-per-merchant model, DDL, factory patterns
- Assert no duplication
- Assert appropriate level separation

**Test 6.3: Authentication - proper boundary**
- PRODUCT.md: Merchant registration, login, admin capabilities
- ARCHITECTURE.md: JWT implementation, bcrypt, session management
- Assert no duplication
- Assert technical details in ARCHITECTURE.md only

**Test 6.4: Booking flow - proper boundary**
- PRODUCT.md: User-visible booking states and workflow
- ARCHITECTURE.md: Technical data flow and database operations
- Assert no duplication
- Assert appropriate perspective separation

### TC-7: Related Docs Section - Proper References (RED Phase)
**Goal:** Verify Section 7 properly references other planning documents.

**Test 7.1: Section 7 exists and references related docs**
- Assert Section 7 "Related docs" exists
- Assert references to ARCHITECTURE.md present
- Assert references to DESIGN.md present
- Assert reference to full product brief present

**Test 7.2: Section 7 sets proper context**
- Assert references explain what each document covers
- Assert ARCHITECTURE.md described as technical implementation
- Assert DESIGN.md described as design system
- Assert boundaries are clear

### TC-8: Commitment to Specifications (RED Phase)
**Goal:** Verify PRODUCT.md is current target-state specification.

**Test 8.1: Specifications are current and comprehensive**
- Assert Section 1: Problem statement matches current product positioning
- Assert Section 2: User tiers and needs match current product
- Assert Section 3: Value propositions match current delivered capabilities
- Assert Section 4: How it works describes current user experience
- Assert Section 5: Scope matches current shipping status

**Test 8.2: Holistic specification complete**
- Assert all major product capabilities described in Section 4
- Assert all user workflows documented
- Assert all major admin features documented
- Assert customer experience fully described
- Assert no gaps in product description

## Acceptance Criteria Verification Matrix

| AC# | Requirement | Test Cases | Status |
|-----|------------|-----------|--------|
| 1 | Sections 1-7 holistic requirements | TC-1, TC-2, TC-8 | Will verify |
| 2 | Operations section user-facing capabilities | TC-2, TC-4 | Will verify |
| 3 | All SPRINT-XXXX features removed | TC-3, TC-1 | Will verify |
| 4 | Health checks as operational capabilities | TC-4, TC-2 | Will verify |
| 5 | Changelog includes all sprints | TC-5 | Will verify |
| 6 | No duplicate information | TC-6 | Will verify |

## Test Execution Strategy

1. **RED Phase** (this document): Define test cases before verification
2. **GREEN Phase** (tdd-test-result.md): Execute all tests and record results
3. **VERIFICATION**: All tests must pass to satisfy ticket requirements

## Total Test Cases: 27
- TC-1: 3 tests
- TC-2: 3 tests
- TC-3: 2 tests
- TC-4: 2 tests
- TC-5: 3 tests
- TC-6: 4 tests
- TC-7: 2 tests
- TC-8: 2 tests

All test cases defined before implementation (RED phase).
