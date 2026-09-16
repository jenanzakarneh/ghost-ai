# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 27 backend spec generation implemented; 58 regression tests, TypeScript, targeted lint, and webpack production build pass. Live Trigger.dev/Gemini execution remains unverified; default Turbopack build remains environment-blocked.

- Feature 26 frontend implemented against the exact specified contract; 49 JavaScript regression tests, targeted lint, TypeScript, and webpack production build pass. Live integration is blocked by the existing backend contract mismatch described below.

- Feature 25 collaborative sidebar chat implemented; TypeScript, targeted lint, payload validation, and webpack production build pass. Default Turbopack build remains environment-blocked; live multi-user acceptance is pending.

- Feature 24 shared AI presence implemented; TypeScript, targeted lint, payload validation, and webpack production build pass. Live multi-user acceptance remains pending.

- Feature 23 design agent implemented; automated validation passes, with live service verification and the default build limitation recorded below.

- Trigger.dev bootstrap configured with a starter task; TypeScript and targeted lint pass. CLI authentication/project access verified. Live worker registration awaits approval.
- Canvas autosave (feature 21) implemented; regression tests, targeted lint, and webpack production build pass. Default Turbopack build remains blocked by the environment port-binding restriction.

## Current Goal

- Verify feature 27 against a configured Trigger.dev worker and Gemini: authorized trigger, one-hour owner token, realtime metadata, and Markdown output.

- Validate feature 26 frontend and reconcile the design API contract in a separately scoped backend change before live multi-user acceptance.

- Verify feature 25 in a signed-in multi-user room: live delivery, reload/history, sender/timestamp display, and draft retention on failed sends.

- Verify feature 24 in a signed-in multi-user room: latest generic status, composer busy/idle transitions, and cursor spinners.

- Verify feature 23 with a registered Trigger.dev worker, Gemini, and multiple Liveblocks participants; feature 22 migration/runtime prerequisites still apply.

- Verify feature 21 saving, empty-room recovery, and active-room preservation with a private Vercel Blob store in a signed-in browser. Features 18–20 browser acceptance remains pending.

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

- Trigger.dev live verification pending: automatic approval review rejected starting the dev worker because it may upload source/task code to Trigger.dev. User approval is required to proceed. DEV secret key is missing from local environment files and must be configured for app-side triggering.

## Trigger.dev Setup

- Retained the existing project ref and installed SDK/build packages; pinned SDK, build, and npm CLI commands to 4.6.0 with matching lockfile metadata.
- Configured the documented root `trigger/` directory and exported a `hello-world` task that logs and returns a readiness message with a 30-second maximum duration.
- Added `trigger:login`, `trigger:dev`, and `trigger:deploy` scripts and README instructions for local development, the DEV key, dashboard testing, and deployment.
- Existing `.trigger` ignore rule and TypeScript config inclusion retained.
- Validation: `tsc --noEmit`, targeted ESLint, `git diff --check`, and dependency/lockfile consistency check pass. CLI `whoami` confirmed authentication and access to the `ghost-ai` project. No task run or deployment performed.

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

## Feature 18 Implementation

- Added three typed predefined diagrams: microservices, CI/CD pipeline, and event-driven system using shared shapes, dimensions, and colors.
- Added a navbar Templates button and scrollable dialog cards with names, descriptions, import buttons, and lightweight bounds-fitted previews using existing shape visuals.
- Import clears edges and nodes before adding fresh template copies through the existing Liveblocks change handlers, batched as one shared update. Unique IDs keep repeated imports independent.
- The local viewport fits the imported nodes after the shared graph renders. No custom templates, template saving, persistence, or renderer changes added.

## Feature 18 Validation

- `npx tsc --noEmit` and targeted ESLint on all six implementation files pass.
- Template-data checks pass for all three graphs: unique node IDs, valid dimensions, shared palette colors, and existing source/target endpoints.
- All 26 existing regression tests pass; these do not exercise the new browser import interactions.
- `npm run build -- --webpack` passes production compilation, TypeScript, and page generation.
- `npm run build` reproduces the existing Turbopack CSS worker port-binding restriction (`Operation not permitted`); build script unchanged.
- Signed-in browser checks for modal previews, repeated replacement, viewport fitting, and multi-session synchronization remain pending.

## Feature 19 Implementation

