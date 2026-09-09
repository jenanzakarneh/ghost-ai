import type { ReactNode } from "react"

interface AuthShellProps {
  children: ReactNode
  eyebrow: string
  title: string
  description: string
}

export function AuthShell({ children, eyebrow, title, description }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-base lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
      <section className="hidden border-r border-surface-border px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="flex items-center gap-3 text-copy-primary">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="font-mono text-sm font-semibold tracking-[0.18em]">GHOST AI</span>
        </div>

        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-copy-primary xl:text-5xl">{title}</h1>
            <p className="max-w-sm text-base leading-7 text-copy-secondary">{description}</p>
          </div>
          <ul className="space-y-3 border-l border-surface-border pl-4 text-sm text-copy-muted">
            <li>Map systems from plain language.</li>
            <li>Refine architecture with your team.</li>
            <li>Turn decisions into a technical spec.</li>
          </ul>
        </div>

        <p className="text-xs text-copy-faint">A shared workspace for clearer technical thinking.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </section>
    </main>
  )
}