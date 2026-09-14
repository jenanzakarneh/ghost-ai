"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Collaborator } from "@/types/collaborator"

export function useProjectSharing(projectId: string) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [copied, setCopied] = useState(false)
  const busy = useRef(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endpoint = `/api/projects/${encodeURIComponent(projectId)}/collaborators`

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(endpoint, { signal, cache: "no-store" })
    if (!response.ok) throw new Error("Unable to load collaborators. Please try again.")
    return await response.json() as { collaborators: Collaborator[]; isOwner: boolean }
  }, [endpoint])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setCollaborators(data.collaborators)
          setIsOwner(data.isOwner)
        }
      })
      .catch(() => { if (!controller.signal.aborted) setError("Unable to load collaborators. Close and reopen to retry.") })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => {
      controller.abort()
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [load])

  async function mutate(method: "POST" | "DELETE", address: string) {
    if (busy.current || !isOwner) return
    busy.current = true
    setIsPending(true)
    setError(null)
    try {
      const response = await fetch(endpoint, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: address }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Unable to update access. Please try again.")
      }
      if (method === "POST") setEmail("")
      const data = await load()
      setCollaborators(data.collaborators)
      setIsOwner(data.isOwner)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update access. Please try again.")
    } finally {
      busy.current = false
      setIsPending(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/editor/${encodeURIComponent(projectId)}`)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Unable to copy the link. Please copy it from your browser’s address bar.")
    }
  }

  return { collaborators, isOwner, isLoading, isPending, error, email, setEmail, copied, copyLink,
    invite: () => mutate("POST", email), remove: (address: string) => mutate("DELETE", address) }
}
