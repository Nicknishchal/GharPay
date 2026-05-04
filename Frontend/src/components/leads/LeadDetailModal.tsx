"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateLeadStatus,
  assignLead,
  scheduleVisit,
  updateLeadNotes,
  deleteLead,
} from "@/services/leads";
import { getUsers, createUser } from "@/services/users";
import { Lead, LeadStatus, User } from "@/types";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { Avatar, StatusBadge } from "@/components/ui";
import ModalPortal from "@/components/ui/ModalPortal";

// React Icons
import {
  FiX,
  FiTrash2,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiAlertTriangle,
  FiSave,
  FiChevronDown,
  FiUserPlus,
  FiUser,
} from "react-icons/fi";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";

interface LeadDetailModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: LeadStatus[] = ["NEW", "CONTACTED", "VISIT_SCHEDULED", "CLOSED"];
const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  VISIT_SCHEDULED: "Visit Scheduled",
  CLOSED: "Closed",
};

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
      {children}
    </p>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  children,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 shrink-0 mt-0.5 group-hover:bg-slate-200 transition-colors">
        <Icon className={cn("h-3.5 w-3.5", highlight ? "text-amber-500" : "text-slate-400")} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <div className={cn("text-sm font-medium mt-0.5", highlight ? "text-amber-700" : "text-slate-800")}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Styled select ────────────────────────────────────────────────────────────
function StyledSelect({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={[
          "block w-full appearance-none rounded-xl border border-slate-200 bg-slate-50",
          "px-3 py-2.5 pr-8 text-sm font-medium text-slate-800",
          "focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "transition-all duration-150",
        ].join(" ")}
      >
        {children}
      </select>
      <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
    </div>
  );
}

