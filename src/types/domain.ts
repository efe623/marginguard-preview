export type ProjectStatus =
  | "active"
  | "awaiting_approval"
  | "awaiting_deposit"
  | "authorized"
  | "completed";

export type Project = {
  id: string;
  code: string;
  name: string;
  clientId: string;
  clientName: string;
  currency: string;
  quoteMinor: number;
  approvedExtrasMinor: number;
  status: ProjectStatus;
  revisionUsed: number;
  revisionLimit: number;
  updatedAt: string;
};

export type Client = {
  id: string;
  name: string;
  location: string;
  email: string;
  phone: string;
  notes: string;
};

export type ScopeItem = {
  id: string;
  kind: "deliverable" | "exclusion";
  title: string;
  description: string;
};

export type ChangeOrder = {
  id: string;
  number: string;
  projectId: string;
  title: string;
  reason: string;
  amountMinor: number;
  currency: string;
  depositBasisPoints: number;
  timelineImpact: string;
  status: "draft" | "sent" | "approved" | "deposit_paid" | "paid";
  evidenceAttached: boolean;
  createdAt: string;
};
