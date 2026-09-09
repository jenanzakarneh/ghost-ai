"use client"

import { useState } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <main className="min-h-screen bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <ProjectSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <section className="flex min-h-screen items-center justify-center px-6 pt-16">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Workspace ready</p>
          <h1 className="mt-3 text-2xl font-semibold text-copy-primary">Start a system design</h1>
          <p className="mt-2 text-sm text-copy-muted">Your canvas will live here.</p>
        </div>
      </section>
    </main>
  )
}