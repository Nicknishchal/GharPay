"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLead } from "@/services/leads";
import { LeadCreate } from "@/types";
import toast from "react-hot-toast";
import { FiX, FiUser, FiPhone, FiMapPin, FiPlus, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import ModalPortal from "@/components/ui/ModalPortal";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import { cn } from "@/utils/cn";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Validation rules ──────────────────────────────────────────────────────────
const NAME_REGEX = /^[A-Za-z\s]{2,50}$/;

type FieldName = "name" | "phone" | "budget" | "location";

function validateField(field: FieldName, value: string): string {
  switch (field) {
    case "name":
      if (!value.trim()) return "Full name is required.";
      if (!NAME_REGEX.test(value.trim())) return "Enter a valid name (letters only, 2–50 chars).";
      return "";

    case "phone":
      if (!value) return "Phone number is required.";
      if (value.length < 10) return "Phone number must be exactly 10 digits.";
      return "";

    case "budget":
      if (!value.trim()) return "Budget is required.";
      const num = Number(value);
      if (isNaN(num) || !isFinite(num) || num <= 100)
        return "Enter a valid budget (must be > 100).";
      return "";

    case "location":
      if (!value.trim()) return "Location is required.";
      if (value.trim().length < 2) return "Enter a valid location (min 2 chars).";
      return "";

    default:
      return "";
  }
}

// ─── Sanitisers ────────────────────────────────────────────────────────────────
/** Allow letters and spaces only; strip everything else in real-time */
function sanitizeName(raw: string): string {
  return raw.replace(/[^A-Za-z\s]/g, "");
}

/** Strip non-digits and cap at 10 characters */
function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

// ─── FormField component ───────────────────────────────────────────────────────
interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
  icon: React.ElementType;
  error: string;
  touched: boolean;
  /** Show green checkmark when field is valid and touched */
  showSuccess?: boolean;
}

