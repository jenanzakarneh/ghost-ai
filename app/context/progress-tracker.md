# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Canvas ergonomics (feature 17) implemented; targeted lint, 26 regression tests, and webpack production build (including TypeScript) pass. Default Turbopack build remains blocked by the environment port-binding restriction.

## Current Goal

- Verify feature 17 control placement, animated zoom, history availability, keyboard shortcuts, and editable-field isolation in signed-in browser sessions.

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

## Feature 17 Implementation

- Added a bottom-left pill control bar above the shape panel, with zoom out, fit view, zoom in, a thin divider, undo, and redo.
- Zoom buttons and keyboard zoom use the existing React Flow instance with a 200ms animation; fit view uses the same duration.
- Undo/redo use Liveblocks history hooks, with availability hooks disabling and dimming unavailable buttons.
- Added `hooks/useKeyboardShortcuts.ts` with a window keydown listener and cleanup: `+`/`=` zoom in, `-` zoom out, Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y redo.
- Shortcuts skip inputs, textareas, selects, contenteditable fields, textbox roles, composition, and already-handled events.
- Shape panel, node/edge rendering, and collaborative state setup remain unchanged.

## Feature 17 Validation

- Targeted ESLint passes for the control bar, shortcut hook, and canvas integration.
- All 26 existing regression tests pass; these do not exercise the new browser gestures.
- `npm run build -- --webpack` passes production compilation, TypeScript, and page generation.
- `npm run build` fails with the previously documented Turbopack CSS worker port-binding restriction (`Operation not permitted`), including an elevated retry. Build script remains unchanged.
- Signed-in browser checks for control positioning, animated zoom, undo/redo, editable-field isolation, and live collaboration remain pending.

## Next Up

- Verify dragging all six shapes at different canvas zoom/pan positions and visibility in a second signed-in session.
- Replace the public `pk_` value currently assigned to `LIVEBLOCKS_SECRET_KEY` with the project's actual `sk_` secret key locally, then restart the dev server and verify canvas authentication.
- Verify feature 11 loading/error states, minimap/background, and room isolation in a signed-in browser with live services.
- Configure server-only `LIVEBLOCKS_SECRET_KEY` and verify feature 10 with owner, collaborator, and denied-user sessions against live services.
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

## Feature 10 Implementation

- Defined nullable cursor coordinates, `isThinking`, and user ID/name/avatar/color metadata in the root Liveblocks configuration.
- Added a lazy, globally cached Liveblocks Node client and deterministic cursor colors from the documented canvas palette.
- Added the missing `@liveblocks/node` dependency at version 3.24.1 to match the installed Liveblocks packages.
- Added `POST /api/liveblocks-auth` with Clerk identity, validated room input, existing project membership checks, private get-or-create rooms, and exact-room full-access sessions with server-derived metadata.
- Anonymous API requests return JSON 401; invalid room input returns 400; inaccessible or missing projects return 403. Provisioning failures return a generic 503 without issuing a token.
- Token responses use `Cache-Control: no-store`. Runtime configuration requires `LIVEBLOCKS_SECRET_KEY`; it is not required to instantiate the client during builds.
- Canvas providers, presence rendering, and graph storage remain future feature work.

## Feature 10 Validation

- `node --test tests/project-api.test.mjs`: 24 passing tests, including auth/proxy rejection, owner/collaborator room scope, trusted metadata, upstream failures, stable colors, and lazy client caching across module reloads.
- `npx tsc --noEmit` and targeted ESLint on the implementation files pass.
- `npm run build -- --webpack`: passed compilation, TypeScript, and page generation, including `/api/liveblocks-auth`.
- `npm run build`: the existing Turbopack CSS process/port-binding restriction persists, including an elevated retry. Build script remains unchanged.
- `npm run lint`: six pre-existing hook-rule errors in the feature 09 sharing test harness at lines 408–415, plus the existing Clerk skill-template warning. New implementation files pass lint.
- Live Clerk/PostgreSQL/Liveblocks token issuance was not exercised; tests mock external services.

## Feature 11 Implementation

