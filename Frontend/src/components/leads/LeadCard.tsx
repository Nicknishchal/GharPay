"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/types";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui";

// ── React Icons ──────────────────────────────────────────────────────────────
import { FiPhone, FiMapPin, FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  onClick: () => void;
}

export default function LeadCard({ lead, isDragging, onClick }: LeadCardProps) {
  const leadId = lead._id || lead.id || "";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: leadId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  const visitDateObj = lead.visit_date ? new Date(lead.visit_date) : null;
  const isVisitToday = visitDateObj ? isToday(visitDateObj) : false;
  const isVisitTomorrow = visitDateObj ? isTomorrow(visitDateObj) : false;
  const isVisitPast = visitDateObj ? isPast(visitDateObj) && !isVisitToday : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        // Base
        "group relative flex cursor-pointer flex-col gap-3 rounded-xl",
        "border border-slate-200/80 bg-white p-4",
        // Elevation system
        "shadow-sm",
        // Hover micro-interaction
        "hover:-translate-y-1 hover:shadow-xl hover:border-slate-300",
        "active:scale-[0.98] active:shadow-md",
        // Transition
        "transition-all duration-200 ease-out",
        // Dragging state
        dragging
          ? "opacity-30 shadow-2xl ring-2 ring-blue-400 scale-[1.03] rotate-[1.5deg] z-50"
          : ""
      )}
    >
      {/* ── Top row: Name + urgency badges ── */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-[13px] leading-snug group-hover:text-blue-600 transition-colors duration-150 truncate">
          {lead.name}
        </h4>
        <div className="flex shrink-0 items-center gap-1">
          {isVisitPast && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white animate-pulse">
              Overdue
            </span>
          )}
          {isVisitToday && !isVisitPast && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Today
            </span>
          )}
          {isVisitTomorrow && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Tomorrow
            </span>
          )}
        </div>
      </div>

      {/* ── Phone ── */}
      <div className="flex items-center gap-1.5">
        <FiPhone className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-500 font-medium tracking-tight">{lead.phone}</span>
      </div>

      {/* ── Meta badges: budget + location ── */}
      {(lead.budget || lead.location) && (
        <div className="flex flex-wrap gap-1.5">
          {lead.budget && (
            <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <RiMoneyRupeeCircleLine className="h-3 w-3" />
              {lead.budget}
            </span>
          )}
          {lead.location && (
            <span className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              <FiMapPin className="h-2.5 w-2.5" />
              {lead.location}
            </span>
          )}
        </div>
      )}

      {/* ── Divider + Footer: Visit date + Assignee ── */}
      {(lead.visit_date || lead.owner) && (
        <>
          <div className="h-px w-full bg-slate-100" />
          <div className="flex items-center justify-between gap-2">
            {lead.visit_date ? (
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px] font-semibold",
                  isVisitPast
                    ? "text-red-500"
                    : isVisitToday
                    ? "text-red-500"
                    : "text-blue-600"
                )}
              >
                <FiCalendar className="h-3 w-3 shrink-0" />
                {format(new Date(lead.visit_date), "MMM d, h:mm a")}
              </span>
            ) : (
              <span />
            )}
            {lead.owner ? (
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <Avatar name={lead.owner.name} size="xs" />
                <span className="text-[11px] text-slate-500 font-medium max-w-[80px] truncate">
                  {lead.owner.name}
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-slate-300 ml-auto shrink-0">
                <FiUser className="h-3 w-3" />
                Unassigned
              </span>
            )}
          </div>
        </>
      )}

      {/* ── Bottom hover gradient bar ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-b-xl bg-gradient-to-r from-blue-400 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
