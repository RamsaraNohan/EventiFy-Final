# EventiFy Development Team: File Ownership & Responsibilities

This document provides a comprehensive mapping of files and responsibilities for each member of the EventiFy development team, adjusted for the monorepo structure.

---

## MEMBER 1 — Backend: Auth, Messaging & Security
**Responsibilities:** Core system access, real-time communication, and data protection.

### Backend (apps/api)
| File Path | Responsibility |
| :--- | :--- |
| `src/modules/auth/auth.controller.ts` | Register, login, logout, me, refresh, forgot/reset passwords |
| `src/modules/auth/auth.routes.ts` | All auth routes |
| `src/modules/payments/payments.controller.ts` | PayHere PaymentIntent, confirm, webhook verification |
| `src/modules/payments/payments.routes.ts` | Payment routes |
| `src/services/payout.service.ts` | PayHere Transfer API — real bank transfers to vendors |
| `src/modules/messages/messages.controller.ts` | Send message, mark seen, history |
| `src/modules/messages/messages.routes.ts` | Message routes |
| `src/modules/conversations/conversations.controller.ts` | Create/list conversations |
| `src/socket.ts` | Entire Socket.IO server — all 8 real-time event types |
| `src/utils/encrypt.ts` | AES-256-CBC encrypt/decrypt for bank account numbers |
| `src/middleware/requireAuth.ts` | JWT verification, role-based access guard |
| `src/middleware/errorHandler.ts` | Global Express error handler |
| `src/utils/validateEnv.ts` | Startup env validation — exits cleanly if keys missing |

### Frontend (apps/web)
| File Path | Responsibility |
| :--- | :--- |
| `src/contexts/AuthContext.tsx` | Global auth state, login/logout, useAuth() hook |
| `src/lib/socket.ts` | Socket.IO client — connects on login, JWT authenticated |
| `src/lib/api.ts` | Axios instance with baseURL, credentials, refresh interceptors |
| `src/pages/messages/index.tsx` | Chat UI — all 3 roles use this (scoped by role in API) |
| `src/hooks/useUnreadCounts.ts` | Polls + socket-driven unread badge counts |
| `src/components/GlobalSearch.tsx` | Ctrl+K command palette |
| `src/components/ui/UnreadBadge.tsx` | Red count badge on sidebar icons |
| `src/components/ui/ConversationPreview.tsx` | Conversation list items with online dot |

---

## MEMBER 2 — Backend: Events & Tasks
**Responsibilities:** Core business logic, event lifecycle state machine, and task management.

### Backend (apps/api)
| File Path | Responsibility |
| :--- | :--- |
| `src/modules/events/events.controller.ts` | CRUD events, status transitions, role-scoped queries |
| `src/modules/events/events.routes.ts` | Event routes |
| `src/modules/events/events.controller.ts` | Approve/reject/remove vendor from event |
| `src/modules/tasks/tasks.controller.ts` | Task CRUD, progress updates, mark complete, socket emit |
| `src/modules/tasks/tasks.routes.ts` | Task routes |
| `src/jobs/eventStatusJob.ts` | Daily cron at 00:05 AM — auto-transitions event statuses |
| `src/modules/payments/transactions.controller.ts` | CSV export (role-scoped), transaction history |

---

## MEMBER 3 — Backend: Vendors, Reviews & AI
**Responsibilities:** Vendor marketplace API, AI recommendations, and media uploads.

### Backend (apps/api)
| File Path | Responsibility |
| :--- | :--- |
| `src/modules/vendors/vendors.controller.ts` | Vendor list with AVG rating, getOne, profile update, metrics |
| `src/modules/vendors/vendors.routes.ts` | Vendor routes |
| `src/modules/calendar/calendar.controller.ts` | Block/unblock dates, fetch booked dates |
| `src/modules/calendar/calendar.routes.ts` | Calendar routes |
| `src/modules/reviews/reviews.controller.ts` | POST (unique constraint), GET paginated, DELETE |
| `src/modules/reviews/reviews.routes.ts` | Review routes |
| `src/modules/ai/ai.service.ts` | OpenAI vector search + graceful DB fallback |
| `src/modules/ai/ai.controller.ts` | AI recommendations controller |
| `src/modules/saved-vendors/savedVendors.controller.ts` | Wishlist save/unsave/list |
| `src/modules/upload/upload.controller.ts` | Cloudinary image upload (avatars, portfolio, tasks) |