- Replaced the active workspace placeholder with a full-size client canvas while preserving the server workspace page and membership checks.
- Added `CanvasRoom` with `/api/liveblocks-auth`, the current project room ID, initial `cursor: null` and `isThinking: false`, and a simple `ClientSideSuspense` loading state.
- Added an error boundary and connection listeners outside Suspense so authentication/room errors and failed reconnections show an accessible fallback.
- Added `BaseCanvas` using suspense-enabled `useLiveblocksFlow`, empty initial nodes/edges, and all synchronized change/connect/delete handlers.
- Enabled loose connections, `fitView`, a MiniMap, and a dot background using the existing dark-theme tokens. Imported React Flow base styles.
- Added shared `CanvasNodeData`, `CanvasNode` (`canvasNode`), and `CanvasEdge` (`canvasEdge`) types plus the documented shape/color palettes.
- No controls, custom node/edge renderers, application persistence, or AI behavior added.

## Feature 11 Validation

- `npx tsc --noEmit`: passed.
- Targeted ESLint on all four changed/new implementation files: passed.
- `node --test tests/project-api.test.mjs`: all 24 existing regression tests pass; these cover access/auth infrastructure, not browser canvas synchronization.
- `npm run build -- --webpack`: passed production compilation, TypeScript, and page generation.
- `npm run build`: blocked by the existing Turbopack CSS process/port-binding restriction. The build script remains unchanged.
- Live browser collaboration and connection-fallback behavior were not exercised against external services.

## Liveblocks configuration issue

- Reproduced the reported auth failure locally: the configured Liveblocks value is a public key, rejected by the Node SDK before network access.
- Added explicit missing/public-key validation and a safe server-only diagnostic. Actual secret-key replacement remains pending user configuration.
- Updated `.env.local` database SSL mode to `verify-full`; confirmed connection-string parsing retains certificate verification without the reported alias warning. No credentials were printed.

## Feature 12 Implementation

- Added a floating bottom-center pill panel with draggable rectangle, diamond, circle, pill, cylinder, and hexagon icon buttons.
- Drag payloads include shape, width, and height. Defaults: rectangle 180×100, diamond 180×180, circle 120×120, pill 180×80, cylinder 140×160, hexagon 160×140.
- Canvas wrapper accepts recognized drag types and validates payloads. Drops convert screen coordinates with React Flow and add nodes through the Liveblocks-synced node-change handler.
- New nodes use `canvasNode`, an empty label, the default node color, the dragged shape and dimensions, and IDs composed of shape, timestamp, and an incrementing counter.
- Registered a basic custom renderer: all shapes appear as bordered rectangles with centered labels. No shape-specific rendering or new connection controls added.

## Feature 12 Validation

- `npm run build -- --webpack`: passed production compilation, TypeScript, and page generation.
- TypeScript and targeted ESLint pass for the four implementation files.
- All 26 regression tests pass, including shape payload validation, default dimensions, dropped-node data/coordinates, and same-timestamp ID uniqueness.
- `npm run build` encounters the existing Turbopack CSS process/port-binding restriction.
- Browser drag/drop and live multi-user synchronization were not exercised against external services.

## Feature 13 Implementation

- Replaced the placeholder renderer with CSS rectangle, circle, and pill shapes and scalable SVG diamond, hexagon, and cylinder shapes.
- Shared shape visuals preserve node colors, centered labels, subtle borders, and brighter selected borders. SVG strokes retain their width as nodes scale.
- Shape panel uses native cursor-following ghost images at the existing default drop dimensions, automatically dismissed on drop or cancellation.
- Existing node creation, drag payloads, panel layout, and collaborative state handlers remain intact.

## Feature 13 Validation

- `npx tsc --noEmit` and targeted ESLint on all three implementation files: passed.
- `node --test tests/project-api.test.mjs`: all 26 regression tests pass, including existing drop payload and node creation checks.
- `npm run build -- --webpack`: passed compilation, TypeScript, and page generation.
- `npm run build`: blocked by the existing Turbopack CSS process/port-binding restriction; build script unchanged.
- Browser visual checks, native drag preview behavior across browsers, and live collaboration verification remain pending.

