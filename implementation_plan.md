# Complete Backend Implementation — Route Billing System

## Overview

Full backend rewrite implementing all 10 modules with proper schema, validation, business logic, and API endpoints. **No UI changes.** Works with existing frontend API calls in `api.js`.

## Key Analysis — Frontend API Calls

The frontend calls these exact endpoints (from `api.js`):

| Frontend Call | Endpoint | Route File |
|---|---|---|
| `getDashboardStats()` | `GET /api/dashboard/stats` | `dashboard.js` |
| `getStudents()` | `GET /api/students` | `students.js` |
| `addStudent()` | `POST /api/students` | `students.js` |
| `getTransport()` | `GET /api/transport` | `transport.js` |
| `addTransport()` | `POST /api/transport` | `transport.js` |
| `updateTransport(id)` | `PUT /api/transport/:id` | `transport.js` |
| `deleteTransport(id)` | `DELETE /api/transport/:id` | `transport.js` |
| `getPayments()` | `GET /api/payments` | `payments.js` |
| `addPayment()` | `POST /api/payments` | `payments.js` |
| `getDues()` | `GET /api/dues` | `dues.js` |
| `addDue()` | `POST /api/dues` | `dues.js` |
| `updateDue(id)` | `PUT /api/dues/:id` | `dues.js` |
| `getEnquiries()` | `GET /api/enquiries` | `enquiries.js` |
| `addEnquiry()` | `POST /api/enquiries` | `enquiries.js` |
| `updateEnquiry(id)` | `PUT /api/enquiries/:id` | `enquiries.js` |
| `getFollowUps()` | `GET /api/followups` | `followups.js` |
| `addFollowUp()` | `POST /api/followups` | `followups.js` |
| `updateFollowUp(id)` | `PUT /api/followups/:id` | `followups.js` |
| `getExits()` | `GET /api/exits` | `exits.js` |
| `addExit()` | `POST /api/exits` | `exits.js` |
| `getFinanceSummary()` | `GET /api/finance/summary` | `finance.js` |
| `getReportsData()` | `GET /api/finance/reports` | `finance.js` |
| `getExpenses()` | `GET /api/finance/expenses` | `finance.js` |
| `addExpense()` | `POST /api/finance/expenses` | `finance.js` |
| `deleteExpense(id)` | `DELETE /api/finance/expenses/:id` | `finance.js` |
| `getInsights()` | `GET /api/insights` | `insights.js` |
| `getMessages()` | `GET /api/messages` | `messages.js` |
| `sendMessage()` | `POST /api/messages` | `messages.js` |
| `autoGenerateReminders()` | `POST /api/messages/auto-generate` | `messages.js` |

## Database Strategy

> [!IMPORTANT]
> The existing tables (transport_assignments, transport_payments, transport_dues, etc.) are used by old route files. New route files will use **new tables** that match the proper schema. Old routes remain untouched.

### New Tables to Create (via Railway Console SQL)

1. **`fc_enquiries`** — replaces `enquiries` for new logic
2. **`fc_followups`** — replaces `followups` for new logic  
3. **`fc_students`** — proper student schema with all fields
4. **`fc_transport`** — replaces `transport_assignments`
5. **`fc_payments`** — replaces `transport_payments`
6. **`fc_dues`** — replaces `transport_dues`
7. **`fc_expenses`** — replaces `expenses`
8. **`fc_exits`** — replaces `transport_exits`
9. **`fc_messages`** — replaces `messages`

> [!NOTE]
> Using `fc_` prefix to avoid conflicts with existing tables while keeping old routes working.
> The route files will simply query the new tables. The frontend API calls remain identical.

## Proposed Changes

---

### Migration SQL

#### [NEW] `backend/migrations/new_schema.sql`
- Creates all 9 new `fc_*` tables with exact columns from spec
- Safe to run — uses `CREATE TABLE IF NOT EXISTS`
- Includes indexes for performance

---

### Route Files (Complete Rewrites)