---

## MEMBER 4 — Backend: Admin, Notifications & Emails
**Responsibilities:** Admin infrastructure, notification delivery, and email marketing.

### Backend (apps/api)
| File Path | Responsibility |
| :--- | :--- |
| `src/modules/admin/admin.controller.ts` | Metrics, users CRUD, events list, approvals, payout, activity feed |
| `src/modules/admin/admin.routes.ts` | Admin routes |
| `src/modules/notifications/notifications.controller.ts` | List, mark read, unread count |
| `src/modules/notifications/notifications.routes.ts` | Notification routes |
| `src/utils/email.ts` | SendGrid helper + message email rate limiting |
| `src/utils/email.ts` | 11 HTML email templates |
| `src/modules/payments/transactions.controller.ts` | VendorPayout records, payout history |
| `src/database/models/event-note.model.ts` | Admin notes on events |

---

## MEMBER 5 — Frontend: Client Role UI
**Responsibilities:** Client-facing interfaces for booking and event management.

### Frontend (apps/web)
| File Path | Responsibility |
| :--- | :--- |
| `src/components/layout/Sidebar.tsx` | Client sidebar + header |
| `src/pages/dashboard/index.tsx` | Personalized greeting, 4 KPI cards, DashboardCalendar |
| `src/pages/events/index.tsx` | Event cards with status colors, stepper, countdown badges |
| `src/pages/events/[id].tsx` | Event detail: 4 tabs, inline edit, PayHere modal, reviews |
| `src/pages/marketplace/index.tsx` | Vendor grid — hero images, ratings, Save button |
| `src/pages/vendors/[id].tsx` | Full vendor profile: portfolio, calendar, reviews |
| `src/pages/recommendations/index.tsx` | AI suggestions page with fallback banners |
| `src/pages/notifications/index.tsx` | Notification list (shared component across roles) |
| `src/components/ui/EventStepper.tsx` | 6-step horizontal progress stepper |
| `src/components/ui/BudgetBar.tsx` | Budget vs spent progress bars |
| `src/components/ui/PaymentTimeline.tsx` | 3-step payment visual timeline |
| `src/components/QuickBookModal.tsx` | Quick book without visiting full profile |

---

## MEMBER 6 — Frontend: Vendor Role UI
**Responsibilities:** Vendor dashboard and management tools.

### Frontend (apps/web)
| File Path | Responsibility |
| :--- | :--- |
| `src/components/layout/Sidebar.tsx` | Vendor sidebar + header |
| `src/pages/vendors/VendorDashboard.tsx` | KPI cards, earnings chart, pending bookings alerts |
| `src/pages/bookings/BookingRequests.tsx` | Pending invitations with Accept/Decline buttons |
| `src/pages/vendors/VendorServices.tsx` | Task board, progress slider, Mark Complete, file upload |
| `src/pages/vendors/VendorCalendar.tsx` | Month grid, block/unblock with note popover |
| `src/pages/vendors/VendorAnalytics.tsx` | Performance KPIs, task completion rate, archive |
| `src/components/vendors/ProfileSetupWizard.tsx` | First-visit multi-step profile setup wizard |

---

## MEMBER 7 — Frontend: Admin Role UI
**Responsibilities:** Admin command center and platform management.

### Frontend (apps/web)
| File Path | Responsibility |
| :--- | :--- |
| `src/components/layout/Sidebar.tsx` | Admin sidebar + header |
| `src/pages/admin/AdminDashboard.tsx` | KPI cards, GMV charts, Marketplace Distribution |
| `src/pages/admin/UserDatabase.tsx` | Searchable user table, role toggle, deactivate modal |
| `src/pages/admin/VendorApproval.tsx` | Full business card view — portfolio images, bank details |
| `src/pages/admin/AdminEventsPage.tsx` | Platform event table with KPI row, filters, admin notes |
| `src/pages/transactions/index.tsx` | Admin view: all transactions, Commission breakdown modals |
| `src/components/dashboard/ActivityFeed.tsx` | Live activity feed with type-based icons |

