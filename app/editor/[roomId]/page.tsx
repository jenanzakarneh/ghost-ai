import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/editor/access-denied"
import { EditorHome } from "@/components/editor/editor-home"
import { getAccessibleProject, getProjectIdentity } from "@/lib/project-access"
import { getEditorProjects } from "@/lib/projects"

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const identity = await getProjectIdentity()
  if (!identity) redirect("/sign-in")
  const { roomId } = await params
  const activeProject = await getAccessibleProject(roomId, identity)
  if (!activeProject) return <AccessDenied />
  const projects = await getEditorProjects()
  return <EditorHome key={roomId} {...projects} activeProject={activeProject} />
}