- Added a canvas-only top-right participant panel, separate from the unchanged shared navbar and its actions.
- Resolves the current user from Clerk; excludes their user ID from Liveblocks collaborator avatars and cursors, including other sessions of the same account.
- Shows up to five overlapping, display-only 32px collaborator photos with initials fallback, subtle rings, and a +N overflow chip. Clerk UserButton uses matching dimensions; the divider appears only with collaborators.
- React Flow mouse movement broadcasts unsnapped flow coordinates through existing Liveblocks presence; mouse leave clears the cursor. Colored pointers and matching name badges follow the receiving viewport's pan and zoom without intercepting canvas gestures.
- Renamed shared `isThinking` to the specified `thinking` boolean and updated initial presence. Node/edge behavior is unchanged.

## Feature 19 Validation

- Targeted ESLint passes for all five implementation files.
- All 26 existing regression tests pass; these do not exercise the new presence UI.
- `npm run build -- --webpack` passes production compilation, TypeScript, and page generation.
- `npm run build` remains blocked by the existing Turbopack CSS worker port-binding restriction (`Operation not permitted`), including an elevated retry. Build configuration is unchanged.
- Signed-in multi-user browser checks remain pending: own-ID exclusion across sessions, zero/five/overflow collaborator states, Clerk profile controls, image fallback, and cursor alignment during pan/zoom and clearing on mouse leave.

## Feature 20 Scope Clarifications

- The existing AI placeholder has floating placement but no transition or shadow classes. Preserve its geometry and parent toggle state, using the project sidebar's slide treatment for the specified animation and shadow.
- Use existing token equivalents: `text-copy-primary`, `text-copy-muted`, `bg-accent-dim`, `text-ai-text`, and `bg-ai` for the specification's semantic color names.
- Submission is local UI only: starter chips fill the composer; sending displays the user message and an explicit static assistant availability notice. Generate Spec remains disabled until generation is implemented; the demo card is static.

## Feature 20 Implementation

- Extracted `AiSidebar` with parent-controlled visibility, existing floating geometry, right-side slide transition, dark surface, border, and shadow. Closed content is inert; local chat state survives toggling and resets per project.
- Added the AI Workspace header, close button, and shadcn AI Architect/Specs tabs using existing color tokens.
- Added scrollable local chat, all three starter prompt chips, styled user/assistant bubbles, and a 72–160px auto-resizing composer with Enter submit and Shift+Enter newline support.
- Added the Specs generate placeholder and static demo card with disabled download. No backend, Liveblocks, or AI generation integration.

## Feature 20 Validation

- Targeted ESLint passes for the sidebar and parent integration; `git diff --check` passes.
- `npm run build -- --webpack` passes compilation, TypeScript, and page generation.
- `npm run build` initially failed to fetch Google Fonts; the network-enabled retry reproduced the existing Turbopack CSS worker port-binding restriction (`Operation not permitted`). Build configuration is unchanged.
- Browser visual and interaction checks remain pending; no live AI or spec generation is included in this shell.

## Feature 21 Scope and Progress

- Implementing canvas persistence in separate API and editor integration steps.
- Reuse `canvasJsonPath` in the actual schema at `prisma/models/project.prisma`; no migration needed.
- Use private Vercel Blob storage with `BLOB_READ_WRITE_TOKEN`, deterministic `canvas/{projectId}.json` paths, and uncached reads.
- Add the specified `/hook` autosave hook with a one-second debounce and serialized saves. Restore only into empty room storage, checking again after the fetch; failed loads must not trigger an empty overwrite.
- The navbar has no existing Save button, so add a compact Save button with saving/saved/error feedback and manual retry.

## Feature 21 Implementation

- Installed `@vercel/blob`; reused `prisma/models/project.prisma` → `canvasJsonPath` without a schema migration.
- Added member-authorized GET/PUT canvas routes, graph input validation, private JSON uploads, Prisma URL updates, and uncached snapshot reads. Missing snapshots return `canvas: null`; upstream failures return generic errors.
- Added `/hook/use-canvas-autosave.ts` with a one-second debounce, serialized in-flight saves, saving/saved/error status, and manual retry. Transient renderer state is excluded from saved JSON.
- Existing room content skips loading entirely. Empty rooms recheck live storage after fetching before restoring through batched Liveblocks handlers and fitting the viewport. Failed recovery blocks autosave to protect the saved snapshot.
- Added the navbar Save button and status indicator; retained the existing AI sidebar work.

## Feature 21 Validation

