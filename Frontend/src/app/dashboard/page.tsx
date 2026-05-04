"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/dashboard";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { Avatar, StatusBadge } from "@/components/ui";
import Link from "next/link";

// React Icons
import {
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiCalendar,
  FiPhone,
  FiArrowRight,
  FiBarChart2,
} from "react-icons/fi";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in">
      <div>
        <div className="h-7 w-44 skeleton rounded-lg mb-2" />
        <div className="h-4 w-60 skeleton rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl skeleton" />
        ))}
      </div>
      <div className="h-72 rounded-2xl skeleton" />
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  iconGradient: string;
  textColor: string;
}

function MetricCard({ label, value, icon: Icon, gradient, iconGradient, textColor }: MetricCardProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl p-5 border border-white/70",
        "shadow-sm hover:shadow-xl hover:-translate-y-1",
        "transition-all duration-200 cursor-default",
        gradient,
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <p className={`text-4xl font-black tabular-nums tracking-tight ${textColor}`}>{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconGradient} shadow-lg`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Decorative circle */}
      <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full opacity-[0.08] blur-xl bg-black" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  useEffect(() => {
    if (error) toast.error("Failed to load dashboard data.");
  }, [error]);

  if (isLoading) return <DashboardSkeleton />;

  const metricCards: MetricCardProps[] = [
    {
      label: "Total Leads",
      value: stats?.total_leads ?? 0,
      icon: FiUsers,
      gradient: "bg-gradient-to-br from-blue-50 to-indigo-100",
      iconGradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
      textColor: "text-blue-900",
    },
    {
      label: "New Leads",
      value: stats?.leads_by_status?.["NEW"] ?? 0,
      icon: FiTrendingUp,
      gradient: "bg-gradient-to-br from-violet-50 to-purple-100",
      iconGradient: "bg-gradient-to-br from-violet-500 to-purple-600",
      textColor: "text-violet-900",
    },
    {
      label: "Visit Scheduled",
      value: stats?.leads_by_status?.["VISIT_SCHEDULED"] ?? 0,
      icon: FiClock,
      gradient: "bg-gradient-to-br from-amber-50 to-orange-100",
      iconGradient: "bg-gradient-to-br from-amber-500 to-orange-500",
      textColor: "text-amber-900",
    },
    {
      label: "Closed",
      value: stats?.leads_by_status?.["CLOSED"] ?? 0,
      icon: FiCheckCircle,
      gradient: "bg-gradient-to-br from-emerald-50 to-teal-100",
      iconGradient: "bg-gradient-to-br from-emerald-500 to-teal-500",
      textColor: "text-emerald-900",
    },
  ];

  const hasVisits = (stats?.upcoming_visits?.length ?? 0) > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-500">Your lead pipeline at a glance</p>
        </div>
        <Link
          href="/leads"
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:gap-2.5 transition-all duration-150"
        >
          View Pipeline <FiArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Upcoming Visits ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
              <FiCalendar className="h-4 w-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Visits</h3>
          </div>
          {hasVisits && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white tabular-nums">
              {stats!.upcoming_visits.length}
            </span>
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {hasVisits ? (
            stats!.upcoming_visits.map((lead) => (
              <div
                key={lead._id || lead.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors duration-100 group"
              >
                <Avatar name={lead.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {lead.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FiPhone className="h-3 w-3" />
                      {lead.phone}
                    </span>
                    {lead.visit_date && (
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <FiCalendar className="h-3 w-3" />
                        {format(new Date(lead.visit_date), "MMM d, yyyy · h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={lead.status} />
                </div>
              </div>
            ))
          ) : (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 mb-3 shadow-inner">
                <FiCalendar className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No upcoming visits</p>
              <p className="mt-1 text-xs text-slate-400">Schedule a visit on any lead to see it here.</p>
              <Link
                href="/leads"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Go to Pipeline <FiArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
