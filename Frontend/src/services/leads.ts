import { api } from "./api";
import { Lead, LeadCreate, GroupedLeads, LeadStatus } from "../types";

export const getLeads = async (): Promise<Lead[]> => {
  const response = await api.get("/leads");
  return response.data;
};

export const getGroupedLeads = async (): Promise<GroupedLeads> => {
  const response = await api.get("/leads/grouped");
  return response.data;
};

export const createLead = async (lead: LeadCreate): Promise<Lead> => {
  const response = await api.post("/leads", lead);
  return response.data;
};

export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead> => {
  const response = await api.patch(`/leads/${id}/status`, { status });
  return response.data;
};

export const assignLead = async (id: string, owner_id: string): Promise<Lead> => {
  const response = await api.patch(`/leads/${id}/assign`, { assigned_to: owner_id });
  return response.data;
};

export const scheduleVisit = async (id: string, visit_date: string): Promise<Lead> => {
  const response = await api.patch(`/leads/${id}/schedule`, { visit_date });
  return response.data;
};

export const updateLeadNotes = async (id: string, notes: string): Promise<Lead> => {
  const response = await api.patch(`/leads/${id}/notes`, { notes });
  return response.data;
};

export const deleteLead = async (id: string): Promise<void> => {
  await api.delete(`/leads/${id}`);
};
