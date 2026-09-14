"use client"

import { Copy, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProjectSharing } from "@/hooks/use-project-sharing"
import type { Project } from "@/types/project"

interface ShareDialogProps {
  project: Project
  onClose: () => void
}

export function ShareDialog({ project, onClose }: ShareDialogProps) {
  const state = useProjectSharing(project.id)
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !state.isPending) onClose() }}>
      <DialogContent className="rounded-3xl border-surface-border bg-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Share {project.name}</DialogTitle>
          <DialogDescription className="text-copy-muted">
            {state.isOwner ? "Invite collaborators by email to give them project access." : "View the people with access to this project."}
          </DialogDescription>
        </DialogHeader>
        {state.isOwner && (
          <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void state.invite() }}>
            <label htmlFor="collaborator-email" className="text-sm text-copy-secondary">Email address</label>
            <div className="flex gap-2">
              <Input id="collaborator-email" type="email" required maxLength={254} autoComplete="email"
                value={state.email} onChange={(event) => state.setEmail(event.target.value)} disabled={state.isPending}
                placeholder="name@example.com" className="min-w-0 border-surface-border bg-elevated" />
              <Button type="submit" disabled={state.isPending || !state.email.trim()}>Invite</Button>
            </div>
          </form>
        )}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-copy-secondary">Collaborators</h2>
          {state.isLoading ? <p role="status" className="text-sm text-copy-muted">Loading collaborators…</p> : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {state.collaborators.map((collaborator) => (
                <li key={collaborator.id} className="flex items-center gap-3 rounded-xl border border-surface-border bg-elevated p-3">
                  {collaborator.imageUrl && (
                    // Clerk supplies remote avatar URLs; render them without an image optimization proxy.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={collaborator.imageUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
                  )}
                  <div className="min-w-0 flex-1">
                    {collaborator.displayName && <p className="truncate text-sm text-copy-primary">{collaborator.displayName}</p>}
                    <p className="truncate text-sm text-copy-muted">{collaborator.email}</p>
                  </div>
                  {state.isOwner && <Button type="button" variant="ghost" size="icon" disabled={state.isPending}
                    aria-label={`Remove ${collaborator.email}`} onClick={() => void state.remove(collaborator.email)}
                    className="text-copy-muted hover:text-error"><Trash2 className="h-4 w-4" /></Button>}
                </li>
              ))}
              {!state.collaborators.length && !state.error && <li className="text-sm text-copy-muted">No collaborators yet.</li>}
            </ul>
          )}
        </div>
        {state.error && <p role="alert" className="text-sm text-error">{state.error}</p>}
        {state.isOwner && <Button type="button" variant="outline" onClick={() => void state.copyLink()}>
          <Copy className="h-4 w-4" /><span aria-live="polite">{state.copied ? "Copied!" : "Copy project link"}</span>
        </Button>}
      </DialogContent>
    </Dialog>
  )
}
