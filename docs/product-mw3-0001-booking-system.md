# Product Brief: Self-Serve Booking System for Small Service Businesses

**Document Status**: Draft → In Review  
**Task ID**: MW3-0001-forge  
**Last Updated**: 2026-06-07

---

## 1. Problem Statement

Small-to-medium service businesses (salons, clinics, fitness studios, consultants) need a self-contained online booking system that handles:
- Staff scheduling
- Service management
- Customer records
- Automated email communication

**Current Pain Points:**
- Existing solutions are platform-locked (cannot escape ecosystem)
- Under-customizable for specific business needs
- Technical setup complexity beyond most small business owners
- Third-party platform fees and commission structures
- Limited control over customer data and communication

---

## 2. Target Users

### Primary: Merchants (Business Owners)
- Own a service-based business (salon, clinic, fitness studio, consulting firm)
- Need to manage appointments and staff schedules
- Want full ownership of their customer data
- Value simplicity but require flexibility for real-world scheduling
- Technical comfort: Low to moderate

### Secondary: Merchant Employees
- Service providers whose availability needs to be managed
- Have individual schedules and capacity limits
- May have leave/MC/off days that affect availability

### Tertiary: End Customers
- Need to book appointments with the merchant's business
- Want a frictionless booking experience
- Need ability to cancel or reschedule without calling
- Expect immediate confirmation

---

## 3. Product Vision

**Vision**: Empower small service businesses to launch their own branded booking pages in minutes—with full control over scheduling, pricing, and customer communication—without platform lock-in or technical complexity.

**Core Value Propositions:**
1. **Instant Setup**: Choose a subdomain, add services and staff, go live immediately
2. **Full Ownership**: Dedicated database isolation—customer data never shared with competitors
3. **Flexible Scheduling**: Admins retain full control to handle real-world exceptions
4. **Frictionless Booking**: Guest checkout model—no registration required for customers
5. **Automated Communication**: Professional email confirmations and notifications via SendGrid

---

## 4. MVP Scope

### 4.1 In Scope (MVP)

#### Merchant Onboarding & Infrastructure
- [x] Merchant registration with custom subdomain slug (e.g., `glamour-studio`)
- [x] Real-time availability checking for slug uniqueness
- [x] Dedicated database provisioning per merchant (database isolation)
- [x] Wildcard DNS support (`*.platform.com`)
- [x] Automated SSL certificate provisioning

#### Backend Admin Panel

**Dashboard**
- Booking management (create, view, edit, cancel, reschedule)
- Calendar view and list view toggles
- Admin-initiated changes to confirmed bookings
- Automatic email notifications for admin changes

**Staff Management**
- Full CRUD for employee profiles (name, photo, contact)
- Per-employee availability time slots
- Maximum concurrent bookings per time slot
- Blocked dates (annual leave, MC, off days)

**Services Management**
- Full CRUD for services/products
- Price and duration fields per service
- Services can be enabled/disabled

**Customer Management**
- Customer list with contact information
- Full booking history per customer
- Email verification status tracking (verified vs. guest)
- Manual resend of confirmation emails
- Limited-time offer email campaigns

**Design Customization**
- Text and widget customization
- Color pickers for available/unavailable slot colors (text + background)
- Calendar border, border-radius, and font-size controls

**Settings**
- Multiple admin user management per merchant
- Toggle employee visibility on frontend
- Configurable time slot duration
- Configurable booking expiry window (default: 15 minutes)
- Display language selection

#### Frontend Booking Page (`{slug}.platform.com`)
- Service and staff selection before time slots displayed
- Time slot filtering by staff availability + service duration
- Booking form: email, first name, contact number
- Guest checkout model (immediate confirmation)
- Confirmation email with signed one-click cancel link
- Cancel link valid until appointment start time

#### Booking Lifecycle
- **Submitted/Confirmed**: Immediate confirmation, email sent
- **Customer-Verified**: Customer clicks verification link (CRM tracking only)
- **Customer-Cancelled**: Click cancel link → slot released, merchant notified
- **Admin-Rescheduled**: Original slot released, new slot confirmed, notification sent
- **Admin-Cancelled**: Slot released, notification sent