function FormField({
  id,
  label,
  required,
  type = "text",
  inputMode,
  maxLength,
  value,
  onChange,
  onBlur,
  placeholder,
  icon: Icon,
  error,
  touched,
  showSuccess = true,
}: FormFieldProps) {
  const hasError   = touched && !!error;
  const hasSuccess = touched && !error && value.length > 0 && showSuccess;

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase tracking-widest text-slate-400"
      >
        {label}{" "}
        {required && <span className="text-red-400 normal-case tracking-normal">*</span>}
      </label>

      {/* Input row */}
      <div className="relative">
        {/* Left icon */}
        <Icon
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-150",
            hasError   ? "text-red-400"    :
            hasSuccess ? "text-emerald-500" :
                         "text-slate-400"
          )}
        />

        <input
          type={type}
          id={id}
          inputMode={inputMode}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "block w-full rounded-xl border bg-slate-50 pl-10 py-2.5 text-sm text-slate-900",
            "placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2",
            "transition-all duration-150",
            // right padding: room for status icon
            hasError || hasSuccess ? "pr-9" : "pr-4",
            // border + ring
            hasError
              ? "border-red-400   focus:border-red-400   focus:ring-red-400/20"
              : hasSuccess
              ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20"
              : "border-slate-200  focus:border-blue-400  focus:ring-blue-400/20"
          )}
        />

        {/* Right-side status icon */}
        {hasError && (
          <FiAlertCircle className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
        )}
        {hasSuccess && (
          <FiCheckCircle className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
        )}
      </div>

      {/* Inline error — smooth height transition */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          hasError ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="flex items-center gap-1 pt-0.5 text-xs font-medium text-red-500">
            <FiAlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Character counter for phone ───────────────────────────────────────────────
function PhoneCounter({ length }: { length: number }) {
  return (
    <span
      className={cn(
        "ml-auto text-[10px] font-semibold tabular-nums transition-colors",
        length === 10 ? "text-emerald-500" : length > 0 ? "text-amber-500" : "text-slate-300"
      )}
    >
      {length}/10
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
const EMPTY_TOUCHED: Record<FieldName, boolean> = { name: false, phone: false, budget: false, location: false };

export default function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const queryClient = useQueryClient();

  // Values
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [budget,   setBudget]   = useState("");
  const [location, setLocation] = useState("");

  // Touch state — drives when to show errors
  const [touched, setTouched] = useState<Record<FieldName, boolean>>(EMPTY_TOUCHED);

  const touch    = (f: FieldName) => setTouched((p) => ({ ...p, [f]: true }));
  const touchAll = ()             => setTouched({ name: true, phone: true, budget: true, location: true });

  // Derived errors (always re-computed — never stale)
  const errors: Record<FieldName, string> = {
    name:     validateField("name",     name),
    phone:    validateField("phone",    phone),
    budget:   validateField("budget",   budget),
    location: validateField("location", location),
  };

  // Form is valid when all fields have no error
  const isFormValid = !errors.name && !errors.phone && !errors.budget && !errors.location;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNameChange = (raw: string) => {
    const sanitized = sanitizeName(raw);
    setName(sanitized);
    // Re-validate immediately after user types to remove error as soon as fixed
    if (touched.name) setTouched((p) => ({ ...p, name: true }));
  };

  const handlePhoneChange = (raw: string) => {
    const sanitized = sanitizePhone(raw);
    setPhone(sanitized);
    if (touched.phone) setTouched((p) => ({ ...p, phone: true }));
  };

  const handleBudgetChange = (raw: string) => {
    // Allow only digits and single decimal point
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setBudget(cleaned);
    if (touched.budget) setTouched((p) => ({ ...p, budget: true }));
  };

  const handleLocationChange = (raw: string) => {
    setLocation(raw);
    if (touched.location) setTouched((p) => ({ ...p, location: true }));
  };

  const handleClose = useCallback(() => {
    setName(""); setPhone(""); setBudget(""); setLocation("");
    setTouched(EMPTY_TOUCHED);
    onClose();
  }, [onClose]);

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (lead: LeadCreate) => createLead(lead),
    onError:    () => toast.error("Failed to create lead. Please try again."),
    onSuccess:  () => {
      toast.success("Lead created successfully");
      queryClient.invalidateQueries({ queryKey: ["groupedLeads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      handleClose();
    },
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    touchAll();
    if (!isFormValid) return; // guard — never fires if invalid
    createMutation.mutate({
      name:     name.trim(),
      phone:    phone.trim(),
      budget:   budget   || undefined,
      location: location || undefined,
    });
  };

  if (!isOpen) return null;

  const isSubmitting = createMutation.isPending;
  // Button is disabled when form is invalid OR while submitting
  const isButtonDisabled = !isFormValid || isSubmitting;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 fade-in">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl shadow-slate-900/20 overflow-hidden scale-in">

          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/30">
                <FiPlus className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Add New Lead</h2>
                <p className="text-[11px] text-slate-400">Fill in the contact details below</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 hover:scale-110 active:scale-95 transition-all"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">

            {/* Name */}
            <FormField
              id="name"
              label="Full Name"
              required
              value={name}
              onChange={handleNameChange}
              onBlur={() => touch("name")}
              placeholder="e.g. Rahul Sharma"
              icon={FiUser}
              error={errors.name}
              touched={touched.name}
            />

            {/* Phone */}
            <div className="space-y-1.5">
              {/* Label row with counter */}
              <div className="flex items-center">
                <label
                  htmlFor="phone"
                  className="block text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  Phone Number{" "}
                  <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <PhoneCounter length={phone.length} />
              </div>
              {/* Reuse FormField but render label manually above */}
              <div className="space-y-1.5">
                {/* Input with inline error */}
                {(() => {
                  const hasError   = touched.phone && !!errors.phone;
                  const hasSuccess = touched.phone && !errors.phone && phone.length === 10;
                  return (
                    <>
                      <div className="relative">
                        <FiPhone
                          className={cn(
                            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-150",
                            hasError   ? "text-red-400"    :
                            hasSuccess ? "text-emerald-500" :
                                         "text-slate-400"
                          )}
                        />
                        <input
                          type="tel"
                          id="phone"
                          inputMode="numeric"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          onBlur={() => touch("phone")}
                          placeholder="e.g. 9876543210"
                          autoComplete="off"
                          className={cn(
                            "block w-full rounded-xl border bg-slate-50 pl-10 py-2.5 text-sm text-slate-900",
                            "placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2",
                            "transition-all duration-150 tracking-wider",
                            hasError || hasSuccess ? "pr-9" : "pr-4",
                            hasError
                              ? "border-red-400   focus:border-red-400   focus:ring-red-400/20"
                              : hasSuccess
                              ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20"
                              : "border-slate-200  focus:border-blue-400  focus:ring-blue-400/20"
                          )}
                        />
                        {hasError   && <FiAlertCircle  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />}
                        {hasSuccess && <FiCheckCircle  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />}
                      </div>
                      <div className={cn("grid transition-all duration-200 ease-in-out", hasError ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                        <div className="overflow-hidden">
                          <p className="flex items-center gap-1 pt-0.5 text-xs font-medium text-red-500">
                            <FiAlertCircle className="h-3 w-3 shrink-0" />
                            {errors.phone}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Budget + Location row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                id="budget"
                label="Budget"
                type="text"
                inputMode="decimal"
                value={budget}
                onChange={handleBudgetChange}
                onBlur={() => touch("budget")}
                placeholder="e.g. 500000"
                icon={RiMoneyRupeeCircleLine}
                error={errors.budget}
                touched={touched.budget}
                showSuccess={false}
              />

              {/* Location — required */}
              <FormField
                id="location"
                label="Location"
                required
                value={location}
                onChange={handleLocationChange}
                onBlur={() => touch("location")}
                placeholder="e.g. Sector 21"
                icon={FiMapPin}
                error={errors.location}
                touched={touched.location}
                showSuccess={false}
              />
            </div>

            {/* ── Validation summary hint ── */}
            {touched.name && touched.phone && !isFormValid && (
              <p className="text-[11px] text-slate-400 text-center pt-1">
                Please fix the errors above to continue.
              </p>
            )}

            {/* ── Action buttons ── */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isButtonDisabled}
                title={
                  !isFormValid && !isSubmitting
                    ? "Fill in all required fields correctly"
                    : undefined
                }
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5",
                  "text-sm font-semibold transition-all duration-150",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
                  isButtonDisabled
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.02] hover:shadow-md hover:shadow-blue-500/30 active:scale-[0.98]"
                )}
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path  className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating…
                  </>
                ) : (
                  <>
                    <FiPlus className="h-4 w-4" />
                    Create Lead
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
