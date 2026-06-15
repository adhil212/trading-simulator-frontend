<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-context -->
## Goal
- Make the admin dashboard fully functional, responsive, and optimized for testing.

## Constraints & Preferences
- Changes must not affect existing code flow or style
- Desktop appearance must remain identical (use responsive breakpoints)
- Dark theme styling throughout
- Admin user deletion must be protected (cannot delete admin users)

## Progress
### Done
- Fixed date format in 30-day user signups and trade volume charts: changed `DATE()` to `TO_CHAR(..., 'YYYY-MM-DD')` in both queries
- Replaced lifetime "Total Volume" stat with "Today's Volume": new SQL query filtering `WHERE DATE(executed_at) = CURRENT_DATE`; removed old `SUM(total_value)` lifetime query
- Removed "Uptime" label from Engine Status panel (frontend + backend `process.uptime()` field)
- Added skeleton loaders with `animate-pulse` to admin dashboard, admin users list, and user detail page
- Made admin dashboard, users list, and user detail page mobile responsive: `p-4 sm:p-6`, flex-wrap headers, responsive grid breakpoints, hidden columns on small screens for users table
- Removed Recharge/Deduct wallet action buttons and modals from user detail page
- Added Delete User feature: `DELETE /api/admin/users/:id` with `is_admin` protection, confirmation modal, redirect to `/admin/users` on success
- Cleaned up unused backend code: removed `rechargeUser` and `deductUser` from service, controller, and routes
- Performance optimizations across all 9 admin pages:
  - `useCallback` on all fetch functions and event handlers (`fetchStats`, `fetchUsers`, `fetchTrades`, `fetchTransactions`, `fetchCommissions`, `fetchRequests`, `fetchUserDetail`, `fetchMarketData`, `fetchAssets`, `exportCsv`, `handleApprove`, `handleReject`, `handleDelete`, `handleSubmit`, `openAdd`, `openEdit`)
  - `useEffect` cleanup: all effects now depend only on stable `useCallback` references, removing all `eslint-disable` comments
  - Debounce on text-based search/filter inputs (300ms): users search, trades symbol/user_id, transactions user_id
  - `useMemo` on computed values: `totalPages`, `currentPage`, dashboard `statCards`

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Removed Recharge/Deduct instead of implementing admin-to-user wallet transfer (simpler, no fake-money appearance)
- Added skeleton loaders matching exact layout (stat cards, charts, tables, engine status) rather than full-screen spinner
- Hidden User ID, Email, and Joined columns on mobile to eliminate horizontal scroll instead of card-based layout
- `TO_CHAR` used for date formatting at SQL level (cleanest, no frontend changes needed)
- Delete uses DB cascading (all `ON DELETE CASCADE` constraints already in place)
- Admin pages that have both text and non-text filters (trades, transactions) use separate input state + debounce effect that merges into the `filters` object only after the delay; selects and date inputs update immediately

## Next Steps
- (none at this time)

## Critical Context
- JWT token payload must contain `is_admin: true` for access; admin flag set manually in DB, no endpoint
- Admin stats endpoint returns: `users.total`, `trades.total`, `trades.todayVolume`, `totalCommissions`, `charts.usersOverTime`, `charts.volumeOverTime`, `topTraders`, `engineStatus`
- Today's Volume shows `₹0` when no trades happen today (uses `COALESCE(..., 0)`)
- Delete cascades to wallets, portfolio, trades, performance_metrics, transactions, trade_history
- No test framework exists; no rate limiting on admin endpoints
- pg library converts PostgreSQL `DATE` to JavaScript Date objects; `TO_CHAR` returns clean string

## Relevant Files
- `frontend/trading-simulator-frontend/my-app/app/admin/page.tsx`: Admin dashboard with stat cards, 30-day charts, top traders table, engine status, skeleton loader
- `frontend/trading-simulator-frontend/my-app/app/admin/users/page.tsx`: Users list with debounced search, pagination, 7-column table (3 hidden on mobile), skeleton rows
- `frontend/trading-simulator-frontend/my-app/app/admin/users/[id]/page.tsx`: User detail with profile, wallet balance, portfolio, trades, transactions, delete modal
- `frontend/trading-simulator-frontend/my-app/app/admin/trades/page.tsx`: Trades list with debounced filters (symbol, type, user_id, date range), pagination, CSV export
- `frontend/trading-simulator-frontend/my-app/app/admin/transactions/page.tsx`: Transactions list with debounced filters (type, status, user_id, date range), CSV export
- `frontend/trading-simulator-frontend/my-app/app/admin/commissions/page.tsx`: Commission history with pagination
- `frontend/trading-simulator-frontend/my-app/app/admin/withdrawals/page.tsx`: Withdrawal requests with Approve/Reject actions
- `frontend/trading-simulator-frontend/my-app/app/admin/market/page.tsx`: Engine status + live asset prices
- `frontend/trading-simulator-frontend/my-app/app/admin/assets/page.tsx`: Asset CRUD with modal form (create/edit/delete)
- `backend/trading-simulator/services/admin.service.js`: All admin DB queries including `getPlatformStats`, `getUsers`, `deleteUser`
- `backend/trading-simulator/controllers/admin.controller.js`: Admin route handlers
- `backend/trading-simulator/routers/admin.routes.js`: 18 admin routes, now includes `DELETE /users/:id`
- `backend/trading-simulator/market/priceEngin.js`: PriceEngine `getStatus()` no longer returns `uptime`
<!-- END:project-context -->
