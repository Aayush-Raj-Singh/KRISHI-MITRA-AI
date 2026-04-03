# Implementation Backlog (Sprint-ready)

## 1) Role-based UX & Access Hardening

- API
  - `GET /api/v1/auth/me` → { id, name, role, assigned_regions }
  - `GET /api/v1/auth/roles` → { roles: ["farmer","extension_officer","admin"] }
- Frontend
  - Route guards by role; role-aware navigation; 403 page.
- Mongo
  - `users`: { \_id, name, phone, role, assigned_regions: [string], location, soil_type, farm_size, water_source, primary_crops: [string], created_at, updated_at }

## 2) Mandi Data Entry & Approval Workflow

- API
  - `POST /api/v1/mandi/entries` (officer) → draft { commodity, variety, grade, market, arrival_date, min_price, max_price, modal_price, arrivals_qtl, notes }
  - `PATCH /api/v1/mandi/entries/{id}` (officer)
  - `POST /api/v1/mandi/entries/{id}/submit` (officer)
  - `POST /api/v1/mandi/entries/{id}/approve` (admin)
  - `POST /api/v1/mandi/entries/{id}/reject` (admin) { reason }
  - `GET /api/v1/mandi/entries` filters: status, market, date, commodity (role scoped)
- Mongo
  - `mandi_entries`: { \_id, status: "draft"|"submitted"|"approved"|"rejected", commodity, variety, grade, market, arrival_date: date, min_price, max_price, modal_price, arrivals_qtl, created_by, reviewed_by, review_reason, history:[{ts, actor, action, payload}], created_at, updated_at }

## 3) Market Profile Directory

- API
  - `GET /api/v1/market-profiles` (filters state, district, market, commodity)
  - `GET /api/v1/market-profiles/{id}`
  - `POST/PATCH /api/v1/market-profiles` (admin)
- Mongo
  - `market_profiles`: { \_id, name, code, state, district, address, geo:{lat,lng}, facilities:[string], timings, contact_person, phone, email, commodities:[string], last_mile, transport:[string], created_at, updated_at }

## 4) Helpdesk + Ticketing + FAQ

- API
  - Tickets: `POST /api/v1/tickets` (farmer), `GET /api/v1/tickets` (role scoped), `POST /api/v1/tickets/{id}/reply`, `POST /api/v1/tickets/{id}/status` { status: open|pending|resolved|closed, assignee }
  - FAQ: `GET /api/v1/faq` (public), `POST/PATCH /api/v1/faq` (admin)
- Mongo
  - `tickets`: { \_id, subject, body, category, status, created_by, assignee, messages:[{sender, body, ts}], attachments:[{url,name}], created_at, updated_at }
  - `faqs`: { \_id, question, answer, tags:[string], language, published: bool, order, created_at, updated_at }

## 5) Admin Master Data Console

- API (admin only)
  - CRUD: `/api/v1/master/commodities`, `/varieties`, `/grades`, `/units`, `/seasons`, `/msp`
- Mongo
  - `commodities`: { \_id, name, code, categories:[string], active }
  - `varieties`: { \_id, commodity_id, name, code, active }
  - `grades`: { \_id, commodity_id, name, code, active }
  - `units`: { \_id, name, symbol, type }
  - `seasons`: { \_id, name, start_month, end_month, active }
  - `msp_rates`: { \_id, commodity_id, variety_id?, season, price_per_quintal, source, effective_from }

## 6) Analytics & Reports

- Extend `GET /api/v1/analytics/export` with `scope=mandi|tickets|users` and filters.
- Mongo: `report_jobs`: { \_id, type, params, status, storage_url, requested_by, created_at, updated_at }

## 7) Audit & Data Quality

- API: `GET /api/v1/audit` (admin) filters actor, entity, action, date.
- Mongo: `audit_logs`: { \_id, actor_id, actor_role, entity, entity_id, action, payload, ts, ip }

## 8) Public Market Data API

- API: `GET /public/mandi-prices` (no auth) filters commodity, market, date range; rate limited; only approved entries.

## 9) Trust & Accessibility

- Frontend: external-link warning modal; high-contrast toggle; persist font scale (exists); aria labels on core actions.

## Frontend Work Items

- Role-aware routing/navigation, 403 page.
- New pages: Data Entry (officer), Review Queue (admin), Ticket list/detail, FAQ list/public, Market Profile list/detail.
- External link modal wired to existing portal links.

## Backend Work Items

- New routers: mandi entries, market profiles, tickets/faq, master data, public mandi.
- Add Pydantic schemas + Mongo models (Motor) for collections above.
- Extend analytics export scopes; add audit logging helper.
