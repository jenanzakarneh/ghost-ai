"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NodeShapeVisual } from "@/components/editor/node-shape"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/components/editor/starter-templates"
import { SHAPE_SIZES } from "@/lib/shape-drag"

export interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const nodes = template.nodes.map((node) => ({ ...node,
    width: node.width ?? SHAPE_SIZES[node.data.shape].width,
    height: node.height ?? SHAPE_SIZES[node.data.shape].height,
  }))
  const left = Math.min(...nodes.map((node) => node.position.x))
  const top = Math.min(...nodes.map((node) => node.position.y))
  const width = Math.max(...nodes.map((node) => node.position.x + node.width)) - left
  const height = Math.max(...nodes.map((node) => node.position.y + node.height)) - top
  const byId = new Map(nodes.map((node) => [node.id, node]))

  return (
    <svg role="img" aria-label={`${template.name} diagram preview`} className="h-40 w-full rounded-xl bg-base"
      viewBox={`${left - 24} ${top - 24} ${width + 48} ${height + 48}`} preserveAspectRatio="xMidYMid meet">
      {template.edges.map((edge) => {
        const source = byId.get(edge.source)
        const target = byId.get(edge.target)
        if (!source || !target) return null
        return <line key={edge.id} x1={source.position.x + source.width / 2} y1={source.position.y + source.height / 2}
          x2={target.position.x + target.width / 2} y2={target.position.y + target.height / 2}
          stroke="var(--text-muted)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      })}
      {nodes.map((node) => (
        <foreignObject key={node.id} x={node.position.x} y={node.position.y} width={node.width} height={node.height}>
          <NodeShapeVisual shape={node.data.shape} color={node.data.color}>{node.data.label}</NodeShapeVisual>
        </foreignObject>
      ))}
    </svg>
  )
}

export function StarterTemplatesModal({ open, onOpenChange, onImport }: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-hidden rounded-3xl border-surface-border bg-surface sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Starter templates</DialogTitle>
          <DialogDescription>Choose a predefined design. Importing replaces all nodes and edges in this canvas.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60dvh] grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <article key={template.id} className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-elevated p-4">
              <TemplatePreview template={template} />
              <h3 className="font-semibold text-copy-primary">{template.name}</h3>
              <p className="flex-1 text-sm text-copy-muted">{template.description}</p>
              <Button type="button" aria-label={`Import ${template.name}`} onClick={() => {
                onImport(template)
                onOpenChange(false)
              }}>Import template</Button>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
