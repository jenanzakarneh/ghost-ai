"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { Project } from "@/types/project"

export function useProjectActions(activeWorkspaceId?: string) {
  const router = useRouter()
  const pending = useRef(false)
  const [dialog, setDialog] = useState<"create" | "rename" | "delete" | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const slug = projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "") || "project"
  const roomIdPreview = `${slug}-${suffix}`

  function openCreateDialog() {
    if (pending.current) return
    setError(null)
    setActiveProject(null)
    setProjectName("")
    setSuffix(crypto.randomUUID().replaceAll("-", "").slice(0, 12))
    setDialog("create")
  }

  function openRenameDialog(project: Project) {
    if (pending.current) return
    setError(null)
    setActiveProject(project)
    setProjectName(project.name)
    setDialog("rename")
  }

  function openDeleteDialog(project: Project) {
    if (pending.current) return
    setError(null)
    setActiveProject(project)
    setDialog("delete")
  }

  function closeDialog() {
    if (!pending.current) setDialog(null)
  }

  async function mutate(method: "POST" | "PATCH" | "DELETE") {
    if (pending.current || (method !== "POST" && !activeProject)) return
    if (method !== "DELETE" && !projectName.trim()) return
    pending.current = true
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(method === "POST" ? "/api/projects" : `/api/projects/${encodeURIComponent(activeProject!.id)}`, {
        method,
        ...(method !== "DELETE" && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projectName.trim(), ...(method === "POST" && { roomId: roomIdPreview }) }),
        }),
      })
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null)
        throw new Error(body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error : "Unable to save project changes. Please try again.")
      }
      if (method === "POST") {
        const body: unknown = await response.json()
        if (!body || typeof body !== "object" || !("project" in body) || !body.project ||
          typeof body.project !== "object" || !("id" in body.project) || typeof body.project.id !== "string") {
          throw new Error("The server returned an invalid project.")
        }
        router.push(`/editor/${encodeURIComponent(body.project.id)}`)
      } else if (method === "DELETE" && activeProject?.id === activeWorkspaceId) {
        router.replace("/editor")
        router.refresh()
      } else {
        router.refresh()
      }
      setDialog(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save project changes. Please try again.")
    } finally {
      pending.current = false
      setIsLoading(false)
    }
  }

  return {
    activeProject, closeDialog, dialog, error, isLoading, openCreateDialog,
    openDeleteDialog, openRenameDialog, projectName, setProjectName, roomIdPreview,
    submitCreate: () => mutate("POST"),
    submitRename: () => mutate("PATCH"),
    submitDelete: () => mutate("DELETE"),
  }
}