- `node --test tests/canvas-autosave.test.mjs tests/project-api.test.mjs`: 33 passing tests, including authorization, Blob/Prisma separation, absent snapshots, storage errors, graph validation, debouncing, existing-room load avoidance, and failed-load retry protection.
- Targeted implementation ESLint and webpack production build (including TypeScript and route generation) pass.
- `npm run build`: blocked by the existing Turbopack CSS worker port-binding restriction (`Operation not permitted`), including an elevated retry; build configuration unchanged.
- Live authenticated browser and external Blob integration checks remain pending. Runtime requires a private Blob store with `BLOB_READ_WRITE_TOKEN`.

## Feature 21 Initial Save Status Fix

- Root cause: the navbar initialized to saving, recovery reported saving for a GET, and an unset snapshot baseline caused an automatic PUT on mount.
- Initialize the status as saved and establish the initial graph or successfully restored snapshot as the baseline. Unchanged canvases skip automatic writes; manual Save still persists explicitly.
- Show saving only when a PUT starts, preserving debounced edits, recovery failures, and serialized writes.
- Eight autosave regression tests pass, including no initial save for existing/restored canvases and manual saving after restoration. Targeted lint and TypeScript checks pass.

## Feature 22 Scope

- Implement backend-only design triggering, run ownership records, and read tokens using the existing Trigger.dev 4.6.0 setup.
- Require authenticated project membership and matching room/project IDs (the existing room invariant). Token ownership means the authenticated user who initiated the run.
- Return `{ runId }` (202) and `{ token }` (200); invalid input returns 400, anonymous requests 401, and denied access 403. Public tokens read only the requested run and expire after 15 minutes.

## Feature 22 Implementation

- Added authenticated design trigger and owner-verified token endpoints, with input validation, membership checks, room/project consistency, generic upstream errors, and exact-run read tokens.
- Added TaskRun model, Project relation, and additive migration with the required unique run ID, run ID index, and user/project compound index. Generated Prisma client successfully.
- Added the minimal `design-agent` echo task under the existing task directory with a 30-second duration. No AI providers, canvas mutations, or UI integration added.
- Added cancellation compensation when TaskRun persistence fails after triggering.

## Feature 22 Validation

- Prisma schema validation/client generation, targeted ESLint, and 42 regression tests pass (eight new design task/API tests).
- Default `npm run build` reproduces the existing Turbopack process/port-binding restriction (`Operation not permitted`).
- Migration is supplied but has not been applied to the configured database. Live Trigger.dev execution/token issuance has not been exercised; it requires the server secret key and a registered worker.
- `npm run build -- --webpack`: passes production compilation, TypeScript, and page generation, including both new AI routes. `git diff --check` passes.

## Feature 23 Scope and Decisions

- Implement Gemini planning and seven validated graph actions through the installed `@liveblocks/react-flow/node` `mutateFlow` utility.
- No existing status feed or layout spacing rules were found. Use the Liveblocks `design-status` feed and a canvas activity panel; preserve existing cursor and participant components.
- Layout uses a 20px grid, at least 60px clearance around affected nodes, existing shape defaults, and the existing 80×60 resize minimum. Preserve unrelated content; reject invalid references and conflicting placements.
- Deliver backend execution first, then the minimal presence/status display, then validation. Prompt submission UI is outside this task implementation; the existing feature 22 API triggers this task.

## Feature 23 Implementation

- Replaced the echo task with a bounded Gemini tool loop using `GOOGLE_AI_API_KEY`, current canvas context, and all seven validated actions through `mutateFlow`.
- Serialized model mutations, checked live references/placement, preserved unrelated graph content, and removed incident edges with deleted nodes. Automatic task replay is disabled; partial failures retain already applied valid changes and report them.
- Added run-specific ephemeral presence, start/processing/complete/error feed messages, timeout/cancellation handling, and final cursor/thinking cleanup with TTL fallback.
- Added a Liveblocks feed subscriber panel and thinking text on the existing collaborator cursor. No new graph state system or prompt submission UI was added.

## Feature 23 Validation

