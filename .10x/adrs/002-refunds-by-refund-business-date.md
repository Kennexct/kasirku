# ADR-002: Attribute refunds to the business day they happen (cash basis)

**Status:** Accepted
**Date:** 2026-11-18
**Feature:** reports-export
**Author:** 10x-Team (Architect + Staff Engineer + DBA)

## Context
v0.4 History summary subtracted refunds from the period of the **original sale** (refunds looked up by order id). For micro-sellers the daily question is "does my drawer match the app?". A refund given today for yesterday's sale takes cash out **today**. The user chose this cash-basis rule (choice A). Refund records only stored `createdAt` (UTC), and the business day depends on store timezone and day cut-off, so date queries on refunds were not possible.

## Decision
- Add `businessDate` to every refund/void record, computed at write time with `getBusinessDate(now, store)` (same function used for orders).
- Local DB: Dexie schema v3 adds index `[storeId+businessDate]` on `refunds`; upgrade backfills existing rows from `createdAt` (UTC date; only pre-release dev data exists).
- Server: migration adds `refunds.business_date date not null` with backfill `(created_at at time zone stores.timezone − day_cutoff)::date`, index `(store_id, business_date)`, and redefines `daily_sales` with refunds by refund date.
- `lib/reports.ts` is the only place metric definitions live; History summary uses it with the same rule.
- Refunds are attributed to the **original order's payment method and sales mode**, on the refund date.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
| --- | --- | --- | --- |
| Sale-date attribution (status quo) | A day's figures never change after the fact | Today's report ≠ cash in drawer when refunding older sales | User chose cash basis |
| Compute refund day on read from `createdAt` + store tz | No schema change | Can't index/query by day; tz/cut-off logic duplicated in SQL and JS; changes if store tz changes later | Fragile, slow for ranges |
| Show both (accrual + cash) | Accountant-friendly | Two numbers confuse the target user | YAGNI for MVP |

## Consequences
### Positive
- Daily report reconciles with the drawer; one definition across History, Reports, exports and SQL view.
- Refund-by-date queries are indexed.
### Negative
- A past day's net figure never changes after a later refund — the refund lands on today instead. Readers comparing "sales of Monday" with "refunds of Monday's orders" must look at the order status ("Refund sebagian"/"Direfund"), not the Monday total.
- Gross and refunds for a period may relate to different sets of orders (documented in export headers).
### Risks
- Changing store timezone/cut-off later does not re-date existing refunds (intended: the day is fixed at the moment of the refund).

## Dependencies
- Depends on `getBusinessDate` and store settings.
- Constrains future multi-device sync: refunds must carry `businessDate` from the device that made them.