## Feature 13 Specification Review

- Re-read the unchanged feature 13 specification and reviewed the existing implementation against each requirement; no additional implementation changes were needed.
- CSS/SVG variants, size-scaled SVGs, selected borders, and shared native drag previews are implemented within the specified scope.
- Retried `npm run build` with escalation: the same Turbopack CSS worker port-binding restriction persists (`Operation not permitted`). The successful webpack build and TypeScript validation above remain applicable.
- Visual browser acceptance checks remain pending; feature 14 is outside this request.

## Feature 14 Implementation

- Added selected-only, dark-theme resize handles with minimum dimensions of 80×60.
- Added centered empty-label placeholder (“Label”) and double-click textarea editing over the same label area, with matching typography and a hidden text mirror to preserve layout.
- Labels update on each change through React Flow `updateNodeData`; resizing uses `NodeResizer`. Both reach the existing Liveblocks-backed `onNodesChange` flow.
- Blur and Escape close editing while retaining the live edits. Textarea interactions use `nodrag`, `nopan`, `nowheel`, and propagation guards.
- Shape visuals, shape panel, drag previews, and drop creation remain unchanged.

## Feature 14 Validation

- `npx tsc --noEmit` and targeted ESLint on both implementation files: passed.
- `node --test tests/project-api.test.mjs`: all 26 existing regression tests pass; these do not exercise the new browser editing gestures.
- `npm run build -- --webpack`: passed compilation, TypeScript, and page generation.
- Default `npm run build` remains subject to the previously reproduced Turbopack CSS worker port-binding restriction, including the earlier escalated retry; the build script is unchanged.
- Live browser resizing, double-click editing, focus/blur/Escape behavior, gesture isolation, and multi-session synchronization remain pending.

## Feature 15 Implementation

- Added a selected-only floating toolbar 12px above each node with all eight existing `NODE_COLORS` pairs.
- Active swatches show a checkmark and ring; hover uses a tight 4px glow in the paired text color. Buttons have accessible names, pressed states, and keyboard focus indicators.
- Swatch selection updates the shared node color through `updateNodeData`; the existing shape renderer automatically derives the paired text color. No server calls or duplicate text-color state added.
- Toolbar gesture classes and event guards prevent node drag, canvas pan, and node double-click editing from toolbar interactions.
- Drag/drop and selection logic remain unchanged.

## Feature 15 Validation

- `npx tsc --noEmit` and targeted ESLint on both implementation files: passed.
- All 26 existing regression tests pass; these do not cover browser swatch interactions.
- `npm run build -- --webpack`: passed compilation, TypeScript, and page generation.
- Default `npm run build` has the previously reproduced Turbopack CSS worker port-binding restriction; build script unchanged.
- Browser checks for toolbar placement, swatch glow, immediate color changes, gesture isolation, and live collaboration remain pending.

## Feature 16 Implementation

- Added four small light handles per node, fading in on hover, with loose connections between sides.
- Registered custom and default-fallback edge renderers and arrowed light-stroke defaults.
- Added right-angle paths, dim resting/bright active styling, and a 24px invisible interaction path.
- Edge labels use `EdgeLabelRenderer` and midpoint coordinates returned by `getSmoothStepPath`. Growing input drafts save to shared `data.label` through `updateEdgeData` on blur, Enter, or Escape.
- Saved labels use pill badges; active empty edges show a faint editing hint. Label event guards prevent canvas gestures.

## Feature 16 Validation

- TypeScript and targeted ESLint pass for all four implementation files.
- All 26 existing regression tests pass; these do not exercise new edge gestures.
- `npm run build -- --webpack`: passed compilation, TypeScript, and page generation after the final connection-default change.
- Default `npm run build` has the previously reproduced Turbopack CSS worker port-binding restriction; build script unchanged.
- Inspected the installed Liveblocks connection handler and explicitly merge edge defaults into new connections so custom type and arrow styling are shared.
- Live browser checks for handle connections, hover/selection, label saving, gesture isolation, and multi-session synchronization remain pending.
