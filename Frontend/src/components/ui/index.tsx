// Reusable Design System Primitives
// Badge, Avatar, StatusBadge - keep components here for reuse

import { cn } from "@/utils/cn";
import { LeadStatus } from "@/types";

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700 ring-slate-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    danger:  "bg-red-50 text-red-700 ring-red-200",
    info:    "bg-blue-50 text-blue-700 ring-blue-200",
    muted:   "bg-slate-50 text-slate-500 ring-slate-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<LeadStatus, { label: string; variant: BadgeProps["variant"] }> = {
  NEW:             { label: "New",            variant: "info" },
  CONTACTED:       { label: "Contacted",      variant: "default" },
  VISIT_SCHEDULED: { label: "Visit Scheduled", variant: "warning" },
  CLOSED:          { label: "Closed",         variant: "success" },
};

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "muted" };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-rose-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({ name, size = "sm", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClasses = {
    xs: "h-5 w-5 text-[9px]",
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        getAvatarColor(name),
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
