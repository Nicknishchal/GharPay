"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupedLeads, updateLeadStatus } from "@/services/leads";
import { LeadStatus } from "@/types";
import { useState, useMemo } from "react";
import KanbanColumn from "@/components/leads/KanbanColumn";
import AddLeadModal from "@/components/leads/AddLeadModal";
import LeadDetailModal from "@/components/leads/LeadDetailModal";
import { Lead } from "@/types";
import toast from "react-hot-toast";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import LeadCard from "@/components/leads/LeadCard";
import { FiPlus } from "react-icons/fi";
import { MdOutlineSpaceDashboard } from "react-icons/md";

const COLUMNS = [
  { id: "NEW", title: "New" },
  { id: "CONTACTED", title: "Contacted" },
  { id: "VISIT_SCHEDULED", title: "Visit Scheduled" },
  { id: "CLOSED", title: "Closed" },
];

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className="flex w-[296px] flex-shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm border-t-4 border-t-slate-200"
        >
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full skeleton" />
              <div className="h-4 w-20 skeleton rounded" />
            </div>
            <div className="h-5 w-5 skeleton rounded-full" />
          </div>
          <div className="flex flex-col gap-2.5 p-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl skeleton" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function KanbanBoard() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: groupedLeads, isLoading } = useQuery({
    queryKey: ["groupedLeads"],
    queryFn: getGroupedLeads,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateLeadStatus(id, status as LeadStatus),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["groupedLeads"] });
      const previousLeads = queryClient.getQueryData<Record<string, Lead[]>>(["groupedLeads"]);

      if (previousLeads) {
        const updatedLeads = { ...previousLeads };
        let foundLead: Lead | null = null;

        for (const col of COLUMNS) {
          if (updatedLeads[col.id]) {
            const index = updatedLeads[col.id].findIndex((l) => (l._id || l.id) === id);
            if (index !== -1) {
              foundLead = updatedLeads[col.id][index];
              updatedLeads[col.id] = [
                ...updatedLeads[col.id].slice(0, index),
                ...updatedLeads[col.id].slice(index + 1),
              ];
              break;
            }
          }
        }

        if (foundLead) {
          foundLead = { ...foundLead, status: status as LeadStatus };
          if (!updatedLeads[status]) updatedLeads[status] = [];
          updatedLeads[status] = [...updatedLeads[status], foundLead];
          queryClient.setQueryData(["groupedLeads"], updatedLeads);
        }
      }
      return { previousLeads };
    },
    onError: (err, variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(["groupedLeads"], context.previousLeads);
      }
      toast.error("Failed to update status.");
    },
    onSuccess: () => {
      toast.success("Lead moved successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedLeads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });

  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const leadsArray = useMemo(() => {
    if (!groupedLeads) return [];
    return Object.values(groupedLeads).flat();
  }, [groupedLeads]);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leadsArray.find((l) => (l._id || l.id) === active.id);
    if (lead) setActiveLead(lead);
  };

  const onDragOver = (event: DragOverEvent) => {};

  const onDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let newStatus: string | null = null;
    const column = COLUMNS.find((c) => c.id === overId);
    if (column) {
      newStatus = column.id;
    } else {
      const overLead = leadsArray.find((l) => (l._id || l.id) === overId);
      if (overLead) newStatus = overLead.status;
    }

    const draggedLead = leadsArray.find((l) => (l._id || l.id) === activeId);
    if (draggedLead && newStatus && draggedLead.status !== newStatus) {
      updateStatusMutation.mutate({ id: draggedLead._id || draggedLead.id, status: newStatus });
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-6">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <div className="h-7 w-44 skeleton rounded-lg mb-2" />
            <div className="h-4 w-64 skeleton rounded-md" />
          </div>
          <div className="h-10 w-36 skeleton rounded-xl" />
        </div>
        <KanbanSkeleton />
      </div>
    );
  }

  const data = groupedLeads as any;
  const leadsByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = data?.[col.id] || [];
    return acc;
  }, {} as Record<string, Lead[]>);

  const totalLeads = leadsArray.length;

  return (
    <div className="flex h-full flex-col gap-6 max-w-full">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leads Pipeline</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {totalLeads === 0
              ? "No leads yet — add your first one"
              : `${totalLeads} lead${totalLeads !== 1 ? "s" : ""} across ${COLUMNS.length} stages`}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={[
            "flex items-center gap-2 rounded-xl px-4 py-2.5",
            "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
            "text-sm font-semibold shadow-sm shadow-blue-500/30",
            "hover:from-blue-500 hover:to-indigo-500 hover:shadow-md hover:shadow-blue-500/30",
            "hover:scale-[1.03] active:scale-[0.97]",
            "transition-all duration-150",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
          ].join(" ")}
        >
          <FiPlus className="h-4 w-4" />
          Add Lead
        </button>
      </div>

      {/* ── Board ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        {totalLeads === 0 ? (
          /* ── Global empty state ── */
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center animate-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 mb-4 shadow-inner">
              <MdOutlineSpaceDashboard className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Your pipeline is empty</h3>
            <p className="mt-1.5 text-sm text-slate-500 max-w-xs">
              Start by adding your first lead. It will appear in the <strong>New</strong> column.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 hover:scale-105 active:scale-95 transition-all"
            >
              <FiPlus className="h-4 w-4" />
              Add Your First Lead
            </button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                leads={leadsByColumn[col.id]}
                onLeadClick={(lead: Lead) => setSelectedLead(lead)}
              />
            ))}
          </div>
        )}

        {/* ── Drag overlay: ghost card ── */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeLead ? (
            <div className="rotate-2 scale-105 opacity-95">
              <LeadCard lead={activeLead} isDragging onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Modals ── */}
      <AddLeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {selectedLead &&
        (() => {
          const currentLead =
            leadsArray.find((l) => (l._id || l.id) === (selectedLead._id || selectedLead.id)) ||
            selectedLead;
          return (
            <LeadDetailModal
              lead={currentLead}
              isOpen={!!selectedLead}
              onClose={() => setSelectedLead(null)}
            />
          );
        })()}
    </div>
  );
}