#### [MODIFY] `backend/routes/enquiries.js`
- `GET /api/enquiries` — fetch from `fc_enquiries` with status filter
- `POST /api/enquiries` — validate → check duplicate → save to `fc_enquiries`
- `PUT /api/enquiries/:id` — update status, trigger auto-create in `fc_students` + `fc_transport` + `fc_payments` + `fc_dues` when status → `resolved`

#### [MODIFY] `backend/routes/followups.js`
- `GET /api/followups` — fetch from `fc_followups` with status/priority filter
- `POST /api/followups` — validate → save to `fc_followups`
- `PUT /api/followups/:id` — update status

#### [MODIFY] `backend/routes/students.js`
- `GET /api/students` — fetch from `fc_students`
- `POST /api/students` — validate → save → auto-create transport + payment + dues records

#### [MODIFY] `backend/routes/transport.js`
- `GET /api/transport` — fetch from `fc_transport` with search/filter
- `POST /api/transport` — validate → save to `fc_transport`
- `PUT /api/transport/:id` — update, cascade fee change to pending payments
- `DELETE /api/transport/:id` — soft delete (status = inactive)

#### [MODIFY] `backend/routes/payments.js`
- `GET /api/payments` — fetch from `fc_payments` with filters
- `POST /api/payments` — validate → save → update dues status → generate receipt number

#### [MODIFY] `backend/routes/dues.js`
- `GET /api/dues` — fetch from `fc_dues`, calculate `days_overdue`, auto-detect overdue
- `POST /api/dues` — manual due creation
- `PUT /api/dues/:id` — update status
- `POST /api/dues/:id/remind` (via messages route) — create reminder message

#### [MODIFY] `backend/routes/finance.js`
- `GET /api/finance/summary` — income, expenses, net balance for selected month
- `GET /api/finance/reports` — monthly collection, route-wise, pending dues, expense summary
- `GET /api/finance/expenses` — fetch from `fc_expenses`
- `POST /api/finance/expenses` — validate → save
- `DELETE /api/finance/expenses/:id` — delete

#### [MODIFY] `backend/routes/exits.js`
- `GET /api/exits` — fetch from `fc_exits`
- `POST /api/exits` — validate → save → update student/transport status → cancel pending payments/dues → handle refund

#### [MODIFY] `backend/routes/messages.js`
- `GET /api/messages` — fetch from `fc_messages`
- `POST /api/messages` — save message, if "All Pending" loop through dues
- `POST /api/messages/auto-generate` — generate reminders for all pending dues

#### [MODIFY] `backend/routes/insights.js`
- `GET /api/insights` — run 5 rules: overdue alert, high collection, pending enquiries, route with most dues, monthly expense summary

#### [MODIFY] `backend/routes/dashboard.js`
- `GET /api/dashboard/stats` — all stats from new `fc_*` tables

---

### Auto-Trigger Logic (when enquiry → Resolved)

```
PUT /api/enquiries/:id { status: "resolved" }
  → INSERT INTO fc_students (copy enquiry fields)
  → INSERT INTO fc_transport (student_id, route, fee...)
  → INSERT INTO fc_payments (student_id, month, status=Pending)
  → INSERT INTO fc_dues (student_id, due_month, due_date=10th)
```

---

### Receipt Number Generation
Format: `RCP-YYYYMM-XXXX`
- Auto-generated on payment save
- Stored in `fc_payments.receipt_number`

---

### server.js Update

#### [MODIFY] `backend/server.js`
- Keep all existing route registrations
- New routes replace old ones (same paths, new logic)

---

## Verification Plan

### After Implementation

1. Run migration SQL in Railway Console
2. Test each endpoint via the UI
3. Verify enquiry → followup → resolve → student auto-create flow
4. Verify payment → dues update flow
5. Verify dashboard stats reflect new tables

> [!WARNING]
> The existing `transport_assignments`, `transport_payments`, `transport_dues`, `enquiries`, `followups`, `messages`, `expenses`, `transport_exits` tables will remain untouched. Only new `fc_*` tables are used by the new route files.