export default function LeadDetailModal({ lead, isOpen, onClose }: LeadDetailModalProps) {
  const queryClient = useQueryClient();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(lead.notes || "");
  const [visitDate, setVisitDate] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: "", email: "" });

  useEffect(() => {
    setNotes(lead.notes || "");
    setVisitDate(lead.visit_date ? new Date(lead.visit_date).toISOString().slice(0, 16) : "");
  }, [lead.notes, lead.visit_date]);

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["groupedLeads"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: LeadStatus) => updateLeadStatus((lead._id || lead.id) as string, status),
    onSuccess: () => { invalidate(); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  const assignMutation = useMutation({
    mutationFn: (owner_id: string) => {
      console.log("Assign payload:", { leadId: lead._id || lead.id, assigned_to: owner_id });
      return assignLead((lead._id || lead.id) as string, owner_id);
    },
    onSuccess: () => { invalidate(); toast.success("Assignee updated"); },
    onError: () => toast.error("Failed to update assignee"),
  });

  const scheduleMutation = useMutation({
    mutationFn: (date: string) =>
      scheduleVisit((lead._id || lead.id) as string, new Date(date).toISOString()),
    onSuccess: () => { invalidate(); toast.success("Visit scheduled"); },
    onError: () => toast.error("Failed to schedule visit"),
  });

  const notesMutation = useMutation({
    mutationFn: (n: string) => updateLeadNotes((lead._id || lead.id) as string, n),
    onSuccess: () => { invalidate(); setIsEditingNotes(false); toast.success("Notes saved"); },
    onError: () => toast.error("Failed to save notes"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead((lead._id || lead.id) as string),
    onSuccess: () => { invalidate(); onClose(); toast.success("Lead deleted"); },
    onError: () => toast.error("Failed to delete lead"),
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      queryClient.setQueryData(["users"], (old: User[] | undefined) =>
        old ? [...old, newUser] : [newUser]
      );
      // @ts-ignore
      const userId = newUser._id || newUser.id;
      assignMutation.mutate(userId);
      setIsAddingUser(false);
      setNewUserData({ name: "", email: "" });
      toast.success("User created and assigned");
    },
    onError: () => toast.error("Failed to create user"),
  });

  if (!isOpen) return null;

  return (
    <>
    <ModalPortal>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh] scale-in">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <Avatar name={lead.name} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{lead.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={lead.status} />
                {lead.location && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <FiMapPin className="h-3 w-3" /> {lead.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 hover:scale-110 active:scale-95 transition-all"
              title="Delete Lead"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 hover:scale-110 active:scale-95 transition-all"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Delete confirm ── */}
        {isConfirmingDelete && (
          <div className="bg-red-50 border-b border-red-100 px-6 py-3.5 flex items-center justify-between slide-up">
            <div className="flex items-center gap-2.5 text-red-700">
              <FiAlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">Permanently delete this lead?</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">

          {/* Grid: Contact + Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

            {/* Left: Contact info */}
            <div className="px-6 py-5 space-y-4">
              <SectionLabel>Contact Information</SectionLabel>
              <div className="space-y-4">
                <InfoRow icon={FiPhone} label="Phone">
                  <a href={`tel:${lead.phone}`} className="hover:text-blue-600 transition-colors">
                    {lead.phone}
                  </a>
                </InfoRow>
                {lead.location && (
                  <InfoRow icon={FiMapPin} label="Location">{lead.location}</InfoRow>
                )}
                {lead.budget && (
                  <InfoRow icon={RiMoneyRupeeCircleLine} label="Budget">{lead.budget}</InfoRow>
                )}
                {lead.visit_date && (
                  <InfoRow icon={FiCalendar} label="Scheduled Visit" highlight>
                    {format(new Date(lead.visit_date), "MMM d, yyyy · h:mm a")}
                  </InfoRow>
                )}
              </div>
            </div>

            {/* Right: Management */}
            <div className="px-6 py-5 space-y-4">
              <SectionLabel>Management</SectionLabel>
              <div className="space-y-4">

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Status
                  </label>
                  <StyledSelect
                    value={lead.status}
                    onChange={(v) => statusMutation.mutate(v as LeadStatus)}
                    disabled={statusMutation.isPending}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </StyledSelect>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Assignee
                  </label>
                  {lead.owner && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Avatar name={lead.owner.name} size="xs" />
                      <span className="text-xs font-semibold text-slate-600">{lead.owner.name}</span>
                    </div>
                  )}
                  <StyledSelect
                    value={lead.assigned_to || ""}
                    onChange={(v) => {
                      if (v === "ADD_NEW") setIsAddingUser(true);
                      else assignMutation.mutate(v);
                    }}
                    disabled={assignMutation.isPending || isLoadingUsers}
                  >
                    <option value="">{isLoadingUsers ? "Loading users…" : "— Unassigned —"}</option>
                    {users?.map((user) => (
                      <option key={user._id || user.id} value={user._id || user.id}>
                        {user.name}
                      </option>
                    ))}
                    <option value="ADD_NEW">+ Add New User</option>
                  </StyledSelect>
                </div>

                {/* Schedule visit */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Schedule Visit
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      onClick={(e) => (e.currentTarget as any).showPicker?.()}
                      className="block flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 cursor-pointer transition-all"
                    />
                    <button
                      onClick={() => { if (visitDate) scheduleMutation.mutate(visitDate); }}
                      disabled={!visitDate || scheduleMutation.isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                    >
                      <FiSave className="h-3.5 w-3.5" />
                      {scheduleMutation.isPending ? "…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Notes</SectionLabel>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:scale-105 active:scale-95 transition-all"
                >
                  <FiEdit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 resize-none transition-all"
                  placeholder="Add notes about this lead…"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setNotes(lead.notes || ""); setIsEditingNotes(false); }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => notesMutation.mutate(notes)}
                    disabled={notesMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    <FiSave className="h-3 w-3" />
                    {notesMutation.isPending ? "Saving…" : "Save Notes"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "min-h-[80px] rounded-xl bg-slate-50 px-4 py-3.5 text-sm leading-relaxed",
                  lead.notes ? "text-slate-700" : "text-slate-400 italic"
                )}
              >
                {lead.notes || "No notes added yet. Click Edit to add notes."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>

      {/* ── Add User sub-modal (own portal) ── */}
      {isAddingUser && (
        <ModalPortal>
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl shadow-slate-900/20 p-6 space-y-5 scale-in">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm shadow-violet-500/30">
                <FiUserPlus className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New User</h3>
                <p className="text-[11px] text-slate-400">They will be assigned this lead</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all"
                    placeholder="e.g. Priya Mehta"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all"
                  placeholder="e.g. priya@gharpay.in"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsAddingUser(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newUserData.name && newUserData.email) createUserMutation.mutate(newUserData);
                  else toast.error("Please fill in all fields");
                }}
                disabled={createUserMutation.isPending}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-2.5 text-sm font-bold text-white hover:from-violet-500 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {createUserMutation.isPending ? "Creating…" : "Create & Assign"}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
}
