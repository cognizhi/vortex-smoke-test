# VRTX-0228 Implementation Plan: PRODUCT.md Refactoring & Documentation Normalization

## Executive Summary

Refactor PRODUCT.md to be a holistic product specification (WHAT & WHY) while establishing clear documentation boundaries:
- **PRODUCT.md** = Product requirements and user value (sections 1-7) + Operations section (section 8)
- **ARCHITECTURE.md** = Technical implementation (HOW)
- **DESIGN.md** = Visual design system (VISUAL)

Ensure no duplicate facts across the three documents and update changelogs consistently for SPRINT-0045 documentation normalization.

## Current State Analysis

### PRODUCT.md (current)
- ✓ Sections 1-7 are holistic and product-focused (Problem, Users, Value Props, How It Works, Scope, Success Metrics, Related Docs)
- ✓ Section 8 (Operations & monitoring) documents health checks as established operational capabilities
- ⚠️ Changelog has older entries (SPRINT-0039 through SPRINT-0005) that contain sprint-specific implementation details beyond product-level scope
  - Example: SPRINT-0039 lists "Variant-specific health check endpoint `/api/healthz-smoke-763023087`..." with implementation details
  - These details belong in ARCHITECTURE.md changelog
- ✓ SPRINT-0045 entry already present with appropriate documentation normalization framing

### ARCHITECTURE.md (current)
- ✓ Detailed technical implementation documentation
- ✓ Section 5 covers health check endpoints with implementation details
- ✓ SPRINT-0045 entry present with documentation normalization reference
- ✓ Older sprint entries have appropriate technical detail level for ARCHITECTURE.md
- ✓ ARCHITECTURE.md should preserve the detailed variant endpoint history

### DESIGN.md (current)
- ✓ Visual design system documentation
- ✓ SPRINT-0045 entry present indicating no design changes
- ✓ Older entries appropriately indicate "no design changes" for non-design sprints
- ✓ DESIGN.md changelog appropriate for its scope

### Duplicate Facts Analysis
Checking for duplications across the three documents:

1. **Health check endpoints** - Documented in both PRODUCT.md and ARCHITECTURE.md
   - PRODUCT.md (Section 8): High-level description of endpoints as operational capabilities
   - ARCHITECTURE.md (Section 5.5): Detailed implementation including all variants and response formats
   - **Status**: ✓ No duplication - appropriate level separation

2. **Multi-tenancy** - Mentioned in both PRODUCT.md and ARCHITECTURE.md
   - PRODUCT.md (Section 4): "provisions a private PostgreSQL schema"
   - ARCHITECTURE.md (Section 2): Full technical schema-per-merchant model
   - **Status**: ✓ No duplication - PRODUCT.md high-level, ARCHITECTURE.md detailed

3. **Authentication** - Brief mention in PRODUCT.md vs detailed in ARCHITECTURE.md
   - PRODUCT.md (Section 4): Merchant registration flow
   - ARCHITECTURE.md (Section 5.3): Full JWT/bcrypt/auth implementation
   - **Status**: ✓ No duplication - appropriate separation

4. **Booking lifecycle** - Documented in both
   - PRODUCT.md (Section 4): User-visible booking states (Confirmed, Customer-verified, Customer-cancelled, Admin-rescheduled, Admin-cancelled)
   - ARCHITECTURE.md (Section 6): Technical data flow
   - **Status**: ✓ No duplication - PRODUCT.md shows user perspective, ARCHITECTURE.md shows technical flow

## Required Changes

### 1. PRODUCT.md Changelog Refactoring
**Current issue**: Older changelog entries (SPRINT-0039 through SPRINT-0005) contain implementation-specific details unsuitable for a product document.

**Required action**: Consolidate and generalize older entries to product-level summaries:
- Remove sprint-specific endpoint names and implementation details
- Summarize the actual product capability that was delivered
- Maintain consistent formatting across all entries
- Keep the entries but elevate them to product scope

**Approach**:
- Group variant endpoint sprints (SPRINT-0039 through SPRINT-0005) into a single high-level product capability entry
- Reframe as "Monitoring and deployment verification capabilities" rather than "Variant-specific health check endpoint {ID}"
- Keep SPRINT-0045 as the documentation normalization entry
- Maintain chronological order

### 2. ARCHITECTURE.md Changelog - No Changes Required
The ARCHITECTURE.md changelog is appropriately detailed and technical.
- SPRINT-0045 entry is correct
- Older entries have appropriate technical detail
- No changes needed

### 3. DESIGN.md Changelog - No Changes Required
The DESIGN.md changelog appropriately indicates "no design changes" for non-design sprints.
- SPRINT-0045 entry is correct
- No changes needed

## Implementation Steps

1. **Analyze current PRODUCT.md changelog entries** to understand the product capabilities delivered in each sprint
2. **Consolidate variant endpoint entries** into product-level summary
3. **Update PRODUCT.md changelog** with consolidated, product-focused entries
4. **Verify no duplicate facts** across all three documents
5. **Test documentation boundaries** - ensure each fact lives in exactly one appropriate document
6. **Commit changes** with comprehensive message on ticket branch

## Validation Criteria (TDD)

1. PRODUCT.md Section 1-7 contain holistic product requirements (no implementation details) ✓
2. PRODUCT.md Section 8 documents health checks as established operational capabilities ✓
3. No SPRINT-XXXX-specific implementation details remain in PRODUCT.md changelog
4. All three documents (PRODUCT, ARCHITECTURE, DESIGN) have consistent SPRINT-0045 changelog entries
5. No duplicate facts across the three documents
6. Documentation boundaries respected: WHAT (PRODUCT) / HOW (ARCHITECTURE) / VISUAL (DESIGN)
7. All changes committed on ticket branch with clear message

## Files to Modify

- `/workspace/repo/PRODUCT.md` - Changelog refactoring
- (ARCHITECTURE.md and DESIGN.md may need minor touch-ups to ensure changelogs are consistent)

## Success Criteria

After refactoring:
- PRODUCT.md changelog summarizes product capabilities, not implementation details
- ARCHITECTURE.md remains detailed and technical
- DESIGN.md appropriately scoped to design system
- No duplicate facts across documents
- Clear, consistent SPRINT-0045 documentation normalization entries in all three
