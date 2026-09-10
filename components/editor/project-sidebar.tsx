"use client"

import Link from "next/link"
import type { Project } from "@/types/project"

import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "cn"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: Project[]
  sharedProjects: Project[]
  onCreateProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

function EmptyProjectState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-elevated text-copy-muted">
        <span className="text-xs font-medium">—</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-copy-primary">No projects yet</p>
        <p className="text-xs text-copy-muted">Create a new project to get started.</p>
      </div>
    </div>
  )
}

function ProjectList({
  projects,
  onRenameProject,
  onDeleteProject,
}: Pick<ProjectSidebarProps, "onRenameProject" | "onDeleteProject"> & { projects: Project[] }) {
  if (projects.length === 0) {
    return <EmptyProjectState />
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div
          key={project.id}
          className="group flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-elevated px-3 py-2"
        >
          <Link href={`/editor/${encodeURIComponent(project.id)}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-copy-primary">{project.name}</p>
            <p className="truncate font-mono text-xs text-copy-muted">/{project.id}</p>
          </Link>
          {project.isOwned && (
            <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Rename ${project.name}`}
                onClick={() => onRenameProject(project)}
                className="text-copy-muted hover:bg-subtle hover:text-copy-primary"
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Delete ${project.name}`}
                onClick={() => onDeleteProject(project)}
                className="text-copy-muted hover:bg-subtle hover:text-error"
              >
                <Trash2 />
              </Button>
            </div>
          )}
          {!project.isOwned && <MoreHorizontal className="h-4 w-4 shrink-0 text-copy-faint" />}
        </div>
      ))}
    </div>
  )
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  return (
    <>
      <div
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-0 z-20 bg-black/30 transition-opacity duration-200",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-[320px] border-r border-surface-border bg-surface/95 shadow-2xl shadow-black/30 backdrop-blur-sm transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <h2 className="text-base font-semibold text-copy-primary">Projects</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close project sidebar"
              onClick={onClose}
              className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 px-4 py-4">
            <Tabs defaultValue="my-projects" className="h-full">
              <TabsList className="grid w-full grid-cols-2 bg-elevated">
                <TabsTrigger value="my-projects">My Projects</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
              </TabsList>

              <TabsContent value="my-projects" className="mt-4">
                <ProjectList
                  projects={ownedProjects}
                  onRenameProject={onRenameProject}
                  onDeleteProject={onDeleteProject}
                />
              </TabsContent>

              <TabsContent value="shared" className="mt-4">
                <ProjectList
                  projects={sharedProjects}
                  onRenameProject={onRenameProject}
                  onDeleteProject={onDeleteProject}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t border-surface-border p-4">
            <Button
              type="button"
              onClick={onCreateProject}
              className="w-full justify-center gap-2 bg-brand text-background hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
