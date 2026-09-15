"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CanvasRoom } from "@/components/editor/canvas-room"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { Project, ProjectLists } from "@/types/project"

interface EditorHomeProps extends ProjectLists {
  activeProject?: Project
}

export function EditorHome({ ownedProjects, sharedProjects, activeProject }: EditorHomeProps) {
  const [saveStatus, setSaveStatus] = useState<import("@/lib/canvas-snapshot").CanvasSaveStatus>("saved")
  const [saveRequest, setSaveRequest] = useState(0)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const projectDialogs = useProjectActions(activeProject?.id)

  return (
    <main className="h-dvh overflow-hidden bg-base">
      <EditorNavbar
        saveStatus={saveStatus}
        onSave={() => setSaveRequest((request) => request + 1)}
        onTemplates={() => setIsTemplatesOpen(true)}
        onShare={() => setIsShareOpen(true)}
        projectName={activeProject?.name}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((isOpen) => !isOpen)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <ProjectSidebar
        activeProjectId={activeProject?.id}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={projectDialogs.openCreateDialog}
        onRenameProject={projectDialogs.openRenameDialog}
        onDeleteProject={projectDialogs.openDeleteDialog}
      />
      <section className="flex h-full items-center justify-center pt-16">
        {activeProject ? (
          <CanvasRoom saveRequest={saveRequest} onSaveStatus={setSaveStatus} key={activeProject.id} roomId={activeProject.id} templatesOpen={isTemplatesOpen} onTemplatesOpenChange={setIsTemplatesOpen} />
        ) : (
          <div className="px-6 text-center">
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
      {activeProject && <AiSidebar key={activeProject.id} isOpen={isAiSidebarOpen} onClose={() => setIsAiSidebarOpen(false)} />}
      {activeProject && isShareOpen && <ShareDialog project={activeProject} onClose={() => setIsShareOpen(false)} />}
      <ProjectDialogs state={projectDialogs} />
    </main>
  )
}
