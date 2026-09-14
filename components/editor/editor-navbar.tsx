"use client"

import { UserButton } from "@clerk/nextjs"
import { LayoutTemplate, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Share2 } from "lucide-react"
import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "cn"

interface EditorNavbarProps extends ComponentProps<"header"> {
  onTemplates?: () => void
  onShare?: () => void
  projectName?: string
  isAiSidebarOpen?: boolean
  onToggleAiSidebar?: () => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function EditorNavbar({
  onTemplates,
  onShare,
  projectName,
  isAiSidebarOpen,
  onToggleAiSidebar,
  isSidebarOpen,
  onToggleSidebar,
  className,
  ...props
}: EditorNavbarProps) {
  return (
    <header
      {...props}
      className={cn(
        "fixed inset-x-0 top-0 z-30 h-16 border-b border-surface-border bg-surface/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            onClick={onToggleSidebar}
            className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="min-w-0 flex-1 px-3 text-center">
          {projectName && <h1 className="truncate text-sm font-semibold text-copy-primary">{projectName}</h1>}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          {projectName && (
            <>
              <Button type="button" variant="ghost" onClick={onTemplates} aria-label="Open starter templates">
                <LayoutTemplate className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
              <Button type="button" variant="ghost" onClick={onShare} aria-label="Share project">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={onToggleAiSidebar}
                aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
                aria-expanded={isAiSidebarOpen} aria-controls="ai-sidebar">
                {isAiSidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
              </Button>
            </>
          )}
          <UserButton />
        </div>
      </div>
    </header>
  )
}
