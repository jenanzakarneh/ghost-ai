import { EditorHome } from "@/components/editor/editor-home"
import { getEditorProjects } from "@/lib/projects"

export default async function EditorPage() {
  const projects = await getEditorProjects()
  return <EditorHome {...projects} />
}
