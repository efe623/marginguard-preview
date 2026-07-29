import type {
  ChangeOrder,
  Client,
  Project,
  ScopeItem
} from "@/types/domain";

export const clients: Client[] = [
  {
    id: "spark-retail",
    name: "Spark Retail",
    location: "Dubai, UAE",
    email: "contact@sparkretail.example",
    phone: "+971 50 555 0194",
    notes: "Prefers concise approvals by email. Finance contact: Maya."
  },
  {
    id: "nomad-cafe",
    name: "Nomad Cafe",
    location: "Abu Dhabi, UAE",
    email: "hello@nomadcafe.example",
    phone: "+971 50 555 0162",
    notes: "Weekly project update every Thursday."
  },
  {
    id: "al-zamil",
    name: "Al-Zamil Studio",
    location: "Sharjah, UAE",
    email: "studio@alzamil.example",
    phone: "+971 50 555 0127",
    notes: "Owner approves all price changes."
  }
];

export const projects: Project[] = [
  {
    id: "ecommerce-redesign",
    code: "PRJ-026-091",
    name: "E-commerce Redesign",
    clientId: "spark-retail",
    clientName: "Spark Retail",
    currency: "AED",
    quoteMinor: 8500000,
    approvedExtrasMinor: 250000,
    status: "awaiting_deposit",
    revisionUsed: 3,
    revisionLimit: 3,
    updatedAt: "2026-07-29T08:42:00.000Z"
  },
  {
    id: "villa-renderings",
    code: "PRJ-026-089",
    name: "Luxury Villa Renderings",
    clientId: "al-zamil",
    clientName: "Al-Zamil Studio",
    currency: "AED",
    quoteMinor: 4500000,
    approvedExtrasMinor: 0,
    status: "active",
    revisionUsed: 1,
    revisionLimit: 2,
    updatedAt: "2026-07-28T12:00:00.000Z"
  },
  {
    id: "brand-package",
    code: "PRJ-026-102",
    name: "Branding Package",
    clientId: "nomad-cafe",
    clientName: "Nomad Cafe",
    currency: "AED",
    quoteMinor: 1500000,
    approvedExtrasMinor: 175000,
    status: "authorized",
    revisionUsed: 2,
    revisionLimit: 2,
    updatedAt: "2026-07-27T10:15:00.000Z"
  }
];

export const scopeItems: ScopeItem[] = [
  {
    id: "scope-1",
    kind: "deliverable",
    title: "Five core landing pages",
    description: "Home, About, Contact, FAQ, and Journal index."
  },
  {
    id: "scope-2",
    kind: "deliverable",
    title: "Standard checkout flow",
    description: "Cart, shipping, billing, and confirmation using Stripe."
  },
  {
    id: "scope-3",
    kind: "deliverable",
    title: "Responsive desktop and tablet layouts",
    description: "Agreed layouts from 768px and above."
  },
  {
    id: "scope-4",
    kind: "exclusion",
    title: "Arabic localization",
    description: "RTL layout and translation services are not included."
  },
  {
    id: "scope-5",
    kind: "exclusion",
    title: "Multi-currency checkout",
    description: "The original quote covers AED checkout only."
  }
];

export const changeOrders: ChangeOrder[] = [
  {
    id: "co-004",
    number: "CO-004",
    projectId: "ecommerce-redesign",
    title: "Arabic localization",
    reason: "Client request",
    amountMinor: 250000,
    currency: "AED",
    depositBasisPoints: 5000,
    timelineImpact: "+2 weeks",
    status: "approved",
    evidenceAttached: false,
    createdAt: "2026-07-29T08:42:00.000Z"
  },
  {
    id: "co-003",
    number: "CO-003",
    projectId: "ecommerce-redesign",
    title: "Additional product photography",
    reason: "Scope expansion",
    amountMinor: 180000,
    currency: "AED",
    depositBasisPoints: 10000,
    timelineImpact: "+4 days",
    status: "paid",
    evidenceAttached: true,
    createdAt: "2026-07-17T12:30:00.000Z"
  }
];
