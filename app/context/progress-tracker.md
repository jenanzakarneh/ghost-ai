# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Share dialog implemented (feature 09); automated validation complete with the existing default-build environment limitation.

## Current Goal

- Verify sharing against live Clerk and PostgreSQL.

## Completed

- Initialized shadcn/ui for the Next.js project.
- Added Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea primitives under `components/ui/`.
- Added `lucide-react` and the generated shared `lib/utils.ts` `cn()` export.
- Replaced the generated light theme variables with the Ghost AI dark theme tokens in `globals.css`.
- Enabled the root `dark` class in `app/layout.tsx` so shadcn dark variants apply.
- Created `components/editor/editor-navbar.tsx` with a fixed top nav, left sidebar toggle, and empty center/right sections.
- Created `components/editor/project-sidebar.tsx` with a floating slide-over sidebar, project tabs, empty placeholders, and a bottom `New Project` action.
- Confirmed the existing shadcn dialog primitives match the dark theme token pattern and are ready for future dialog usage.
- Verified lint, TypeScript, and the relevant build checks for the new components.
- Installed `@clerk/ui` for the shared Clerk dark theme.
- Wrapped the root layout with `ClerkProvider` and mapped Clerk appearance variables to the existing CSS tokens.
- Added protected-first `proxy.ts` with public root, sign-in, and sign-up routes.
- Added responsive sign-in and sign-up pages with compact product context on large screens and form-only layouts on small screens.
- Updated `/` to redirect authenticated users to `/editor` and unauthenticated users to the configured sign-in path.
- Added Clerk's built-in `UserButton` to the editor navbar and created the protected `/editor` destination.
- Added the `/editor` project home with the specified empty-state copy and `New Project` action.
- Added mock owned and shared projects to the sidebar with owner-only rename and delete actions.
- Added a centralized project dialogs hook with create, rename, delete, and loading state.
- Added create, rename, and delete dialogs with live slug preview, rename autofocus, Enter submit, and destructive confirmation.
- Added Prisma `Project` and `ProjectCollaborator` models with owner, lifecycle, and collaboration indexes.
- Added a cached `lib/prisma.ts` singleton that branches on `DATABASE_URL` for direct Postgres versus Prisma Accelerate.
- Validated the Prisma schema and client generation against the installed Prisma v7 dependency set.
- Initialized the first migration for the project model layer and confirmed the app builds with the schema in place.
- Added GET/POST `/api/projects` and PATCH/DELETE `/api/projects/[projectId]`.
- Scoped listing to the authenticated owner's projects; creation uses the Clerk user ID and Prisma's existing cuid default, with `Untitled Project` when the name is missing.
- Enforced JSON `401` responses in the proxy and handlers, and `403` for non-owner rename/delete requests.
- Added name/body validation (`400`) and missing-project responses (`404`). List returns `{ projects }`, create/rename return `{ project }` (201/200), and delete returns 204.
- Added seven passing API/proxy regression tests with mocked Clerk and Prisma dependencies, covering authorization, owner isolation, defaults, validation, and successful mutations.
- Verified lint (one existing skill-template warning) and production compilation/TypeScript with `npm run build -- --webpack`.

- Converted `/editor` to a server component and added `lib/projects.ts` to fetch owned and verified-email shared projects without initial client fetching.
- Added `hooks/use-project-actions.ts` with real create/rename/delete requests, duplicate-submit protection, pending state, and visible recoverable errors.
- Create previews a stable slug plus 12-character suffix, persists it as the project/room ID, and navigates to `/editor/[projectId]`. API validates room IDs and returns 409 on collision.
- Sidebar links open real projects. Rename pre-fills the current name and refreshes on success; delete displays the project name and refreshes or redirects to `/editor` for the active workspace.
- Added a membership-checked workspace shell; real-time canvas remains outside feature 07.
- All 12 regression tests pass, covering API/proxy authorization, room ID validation/collision, shared-list filtering, mutation navigation, and failure/pending behavior. Lint passes with one pre-existing skill-template warning.

## In Progress

- None.

## Next Up

- Verify owner invite/remove, collaborator read-only access, Clerk profiles, and clipboard feedback in a signed-in browser.
- Investigate the sidebar navigation issue recorded in `current-issues.md`.