---

## MEMBER 8 — Frontend: Shared UI System & Auth Pages
**Responsibilities:** Design system, component library, and public pages.

### Frontend (apps/web)
| File Path | Responsibility |
| :--- | :--- |
| `src/index.css` | CSS variables, light/dark theme, scrollbar-hide |
| `tailwind.config.js` | Brand colors, gold, sidebar, surface tokens |
| `src/main.tsx` | App entry — ErrorBoundary, HelmetProvider, QueryClient |
| `src/AppRouter.tsx` | All routes with role guards |
| `src/pages/login/index.tsx` | Split-panel layout (purple brand left, white form right) |
| `src/pages/register/index.tsx` | Same layout, role selection |
| `src/pages/forgot-password/index.tsx` | Forgotten password flow |
| `src/pages/reset-password/index.tsx` | Token from URL params |
| `src/pages/landing/index.tsx` | Public marketing page at / |
| `src/pages/vendors/PublicVendorProfile.tsx` | Shareable vendor page at /v/:id |
| `src/pages/settings/ProfileSettings.tsx` | All-role settings (role-conditional sections) |
| `src/components/ui/Avatar.tsx` | Photo + initials fallback system |
| `src/components/ui/StatusBadge.tsx` | All event/booking/payment status badges |
| `src/components/ui/StarRating.tsx` | Half-star rating displays |
| `src/components/ui/Skeleton.tsx` | Shimmer loading states |
| `src/components/ui/EmptyState.tsx` | Per-page empty states with CTAs |
| `src/components/ui/KpiCard.tsx` | Metric card with sparkline + donut variants |
| `src/components/ui/DashboardCalendar.tsx` | Event dot calendar for dashboards |
| `src/components/ui/AvatarGroup.tsx` | Overlapping avatar stack |
| `src/components/ErrorBoundary.tsx` | App-wide crash boundary |
| `src/hooks/useTheme.ts` | Dark/light toggle with localStorage |
| `src/lib/toast.ts` | notify.success/error/info/loading wrappers |
| `src/utils/dateFormat.ts` | fmtLKR(), fmtEventDate(), fmtCountdown() |

---

## MEMBER 9 — Database, Security & DevOps
**Responsibilities:** Database schema, security, seeds, and infrastructure.

### Shared / API (apps/api)
| File Path | Responsibility |
| :--- | :--- |
| `src/database/index.ts` | Sequelize connection setup, sync({ alter: true }) |
| `src/database/models/user.model.ts` | Users — roles, avatar, password |
| `src/database/models/vendor.model.ts` | VendorProfile — all business fields |
| `src/database/models/event.model.ts` | Events & EventVendors |
| `src/database/models/task.model.ts` | Tasks — progress, status, files arrays |
| `src/database/models/payment.model.ts` | Payments — type, status, PayHere references |
| `src/database/models/transaction.model.ts` | Transactions — amounts, split fields |
| `src/database/models/vendor-payout.model.ts` | VendorPayouts — payout records |
| `src/database/models/conversation.model.ts` | Conversations — participants |
| `src/database/models/message.model.ts` | Messages — content, imageUrl, seen |
| `src/database/models/notification.model.ts` | Notifications — type enum, read status |
| `src/database/models/review.model.ts` | Reviews — unique index (eventId+vendorId+clientId) |
| `src/database/models/calendar-availability.model.ts` | CalendarAvailability — blockedDate, note field |
| `src/database/models/saved-vendor.model.ts` | SavedVendors — unique userId+vendorId |
| `src/database/models/password-reset.model.ts` | PasswordResetTokens — tokenHash, expiry |
| `src/scripts/seed.ts` | Full seed: vendors, clients, events, reviews |
| `src/scripts/seed-history.ts` | 6 months backfilled data for chart display |
| `src/app.ts` | Express app — helmet, CORS, route registration |
| `src/server.ts` | Server entry, port binding |
| `.env.example` | All 12+ env vars documented |
| `package.json` (root) | pnpm workspace config |
