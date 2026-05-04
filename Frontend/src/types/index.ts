export type LeadStatus = "NEW" | "CONTACTED" | "VISIT_SCHEDULED" | "CLOSED";

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
}

export interface Lead {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  budget?: string;
  location?: string;
  status: LeadStatus;
  notes?: string;
  assigned_to?: string;
  owner?: User;
  visit_date?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LeadCreate {
  name: string;
  phone: string;
  budget?: string;
  location?: string;
}

export interface DashboardStats {
  total_leads: number;
  leads_by_status: Record<string, number>;
  upcoming_visits: Lead[];
}

export type GroupedLeads = Record<LeadStatus, Lead[]>;