## Open Questions

- The existing environment did not define sign-in/sign-up URL variables, so the standard Clerk variables are read with `/sign-in` and `/sign-up` fallbacks.
- The repo was using a Prisma v8 preview CLI while the installed client/adapter stack is v7, so the schema config and migration flow were aligned to the production dependency version.

## Architecture Decisions

- Prisma stores relational project metadata and collaborator records in PostgreSQL, while canvas and spec artifacts remain outside the database as future blob-backed files.
- The project database layer uses a single cached Prisma client instance for hot reload safety in development and a direct Postgres adapter when `DATABASE_URL` is not Prisma Accelerate-based.
- Project listing in feature 06 is owner-scoped; rename/delete are owner-only. Arbitrary `id` and ownership fields are ignored. Feature 07 allows a validated `roomId` at creation and stores it as the project ID; rename never changes that ID.

## Feature 07 Validation

- `node --test tests/project-api.test.mjs`: 12 passing tests with mocked dependencies.
- `npm run lint`: no errors; one existing warning in a Clerk skill template.
- `npm run build -- --webpack`: passed production compilation, TypeScript, and page generation.
- `npm run build`: blocked by the existing Turbopack CSS process/port-binding environment error, including an approved escalation retry. Build script remains unchanged.
- Live browser verification with Clerk and PostgreSQL was not performed; mocked tests do not establish that external-service flow.

## Session Notes

- Read the feature spec and required context files before implementation. shadcn generated foundation components should remain unmodified.
- `next build` with default Turbopack hit an environment port-binding panic while processing CSS; `next build --webpack` completed successfully.
- Auth routes use Clerk's path-based catch-all pages so the built-in flows retain their nested callback routes.
- Feature 04 originally implemented mock-only project management; feature 07 replaces the mocks with API mutations.
- Prisma CLI and client versions were aligned to match the installed dependency stack; the v8 config API is incompatible with this repo’s actual package versions.
- Feature 07 replaces the mock-backed UI. Run regression checks with `node --test tests/project-api.test.mjs`; these do not exercise a live Clerk session or database.
- Feature 06: plain `npm run build` first failed fetching Google Fonts; the approved network retry encountered the existing Turbopack port-binding panic. The webpack production build passed without changing the build script.

## Feature 08 Implementation

- Added server identity and project access helpers, preserving verified-email collaborator access and exposing the primary email.
- Renamed the workspace route segment to `[roomId]`; anonymous users redirect to sign-in, and missing/unauthorized projects render the shared AccessDenied view.
- Added the project name, disabled share placeholder, AI sidebar toggle and placeholder, full-viewport canvas placeholder, and current-room sidebar highlighting (including the shared tab).
- No canvas, Liveblocks, AI chat, or sharing behavior added.

## Feature 08 Validation

- `node --test tests/project-api.test.mjs`: all 15 tests pass, including identity filtering, scoped access queries, anonymous redirects, denial rendering, and authorized workspace context.
- `npm run lint`: no errors; one existing Clerk skill-template warning.
- `npm run build -- --webpack`: passed compilation, TypeScript, and page generation for `/editor/[roomId]`. Stale generated development route types were moved to a temporary backup after the route segment rename.
- Live browser verification with Clerk and PostgreSQL was not performed.

## Feature 09 Implementation

- Added collaborator list/invite/remove API with server-enforced membership and owner-only mutations, email validation, normalization, and duplicate handling.
- Added Clerk name/avatar enrichment with email-only fallback.
- Enabled navbar Share dialog: owner invites/removals and temporary Copied! feedback; collaborators receive a read-only list.
- Invitation grants database access; no email delivery or local user table added.

## Feature 09 Validation

- `node --test tests/project-api.test.mjs`: 19 passing tests, covering sharing authorization, normalized invitations, invalid/duplicate emails, scoped removal, Clerk fallback, and client permission/mutation state.
- `npm run lint`: no errors; one existing Clerk skill-template warning.
- `npm run build -- --webpack`: passed production compilation, TypeScript, and page generation.
- `npm run build`: font network failure in sandbox; network-enabled retry hit the existing Turbopack CSS process/port-binding restriction. Build script remains unchanged.
- Live Clerk/PostgreSQL and browser clipboard verification was not performed.
