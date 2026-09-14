import { Liveblocks } from "@liveblocks/node"

export class LiveblocksConfigurationError extends Error {}

const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocks?: Liveblocks
}

// Initialize only on demand so builds do not require the runtime secret.
export function getLiveblocks(): Liveblocks {
  if (!globalForLiveblocks.liveblocks) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) throw new LiveblocksConfigurationError("LIVEBLOCKS_SECRET_KEY is not defined")
    if (!secret.startsWith("sk_")) {
      throw new LiveblocksConfigurationError("LIVEBLOCKS_SECRET_KEY must contain the secret key starting with sk_, not a public pk_ key. Update .env.local and restart the dev server.")
    }
    globalForLiveblocks.liveblocks = new Liveblocks({ secret })
  }
  return globalForLiveblocks.liveblocks
}
