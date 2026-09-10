"use client"

import { useEffect, useRef } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProjectActions } from "@/hooks/use-project-actions"

interface ProjectDialogsProps {
  state: ReturnType<typeof useProjectActions>
}

export function ProjectDialogs({ state }: ProjectDialogsProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.dialog === "rename") {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [state.dialog])

  const isFormDialog = state.dialog === "create" || state.dialog === "rename"
  const title = state.dialog === "create" ? "Create Project" : "Rename Project"

  return (
    <>
      <Dialog open={isFormDialog} onOpenChange={(open) => !open && state.closeDialog()}>
        <DialogContent className="rounded-3xl border-surface-border bg-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-copy-primary">{title}</DialogTitle>
            <DialogDescription className="text-copy-muted">
              {state.dialog === "create"
                ? "Create a workspace for your next system design."
                : `Rename ${state.activeProject?.name ?? "this project"}.`}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (state.dialog === "create") {
                state.submitCreate()
              } else {
                state.submitRename()
              }
            }}
          >
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium text-copy-secondary">
                Project name
              </label>
              <Input
                ref={inputRef}
                id="project-name"
                disabled={state.isLoading}
                value={state.projectName}
                onChange={(event) => state.setProjectName(event.target.value)}
                placeholder="e.g. Payments Platform"
                autoFocus={state.dialog === "rename"}
                className="border-surface-border bg-elevated text-copy-primary placeholder:text-copy-faint"
              />
            </div>
            {state.dialog === "create" && (
              <div className="rounded-xl border border-surface-border bg-elevated px-3 py-2 text-sm">
                <span className="text-copy-muted">Room ID preview </span>
                <span className="font-mono text-brand">/{state.roomIdPreview || "project-name"}</span>
              </div>
            )}
            {state.error && <p role="alert" className="text-sm text-error">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={state.closeDialog} className="text-copy-secondary">
                Cancel
              </Button>
              <Button type="submit" disabled={state.isLoading || !state.projectName.trim()}>
                {state.dialog === "create" ? "Create project" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={state.dialog === "delete"} onOpenChange={(open) => !open && state.closeDialog()}>
        <DialogContent className="rounded-3xl border-surface-border bg-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-copy-primary">Delete Project</DialogTitle>
            <DialogDescription className="text-copy-muted">
              Delete {state.activeProject?.name ?? "this project"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {state.error && <p role="alert" className="text-sm text-error">{state.error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={state.closeDialog} className="text-copy-secondary">
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={state.isLoading} onClick={state.submitDelete}>
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}