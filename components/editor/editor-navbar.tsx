"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "cn"

interface EditorNavbarProps extends ComponentProps<"header"> {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function EditorNavbar({
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
        <div className="flex w-1/3 items-center">
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

        <div className="flex flex-1 items-center justify-center" />

        <div className="flex w-1/3 items-center justify-end" />
      </div>
    </header>
  )
}
