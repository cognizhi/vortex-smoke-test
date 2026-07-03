# Task MW3-0001-forge: Transition to In Review

## Status: READY FOR SIGN-OFF

**Date**: 2026-06-07  
**Stage**: forge → in_review

---

## Deliverable

**Product Brief Document**: [docs/product-mw3-0001-booking-system.md](./product-mw3-0001-booking-system.md)

---

## Summary

The product brief for the Self-Serve Booking System has been completed with the following contents:

### 1. Problem Statement ✓
- Small service businesses need customizable booking system without platform lock-in
- Current solutions are either too technical or under-customizable

### 2. Target Users ✓
- **Primary**: Merchants (business owners)
- **Secondary**: Staff/employees  
- **Tertiary**: End customers

### 3. MVP Scope ✓
All core features defined:
- Merchant onboarding with subdomain selection
- Admin dashboard (calendar/list views)
- Staff management (CRUD, availability, capacity)
- Services management (CRUD, pricing, duration)
- Customer management (verification tracking)
- Design customization (colors, typography)
- Settings (multi-admin, expiry window)
- Frontend booking flow (guest checkout)
- Email communications via SendGrid

### 4. Acceptance Criteria ✓
29 measurable acceptance criteria documented:
- 3 for registration & subdomain
- 4 for admin dashboard
- 4 for staff module
- 2 for services module
- 5 for frontend booking flow
- 4 for cancellation & link validation
- 3 for customer management
- 3 for design & settings

### 5. Assumptions Logged ✓

**Decisions Made:**
- A-01: SQLite for merchant databases (file-based isolation)
- A-02: No "Book again" on cancellation page
- A-03: HMAC-signed tokens for cancel links
- A-04: 15-minute default expiry window
- A-05: Email verification is tracking-only (not a booking gate)

**Open Questions (Requires Stakeholder Input):**
- OQ-01: Expiry window configurable range (recommended: 5-60 min)
- OQ-02: Database retention on account cancellation (recommended: 30-day grace → soft delete → 90-day permanent)
- OQ-03: Merchant/database limits per server (recommended: no hard limit initially)
- OQ-04: Slug validation format (recommended: lowercase + hyphens, 3-30 chars)

---

## Next Steps

1. **Technical Lead Review**: Validate technical feasibility of decisions (SQLite isolation, wildcard DNS, SSL provisioning)
2. **QA Review**: Confirm acceptance criteria are testable and complete
3. **Stakeholder Input**: Resolve open questions (OQ-01 through OQ-04)
4. **Sign-Off**: Approved → proceed to implementation stage

---

## Blocking Dependencies

| Dependency | Owner | Action Required |
|------------|-------|-----------------|
| Infrastructure: Wildcard DNS + SSL | Infra Team | Confirm `*.platform.com` can be configured |
| SendGrid API access | DevOps | Provide API credentials |
| Expiry window range decision | Product/Stakeholder | Approve min/max values |
| Data retention policy | Legal/Compliance | Confirm deletion/archival timeline |

---

## A2A Transition

**Note**: A2A CLI tool unavailable due to skill dependency issue. This handoff document serves as the transition record.

**Recommended Command (when available)**:
```bash
vortex-a2a transition-task --task-id "MW3-0001" --to in_review --note "Product brief complete with 29 acceptance criteria and documented assumptions"
```

---

*Product Manager ready to address review feedback.*
