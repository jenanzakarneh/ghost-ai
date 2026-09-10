"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { Project, ProjectLists } from "@/types/project"

interface EditorHomeProps extends ProjectLists {
  activeProject?: Project
}

export function EditorHome({ ownedProjects, sharedProjects, activeProject }: EditorHomeProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const projectDialogs = useProjectActions(activeProject?.id)

  return (
    <main className="min-h-screen bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={projectDialogs.openCreateDialog}
        onRenameProject={projectDialogs.openRenameDialog}
        onDeleteProject={projectDialogs.openDeleteDialog}
      />
      <section className="flex min-h-screen items-center justify-center px-6 pt-16">
        {activeProject ? (
          <h1 className="text-2xl font-semibold text-copy-primary">{activeProject.name}</h1>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-copy-primary">Create a project or open an existing one</h1>
            <p className="mt-2 text-sm text-copy-muted">
              Start a new architecture workspace, or choose a project from the sidebar.
            </p>
            <button
              type="button"
              onClick={projectDialogs.openCreateDialog}
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-medium text-background transition-colors hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        )}
      </section>
      <ProjectDialogs state={projectDialogs} />
    </main>
  )
}