#### Email Communications (SendGrid)
- Customer: Booking confirmation with cancel link
- Customer: Rescheduling notification (admin-initiated)
- Customer: Cancellation confirmation
- Merchant: New booking notification
- Merchant: Cancellation notification
- Admin-triggered: Manual confirmation reminders and offers

### 4.2 Out of Scope (Post-MVP)

- [ ] Embeddable widget (WordPress, Shopify plugins)
- [ ] Custom domain support (merchant brings own domain)
- [ ] Payment processing at booking time
- [ ] Two-way calendar sync (Google Calendar, Outlook)
- [ ] Native mobile apps
- [ ] Automated SMS notifications
- [ ] Waitlist / queue management
- [ ] Mandatory email verification as booking gate
- [ ] Customer self-service rescheduling (cancel + rebook only)
- [ ] "Book again" prompts on cancellation pages

---

## 5. Acceptance Criteria (Measurable)

### Registration & Subdomain
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-01 | Merchant registration includes slug input with real-time uniqueness check | Manual test: Attempt duplicate slug; UI prevents submission |
| AC-02 | Merchant registration provisions dedicated database upon signup completion | Database audit: Verify new database exists with merchant data isolated |
| AC-03 | Booking page accessible at `{slug}.platform.com` with valid SSL | Browser visit to subdomain; SSL certificate validation |

### Admin Dashboard
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-04 | Dashboard renders bookings in calendar and list views | UI toggles between both views; data consistent |
| AC-05 | Admin can cancel, reschedule, or edit any confirmed booking | Manual test: Modify confirmed booking; changes persist |
| AC-06 | Admin reschedule releases original slot and confirms new slot immediately | Slot availability reflects changes in real-time |
| AC-07 | Admin reschedule triggers automatic email notification via SendGrid | Email received at customer address with new time |

### Staff Module
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-08 | Full CRUD for employee profiles with photo and contact | Create, edit, delete staff; changes reflect on frontend |
| AC-09 | Per-employee availability slots configurable | Staff-specific availability visible on booking page |
| AC-10 | Maximum concurrent bookings per slot configurable | Overbooking prevented when limit reached |
| AC-11 | Blocked dates (leave, MC, off) configurable | Blocked dates excluded from available slots |

### Services Module
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-12 | Full CRUD for services with price and duration | Services list shows correct data; duration used in slot filtering |
| AC-13 | Services can be enabled/disabled | Disabled services hidden from booking page |

### Frontend Booking Flow
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-14 | Customer must select staff + service before time slots shown | UI requires both selections; slots appear after |
| AC-15 | Time slots filtered by staff availability AND service duration | Slots reflect correct availability based on selections |
| AC-16 | Booking form captures email, first name, contact number | Form submission persists all fields to database |
| AC-17 | Booking confirmed immediately on submission (no verification gate) | Booking appears in admin dashboard immediately |
| AC-18 | Confirmation email sent via SendGrid with signed cancel link | Email received; cancel link accessible and valid |

### Cancellation & Link Validation
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19 | Cancel link valid until appointment scheduled start time | Click before start time → cancellation succeeds |
| AC-20 | Cancel link returns "expired" at/after appointment start time | Click at/after start time → error message displayed |
| AC-21 | Cancellation releases slot and notifies merchant via email | Slot becomes available; merchant receives notification email |
| AC-22 | Cancellation success page confirms only (no rebook prompt) | Page shows cancellation confirmation without "Book again" link |

### Customer Management
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-23 | Customer records flagged as "verified" when confirmation link clicked | Customer list shows verified status after link click |
| AC-24 | Unverified customers visible in list and remain bookable | Guest customers appear in list; can make new bookings |
| AC-25 | Admin can manually resend confirmation or offer emails via SendGrid | Trigger email; customer receives message |

