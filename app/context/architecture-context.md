# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.
- `POST /api/liveblocks-auth` accepts `{ room: projectId }`, checks the existing project access helper, ensures a private room with `getOrCreateRoom`, and issues access tokens scoped to that exact room. Session metadata includes Clerk display name/avatar and a deterministic cursor color. `lib/liveblocks.ts` lazily caches the server SDK client using `LIVEBLOCKS_SECRET_KEY`.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via Trigger.dev.
- Output: structured node and edge updates written into the shared Liveblocks room.

### Spec Generation

- Input: current canvas graph and project context.
- Execution: durable background task via Trigger.dev.
- Output: Markdown technical spec saved to the filesystem and linked to the project in the database.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.

## Editor project integration

- `lib/projects.ts` loads editor lists on the server using Clerk identity and verified emails for collaborator membership.
- Feature 07 creation may provide a validated slug-and-suffix `roomId`, stored as the project ID and future Liveblocks room ID. Creation without it retains the cuid default. Ownership always comes from Clerk.
- `/editor/[roomId]` uses `lib/project-access.ts` to resolve Clerk identity (user ID, primary email, and verified emails) and check owner or verified-email collaborator membership before rendering the workspace shell. Missing and unauthorized projects share the `AccessDenied` view; anonymous requests redirect to `/sign-in`. The room ID remains the project ID.

## Base collaborative canvas

- The workspace page retains server-side membership checks. Its client shell mounts `CanvasRoom` only for an active project, keyed by project/room ID.
- `CanvasRoom` owns the Liveblocks providers, initial presence, loading state, and connection error boundary. `BaseCanvas` uses `useLiveblocksFlow` with suspense and empty initial nodes/edges; Liveblocks manages the shared graph under its default `flow` storage key.
- `types/canvas.ts` defines node data and the `canvasNode`/`canvasEdge` type identifiers. Features 12–13 add a shape panel and a shared shape visual for `canvasNode` rendering and native drag images. Validated shape drops use React Flow screen-to-flow coordinates and the Liveblocks node-change handler to add shared nodes. CSS renders rectangle, pill, and circle; scalable SVG renders diamond, hexagon, and cylinder. Native drag images use the same default dimensions as dropped nodes and require no shared preview state. Application snapshot persistence is deferred.

- Feature 14 uses React Flow `NodeResizer` and `updateNodeData` to send dimensions and label updates through the existing controlled `onNodesChange` Liveblocks handler. Only editing visibility is local UI state; labels and dimensions remain in the shared graph.

- Feature 15 updates `data.color` through the same `updateNodeData` flow. The paired text color is derived from `NODE_COLORS` during rendering, keeping the pair consistent without redundant stored text-color state or server requests.

- Feature 16 registers `canvasEdge` (and the default edge fallback), with light arrowed connection defaults. Nodes expose four source handles under loose connection mode. Edge labels live in `data.label`; local input drafts commit through `updateEdgeData` and the existing Liveblocks edge-change handler.

- Feature 19 uses transient Liveblocks presence (`cursor` in React Flow coordinates and `thinking`) for canvas-only live cursors. Participant avatars use authenticated room metadata, excluding the active Clerk user ID; Clerk UserButton supplies the current user's profile controls. Cursor rendering follows the local viewport, and mouse leave clears presence. Presence does not enter shared graph storage or snapshots.

## Project sharing

- `/api/projects/[projectId]/collaborators` lists collaborators for members and accepts owner-only POST/DELETE mutations by email. Addresses are trimmed and lowercased; duplicate invitations return 409. Inviting grants access without sending email notifications.
- Clerk Backend API enriches verified collaborator emails with names and avatars at read time. Missing profiles or unavailable enrichment fall back to email; no local user table is added.