- All 44 tests pass: 42 existing/API/task tests plus two tests exercising the actual Liveblocks server flow utility. Coverage includes all seven actions, palette/shape/size checks, spacing, duplicate/missing IDs, incident edge cleanup, unrelated-node preservation, progress, existing feeds, provider/storage failures, incomplete generation, and final presence cleanup.
- TypeScript, targeted ESLint, and `git diff --check` pass. `npm run build -- --webpack` passes compilation, TypeScript, and page generation.
- `npm run build` remains blocked by the existing Turbopack CSS worker process/port-binding restriction (`Operation not permitted`), including an elevated retry. Build configuration is unchanged.
- Live Gemini generation, Trigger.dev worker execution, and multi-user browser acceptance have not been exercised. The worker needs `GOOGLE_AI_API_KEY` and `LIVEBLOCKS_SECRET_KEY`; local `.env.local` values do not configure a deployed worker automatically. Existing feature 22 migration/worker prerequisites remain pending.

## Feature 24 Scope and Decisions

- Use `ai-status-feed` with a generic `{ text?: string }` payload validated in `types/tasks.ts`. Presence remains the source of active generation state (any participant, including self, with `thinking: true`); feed text does not latch the composer into a busy state.
- Mount the sidebar inside the existing room provider, create/reuse the generic feed, and display only its newest message. Existing feature 23 generation and design-status feed remain unchanged; no task triggering is added.

## Feature 24 Implementation

- Moved the existing sidebar under the canvas RoomProvider without introducing a second room connection or shared graph state.
- Added generic `ai-status-feed` creation/reuse and subscription with loading/error handling. Only the latest message is considered; `types/tasks.ts` validates its optional text before rendering.
- Shared thinking presence (self or any other participant) shows a small working indicator and disables the textarea, starter prompt input, and send action with a loading spinner. Tabs, close controls, and content remain usable; drafts survive activity changes.
- Cursor name badges show a small spinner only for `thinking: true`, including reduced-motion styling.
- No generation logic, task triggers, or background task changes added. The existing feature 23 task still publishes to `design-status`; future generic status producers should publish `{ text?: string }` to `ai-status-feed`.

## Feature 24 Validation

- `npx tsc --noEmit`, targeted ESLint, and `git diff --check` pass.
- Executed payload validation checks for missing/empty/valid text, extra generic metadata, and invalid null/array/primitive/non-string payloads; all pass.
- `npm run build -- --webpack` passes production compilation, TypeScript, and page generation.
- `npm run build` fails on the existing Turbopack CSS worker port-binding restriction (`Operation not permitted`), including an elevated retry. Build configuration remains unchanged.
- Live browser verification remains pending for multi-user status updates, simultaneous feed creation, composer transitions, preserved drafts, usable sidebar tabs, and cursor spinners during pan/zoom.

## Feature 25 Scope and Decisions

- Implement room-scoped `ai-chat` using the existing Liveblocks feed hooks, separate from status feeds. Replace local preview messages and the static assistant reply.
- Validate sender (room user ID and display name), user/assistant role, nonempty content, and ISO timestamp with Zod in `types/tasks.ts`. Order messages by server creation time and expose earlier history pagination.
- Preserve feature 24 thinking-state controls. Sending has its own pending/error state; failed sends retain the draft.

## Feature 25 Implementation

- Replaced local sidebar messages and the static assistant reply with room-scoped Liveblocks `ai-chat` subscription and sending, following existing feed creation/reuse patterns.
- Added Zod as a direct dependency and validated incoming/outgoing sender ID/name, role, content, and timestamp in `types/tasks.ts`. Invalid feed entries are skipped; valid messages show sender, timestamp, and content in server creation order with stable IDs.
- Added earlier-history loading, feed loading/error states, and send pending/error states. Drafts clear after successful sends and remain available for retry after failures; duplicate submissions are blocked.
- Preserved status feeds, thinking-state controls, sidebar styling, and Specs tab. No AI replies, task calls, or parallel realtime storage added.

## Feature 25 Validation

- `npx tsc --noEmit`, targeted ESLint on the sidebar/feed hook/schema, and `git diff --check` pass.
- Executed Zod payload checks for valid messages, trimmed content, missing fields, invalid sender/role/content/timestamp, and distinct chat/status feed IDs; all pass.
- `npm run build -- --webpack` passes compilation, TypeScript, and page generation.
- Required `npm run build` remains blocked by the existing Turbopack CSS worker process/port-binding restriction (`Operation not permitted`), including an elevated retry. Build configuration is unchanged.
- Live authenticated multi-user checks have not been exercised: feed creation/reuse, send/receive, history across reloads, pagination, and failure/retry behavior remain browser acceptance items.

## Feature 26 Scope and Integration Questions

