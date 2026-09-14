// Fixed cursor palette drawn from the canvas text colors in ui-context.md.
export const CURSOR_COLORS = [
  "#52A8FF", "#BF7AF0", "#FF990A", "#FF6166", "#F75F8F", "#62C073", "#0AC7B4",
] as const

export function getCursorColor(userId: string): string {
  let hash = 0
  for (let index = 0; index < userId.length; index++) {
    hash = (Math.imul(hash, 31) + userId.charCodeAt(index)) >>> 0
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length]
}