### Design & Settings
| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-26 | Color pickers for available/unavailable slot colors (text + background) | Custom colors applied to booking page calendar |
| AC-27 | Calendar border, border-radius, font-size controls functional | Custom styles applied to booking page |
| AC-28 | Multiple admin users manageable per merchant | Create multiple admins; each can access dashboard |
| AC-29 | Expiry window configurable (default 15 minutes) | Setting adjusts displayed expiry on booking page |

---

## 6. Assumptions & Open Questions

### Decisions Made
| # | Assumption | Rationale |
|---|------------|-----------|
| A-01 | **SQLite for merchant databases** (separate `.db` files) | Simpler file-based isolation; Drizzle supports SQLite via `better-sqlite3`; easier backups and per-merchant cleanup |
| A-02 | **Cancellation success page shows no "Book again" link** | Per requirements—customers who cancel should not be prompted to rebook; keeps flow focused |
| A-03 | **Cancel link uses HMAC-signed token with booking ID** | Non-guessable, stateless validation; no database lookup required for token verification |
| A-04 | **Booking expiry window defaults to 15 minutes** | Industry standard for session holds; configurable per merchant |
| A-05 | **Email verification is tracking-only, not a booking gate** | Frictionless guest checkout is priority; verification for CRM purposes only |

### Open Questions (Needs Stakeholder Input)
| # | Question | Impact | Recommended Decision |
|---|----------|--------|---------------------|
| OQ-01 | What is the configurable range for expiry window (min/max)? | UX consistency, abuse prevention | Recommend: 5 min minimum, 60 min maximum |
| OQ-02 | What happens to merchant database on account cancellation? | Data retention policy, compliance | Recommend: 30-day grace period → soft delete → permanent after 90 days |
| OQ-03 | Is there a defined limit on merchants/databases per server? | Infrastructure scaling, cost planning | Recommend: No hard limit initially; monitor resource usage |
| OQ-04 | How is slug validation formatted (allowed characters)? | UX, URL safety | Recommend: lowercase letters, numbers, hyphens only; min 3, max 30 chars |

### Technical Assumptions
| # | Assumption | Verification Needed |
|---|------------|---------------------|
| TA-01 | Wildcard DNS (`*.platform.com`) is configured at infrastructure level | Infra team confirmation |
| TA-02 | SSL certificate provisioning via Let's Encrypt or Vercel | Platform capability check |
| TA-03 | SendGrid API access and credentials available | Account setup required |
| TA-04 | Server filesystem supports per-merchant SQLite files | I/O performance validation |

---

## 7. Success Metrics

### Launch Metrics
- [ ] 100% of acceptance criteria pass in QA
- [ ] Zero security vulnerabilities in penetration test
- [ ] Booking page loads in <2 seconds (95th percentile)
- [ ] Email delivery rate >95% via SendGrid

### Adoption Metrics (Post-Launch)
- [ ] Merchant signup-to-live time <10 minutes
- [ ] Customer booking completion rate >85%
- [ ] Admin booking modification rate <15% (indicates smooth customer flow)

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SQLite I/O bottleneck with high merchant count | Medium | High | Monitor performance; migrate to PostgreSQL sharding if needed |
| SendGrid rate limits on email volume | Low | Medium | Implement queue/batch sending; monitor SendGrid quotas |
| Subdomain squatting / abuse | Medium | Medium | Implement slug validation; abuse reporting mechanism |
| Data loss from file-based SQLite | Low | High | Automated daily backups; disaster recovery plan |
| Cancel link enumeration attacks | Low | High | HMAC-signed tokens with high entropy; rate limiting on cancel endpoint |

---

## 9. Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| Wildcard DNS configuration | Infrastructure | Pending |
| SSL certificate provisioning | Infrastructure | Pending |
| SendGrid API credentials | DevOps | Pending |
| Database provisioning automation | Backend Team |待办 |
| Email template designs | Design Team |待办 |

---

## 10. Sign-Off

**Product Owner**: [Pending]  
**Technical Lead**: [Pending]  
**QA Lead**: [Pending]  
**Date Ready for Review**: 2026-06-07

---

## Document History

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-06-07 | 0.1 | Initial product brief created | Product Manager |
