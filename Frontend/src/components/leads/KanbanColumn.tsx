"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Lead } from "@/types";
import LeadCard from "@/components/leads/LeadCard";
import { cn } from "@/utils/cn";

interface KanbanColumnProps {
  id: string;
  title: string;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const COLUMN_CONFIG: Record<
  string,
  {
    accent: string;
    headerBg: string;
    columnBg: string;
    dotColor: string;
    badgeBg: string;
    emptyText: string;
    emptyIcon: string;
  }
> = {
  NEW: {
    accent: "border-t-blue-500",
    headerBg: "bg-blue-50/70",
    columnBg: "bg-blue-50/20",
    dotColor: "bg-blue-500",
    badgeBg: "bg-blue-500",
    emptyText: "No new leads yet",
    emptyIcon: "🌱",
  },
  CONTACTED: {
    accent: "border-t-violet-500",
    headerBg: "bg-violet-50/70",
    columnBg: "bg-violet-50/20",
    dotColor: "bg-violet-500",
    badgeBg: "bg-violet-500",
    emptyText: "No contacted leads",
    emptyIcon: "📞",
  },
  VISIT_SCHEDULED: {
    accent: "border-t-amber-500",
    headerBg: "bg-amber-50/70",
    columnBg: "bg-amber-50/20",
    dotColor: "bg-amber-500",
    badgeBg: "bg-amber-500",
    emptyText: "No visits scheduled",
    emptyIcon: "📅",
  },
  CLOSED: {
    accent: "border-t-emerald-500",
    headerBg: "bg-emerald-50/70",
    columnBg: "bg-emerald-50/20",
    dotColor: "bg-emerald-500",
    badgeBg: "bg-emerald-500",
    emptyText: "No closed deals yet",
    emptyIcon: "✅",
  },
};

export default function KanbanColumn({ id, title, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const cfg = COLUMN_CONFIG[id] ?? {
    accent: "border-t-slate-400",
    headerBg: "bg-slate-50",
    columnBg: "bg-slate-50/20",
    dotColor: "bg-slate-400",
    badgeBg: "bg-slate-400",
    emptyText: "No leads here",
    emptyIcon: "📋",
  };

  return (
    <div
      className={cn(
        "flex w-[296px] flex-shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm",
        "border-t-4",
        cfg.accent,
        "transition-all duration-200",
        isOver && "ring-2 ring-blue-400 ring-offset-2 shadow-lg scale-[1.005]"
      )}
    >
      {/* ── Sticky column header ── */}
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between px-4 py-3.5 rounded-t-xl",
          cfg.headerBg
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", cfg.dotColor)} />
          <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">{title}</h3>
        </div>
        <span
          className={cn(
            "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5",
            "text-[10px] font-bold text-white tabular-nums",
            cfg.badgeBg
          )}
        >
          {leads.length}
        </span>
      </div>

      {/* ── Card list area ── */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[220px] overflow-y-auto p-3 transition-colors duration-150 rounded-b-2xl",
          cfg.columnBg,
          isOver && "bg-blue-50/60"
        )}
      >
        <SortableContext
          items={leads.map((l) => l._id || l.id || "")}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2.5">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <LeadCard
                  key={lead._id || lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead)}
                />
              ))
            ) : (
              /* ── Per-column empty state ── */
              <div className="flex flex-col items-center justify-center py-12 text-center select-none">
                <span className="text-3xl mb-2.5 opacity-60">{cfg.emptyIcon}</span>
                <p className="text-xs font-semibold text-slate-400">{cfg.emptyText}</p>
                <p className="text-[11px] text-slate-300 mt-0.5">Drag a card here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
