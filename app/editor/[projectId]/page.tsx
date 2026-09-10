import { notFound } from "next/navigation"
import { EditorHome } from "@/components/editor/editor-home"
import { getEditorProjects } from "@/lib/projects"

interface WorkspacePageProps {
  params: Promise<{ projectId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { projectId } = await params
  const projects = await getEditorProjects()
  const activeProject = [...projects.ownedProjects, ...projects.sharedProjects]
    .find((project) => project.id === projectId)
  if (!activeProject) notFound()
  return <EditorHome {...projects} activeProject={activeProject} />
}
