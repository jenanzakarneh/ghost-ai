"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Bot, Download, FileText, LoaderCircle, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useOthers, useSelf } from "@liveblocks/react"
import { AiStatusFeed } from "@/components/editor/ai-status-feed"
import { useAiChatFeed } from "@/hooks/use-ai-chat-feed"
import { useAiDesignRun } from "@/hooks/use-ai-design-run"
import { cn } from "@/lib/utils"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const othersThinking = useOthers((others) => others.some((other) => other.presence.thinking === true))
  const selfThinking = useSelf((self) => self.presence.thinking === true)
  const isThinking = othersThinking || selfThinking === true
  const [draft, setDraft] = useState("")
  const { messages, ready, unavailable, hasFetchedAll, fetchMore, isFetchingMore, fetchMoreError } = useAiChatFeed()
  const self = useSelf()
  const { submit: submitDesign, isSubmitting, isRunning, deliveryError } = useAiDesignRun()
  const isActive = isThinking || isRunning
  const composerDisabled = isActive || isSubmitting || !ready || !self
  const [tab, setTab] = useState("architect")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "72px"
      textarea.style.height = `${Math.min(160, Math.max(72, textarea.scrollHeight))}px`
    }
  }, [draft, tab, isOpen])

  const latestMessageId = messages.at(-1)?.id

  useLayoutEffect(() => {
    const chat = chatRef.current
    if (chat) chat.scrollTop = chat.scrollHeight
  }, [latestMessageId, tab, isOpen])

  async function submit() {
    if (composerDisabled) return
    if (await submitDesign(draft)) setDraft("")
  }

  const tabClassName = "rounded-xl text-copy-muted data-[state=active]:bg-accent-dim data-[state=active]:text-ai-text dark:data-[state=active]:bg-accent-dim dark:data-[state=active]:text-ai-text dark:data-[state=active]:border-transparent"

  return (
    <aside
      id="ai-sidebar"
      aria-labelledby="ai-sidebar-title"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed right-4 top-20 bottom-4 z-20 flex w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/95 shadow-2xl shadow-black/30 backdrop-blur-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]",
      )}
    >
      <header className="flex shrink-0 items-center gap-3 p-5">
        <Bot aria-hidden="true" className="h-5 w-5 shrink-0 text-ai-text" />
        <div className="min-w-0 flex-1">
          <h2 id="ai-sidebar-title" className="text-base font-semibold text-copy-primary">AI Workspace</h2>
          <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close AI sidebar" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
        <TabsList aria-label="AI workspace" className="mx-5 mb-4 w-auto shrink-0 rounded-xl bg-subtle">
          <TabsTrigger value="architect" className={tabClassName}>AI Architect</TabsTrigger>
          <TabsTrigger value="specs" className={tabClassName}>Specs</TabsTrigger>
        </TabsList>
        <TabsContent value="architect" className="flex min-h-0 flex-col">
          <div ref={chatRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            {unavailable && <p role="alert" className="mb-3 text-xs text-copy-muted">Chat is temporarily unavailable.</p>}
            {!ready && !unavailable && <p role="status" className="text-xs text-copy-muted">Loading chat…</p>}
            {ready && !hasFetchedAll && <Button variant="ghost" size="sm" disabled={isFetchingMore} onClick={() => void fetchMore?.()} className="mb-3 text-xs text-copy-muted">{isFetchingMore ? "Loading…" : "Load earlier messages"}</Button>}
            {fetchMoreError && <p role="alert" className="mb-3 text-xs text-copy-muted">Earlier messages could not be loaded. Please try again.</p>}
            {ready && messages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center gap-4 py-6 text-center">
                <Bot aria-hidden="true" className="h-8 w-8 text-ai-text" />
                <p className="text-sm text-copy-muted">Describe the system you want to build with Ghost AI.</p>
                <div className="flex flex-col items-center gap-2">
                  {starterPrompts.map((prompt) => (
                    <Button key={prompt} disabled={composerDisabled} variant="ghost" className="h-auto whitespace-normal rounded-full bg-subtle px-3 py-2 text-xs text-ai-text hover:text-ai-text" onClick={() => {
                      setDraft(prompt)
                      textareaRef.current?.focus()
                    }}>{prompt}</Button>
                  ))}
                </div>
              </div>
            ) : (
              <div role="log" aria-label="Architecture chat" aria-live="polite" className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={cn("w-fit max-w-[90%] whitespace-pre-wrap wrap-anywhere rounded-2xl px-3 py-2 text-sm", message.role === "user"
                    ? "ml-auto bg-chat-accent text-background"
                    : "mr-auto border border-surface-border bg-elevated text-copy-primary")}>
                    <div className={cn("mb-1 flex flex-wrap items-center gap-x-2 text-xs", message.role === "user" ? "text-background/80" : "text-copy-muted")}>
                      <span>{message.sender.name}</span>
                      <time dateTime={message.timestamp} title={new Date(message.timestamp).toLocaleString()}>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                    </div>
                    {message.content}
                  </div>
                ))}
              </div>
            )}
          </div>
          <form className="shrink-0 space-y-3 border-t border-surface-border p-4" onSubmit={(event) => { event.preventDefault(); void submit() }}>
            {isActive && (
              <div role="status" aria-live="polite" className="flex items-start gap-2 rounded-xl border border-chat-accent/30 bg-base px-3 py-2 text-xs text-chat-accent">
                <LoaderCircle aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 animate-spin motion-reduce:animate-none" />
                <div className="min-w-0"><p>AI is working…</p><AiStatusFeed /></div>
              </div>
            )}
            <Textarea disabled={composerDisabled} ref={textareaRef} aria-label="Message room" placeholder="Discuss your architecture…" value={draft} onChange={(event) => setDraft(event.target.value)}
              className="min-h-[72px] max-h-[160px] resize-none rounded-xl bg-subtle text-copy-primary dark:bg-subtle"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  void submit()
                }
              }}
            />
            {deliveryError && <p role="alert" className="text-xs text-error">{deliveryError}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={composerDisabled || !draft.trim()} aria-busy={isActive || isSubmitting} className="rounded-xl bg-chat-accent text-background hover:bg-chat-accent/90 disabled:opacity-50">{isActive || isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Send aria-hidden="true" className="h-4 w-4" />}{isActive ? "Working…" : isSubmitting ? "Sending…" : "Send"}</Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="specs" className="min-h-0 space-y-4 overflow-y-auto px-5 pb-5">
          <Button disabled className="w-full rounded-xl bg-ai text-white hover:bg-ai/90"><FileText aria-hidden="true" className="h-4 w-4" />Generate Spec</Button>
          <p className="text-xs text-copy-muted">Spec generation is coming soon.</p>
          <article className="space-y-3 rounded-2xl border border-surface-border bg-elevated p-4">
            <FileText aria-hidden="true" className="h-5 w-5 text-ai-text" />
            <h3 className="text-sm font-medium text-copy-primary">System Architecture · Demo</h3>
            <p className="text-xs leading-relaxed text-copy-muted">A sample technical specification describing services, data storage, and how components communicate.</p>
            <Button disabled variant="outline" size="sm" className="rounded-xl"><Download aria-hidden="true" className="h-4 w-4" />Download</Button>
          </article>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
