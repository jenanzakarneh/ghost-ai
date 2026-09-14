import Link from "next/link"
import { LockKeyhole } from "lucide-react"

export function AccessDenied() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-base px-6 text-center">
      <LockKeyhole aria-hidden="true" className="h-8 w-8 text-copy-muted" />
      <h1 className="text-xl font-semibold text-copy-primary">Access denied</h1>
      <p className="text-sm text-copy-muted">This project is unavailable or you don’t have access to it.</p>
      <Link href="/editor" className="rounded-xl px-4 py-2 text-sm text-brand hover:bg-accent-dim">
        Back to projects
      </Link>
    </main>
  )
}