- Implement the specified frontend contract exactly: POST `{ prompt, roomId }`, receive `{ runId, publicToken }`, and subscribe using `useRealtimeRun`. Backend and task changes are excluded by the feature specification.
- Integration blocker: the current feature 22 endpoint requires `projectId`, returns only `{ runId }`, and issues tokens through a separate endpoint. The specified frontend cannot start a live run until that contract is reconciled in a backend feature.
- The current task publishes to `design-status`, not `ai-status-feed`; the sidebar will consume the specified generic feed without changing task producers.
- Expose the existing canvas palette green (`#62C073`) through a shared CSS/Tailwind token to meet the exact color requirement without introducing a new palette color.
- Completion messages are published by the initiating mounted client; reload recovery and server-published chat completion are outside this frontend-only scope.

## Feature 26 Implementation

- Added a focused frontend hook that publishes the user prompt before POSTing `{ prompt, roomId }`, validates `{ runId, publicToken }`, and subscribes using `useRealtimeRun` with local credentials and per-run cache isolation.
- Prevents duplicate submissions; publishes one final assistant notice for successful/failed terminal outcomes and shared notices for request/credential/subscription errors. Drafts survive failed user-message delivery. A local alert is the fallback when the chat feed itself cannot deliver an error.
- Preserved the sidebar layout, history, and Specs tab. Local runs plus shared thinking presence disable the composer and display a spinner; the latest generic status appears in a compact strip directly above the input only during activity.
- Applied the existing palette green through a shared CSS/Tailwind token to user bubbles and the send button, with dark contrasting text. Assistant bubbles use dark surfaces and light text.
- No backend/task changes, final graph fetching, manual canvas updates, or additional room connections.

## Feature 26 Validation

- `node --test tests/*.test.mjs`: 49 passing tests, including seven new lifecycle tests for feed-before-request ordering, exact request/token contract, duplicate prevention, successful and failed terminal outcomes, consecutive runs, invalid credentials, transport/subscription errors, and failed feed delivery.
- `npx tsc --noEmit`, targeted ESLint for the hook/sidebar/new tests, and `git diff --check` pass.
- `npm run build -- --webpack` passes production compilation, TypeScript, and page generation with the final UI styles.
- `npm run build` reproduces the existing Turbopack CSS worker process/port-binding restriction (`Operation not permitted`). Build configuration remains unchanged.
- Live acceptance is not complete: the unchanged API rejects the specified request and does not return `publicToken`; the task does not produce generic status messages. Authenticated multi-session/browser verification remains pending after backend contract reconciliation.

## Feature 27 Scope and Decisions

- Reuse existing chat message payloads and canvas snapshot validation through Zod; empty chat/graph arrays are valid context. Client project IDs are ignored; membership resolved from roomId supplies the project ID.
- Deliver API/token routes first, then the task and regression checks. Tokens grant exact-run read access for one hour.
- Reuse Gemini configuration and bounded execution from the design task, with one task attempt and one provider retry. Return a plain Markdown string; no artifact persistence or frontend changes.

## Feature 27 Implementation

- Added Zod-validated spec trigger and token routes. Project membership is resolved from roomId; TaskRun ownership uses the authenticated user. Failed ownership persistence attempts cancellation before returning a generic error.
- Tokens require the initiating user's TaskRun and grant only that run's read scope for one hour with no-store response headers.
- Added generate-spec as a schemaTask using existing Gemini configuration, bounded execution, metadata status, structured lifecycle logging, and failure propagation. Output is a nonempty Markdown string; incomplete model responses fail.
- No frontend, schema migration, canvas/chat model change, or final spec storage added.

## Feature 27 Validation

- `node --test tests/*.test.mjs`: 58 passing tests, including nine new spec tests covering authorization, ignored client project/user IDs, invalid chat/graph input, ownership persistence and cancellation compensation, token ownership/scope/expiry, task schema, Markdown output, metadata transitions, and provider/configuration/incomplete-output failures.
- `npx tsc --noEmit`, targeted ESLint, and `git diff --check` pass.
- `npm run build -- --webpack` passes compilation, TypeScript, and route generation, including both spec endpoints.
- `npm run build` fails on the existing Turbopack CSS worker process/port-binding restriction (`Operation not permitted`). Build configuration is unchanged.
- Live Trigger.dev/Gemini execution was not performed. Runtime still requires the existing TaskRun migration, app Trigger.dev credentials, a registered worker, and GOOGLE_AI_API_KEY in that worker's environment. Mocked tests verify the lifecycle but do not establish live service acceptance.
