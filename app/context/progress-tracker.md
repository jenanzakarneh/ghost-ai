# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Backend project APIs complete (feature 06).

## Current Goal

- Implement feature 06 project APIs without wiring the UI.

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

## In Progress

- None.

## Next Up

- Wire the editor UI in a separate feature unit after backend verification.

## Open Questions

- The existing environment did not define sign-in/sign-up URL variables, so the standard Clerk variables are read with `/sign-in` and `/sign-up` fallbacks.
- The repo was using a Prisma v8 preview CLI while the installed client/adapter stack is v7, so the schema config and migration flow were aligned to the production dependency version.

## Architecture Decisions

- Prisma stores relational project metadata and collaborator records in PostgreSQL, while canvas and spec artifacts remain outside the database as future blob-backed files.
- The project database layer uses a single cached Prisma client instance for hot reload safety in development and a direct Postgres adapter when `DATABASE_URL` is not Prisma Accelerate-based.
- Project listing in feature 06 is owner-scoped; rename/delete are owner-only. Client-supplied IDs and ownership fields are never used for creation or renaming.

## Session Notes

- Read the feature spec and required context files before implementation. shadcn generated foundation components should remain unmodified.
- `next build` with default Turbopack hit an environment port-binding panic while processing CSS; `next build --webpack` completed successfully.
- Auth routes use Clerk's path-based catch-all pages so the built-in flows retain their nested callback routes.
- Project management is intentionally mock-only; no API or persistence was added per the feature spec.
- Prisma CLI and client versions were aligned to match the installed dependency stack; the v8 config API is incompatible with this repo’s actual package versions.
- Feature 06 leaves the UI mock-backed. Run API regression checks with `node --test tests/project-api.test.mjs`; these do not exercise a live Clerk session or database.
- Feature 06: plain `npm run build` first failed fetching Google Fonts; the approved network retry encountered the existing Turbopack port-binding panic. The webpack production build passed without changing the build script.
