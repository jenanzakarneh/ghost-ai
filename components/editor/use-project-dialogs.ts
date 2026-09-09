"use client"

import { useMemo, useState } from "react"

import type { Project } from "@/components/editor/project-sidebar"

export type ProjectDialog = "create" | "rename" | "delete" | null

const initialProjects: Project[] = [
  { id: "ghost-platform", name: "Ghost Platform", slug: "ghost-platform", isOwned: true },
  { id: "payments-rebuild", name: "Payments Rebuild", slug: "payments-rebuild", isOwned: true },
  { id: "team-analytics", name: "Team Analytics", slug: "team-analytics", isOwned: false },
]

function slugifyProjectName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function useProjectDialogs() {
  const [projects, setProjects] = useState(initialProjects)
  const [dialog, setDialog] = useState<ProjectDialog>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const slugPreview = useMemo(() => slugifyProjectName(projectName), [projectName])

  function openCreateDialog() {
    setActiveProject(null)
    setProjectName("")
    setDialog("create")
  }

  function openRenameDialog(project: Project) {
    setActiveProject(project)
    setProjectName(project.name)
    setDialog("rename")
  }

  function openDeleteDialog(project: Project) {
    setActiveProject(project)
    setDialog("delete")
  }

  function closeDialog() {
    if (!isLoading) {
      setDialog(null)
    }
  }

  function submitCreate() {
    const name = projectName.trim()
    const slug = slugifyProjectName(name)
    if (!name || !slug) return

    setIsLoading(true)
    setProjects((currentProjects) => [
      ...currentProjects,
      { id: crypto.randomUUID(), name, slug, isOwned: true },
    ])
    setIsLoading(false)
    setDialog(null)
  }

  function submitRename() {
    const name = projectName.trim()
    if (!activeProject || !name) return

    setIsLoading(true)
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === activeProject.id
          ? { ...project, name, slug: slugifyProjectName(name) }
          : project
      )
    )
    setIsLoading(false)
    setDialog(null)
  }

  function submitDelete() {
    if (!activeProject) return

    setIsLoading(true)
    setProjects((currentProjects) => currentProjects.filter((project) => project.id !== activeProject.id))
    setIsLoading(false)
    setDialog(null)
  }

  return {
    activeProject,
    closeDialog,
    dialog,
    isLoading,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    projectName,
    projects,
    setProjectName,
    slugPreview,
    submitCreate,
    submitDelete,
    submitRename,
  }
}