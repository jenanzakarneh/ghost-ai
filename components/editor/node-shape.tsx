import type { ReactNode } from "react"
import { NODE_COLORS, type NodeShape } from "@/types/canvas"

interface NodeShapeProps {
  shape: NodeShape
  color: string
  selected?: boolean
  children?: ReactNode
}

export function NodeShapeVisual({ shape, color, selected = false, children }: NodeShapeProps) {
  const border = selected ? "var(--accent-primary)" : "var(--border-default)"
  const isSvg = shape === "diamond" || shape === "hexagon" || shape === "cylinder"

  return (
    <div className="relative flex h-full w-full items-center justify-center text-center text-sm"
      style={{ color: NODE_COLORS.find((item) => item.color === color)?.textColor ?? NODE_COLORS[0].textColor }}>
      {isSvg ? (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100" preserveAspectRatio="none" fill={color} stroke={border} strokeWidth={1}>
          {shape === "diamond" && <polygon points="50,0.5 99.5,50 50,99.5 0.5,50" vectorEffect="non-scaling-stroke" />}
          {shape === "hexagon" && <polygon points="25,0.5 75,0.5 99.5,50 75,99.5 25,99.5 0.5,50" vectorEffect="non-scaling-stroke" />}
          {shape === "cylinder" && <>
            <path d="M 0.5,12 C 0.5,-3.3 99.5,-3.3 99.5,12 L 99.5,88 C 99.5,103.3 0.5,103.3 0.5,88 Z" vectorEffect="non-scaling-stroke" />
            <path d="M 0.5,12 C 0.5,27.3 99.5,27.3 99.5,12" fill="none" vectorEffect="non-scaling-stroke" />
          </>}
        </svg>
      ) : (
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 border ${shape === "rectangle" ? "rounded-xl" : "rounded-full"}`}
          style={{ backgroundColor: color, borderColor: border }} />
      )}
      <span className={`relative min-w-0 break-words whitespace-pre-wrap ${shape === "diamond" ? "max-w-1/2" : "max-w-3/4"}`}>{children}</span>
    </div>
  )
}
