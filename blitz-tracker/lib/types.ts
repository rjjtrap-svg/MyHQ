export type Outcome = "sale" | "not_home" | "not_interested" | "callback" | "other";

export interface Deal {
  id: number;
  created_at: string;
  deal_time: string;
  outcome: Outcome;
  rep_name: string;
  address: string;
  customer_name: string | null;
  customer_phone: string | null;
  plan_sold: string | null;
  install_date: string | null;
  notes: string | null;
}

export const OUTCOME_LABELS: Record<Outcome, string> = {
  sale: "Sale",
  not_home: "Not Home",
  not_interested: "Not Interested",
  callback: "Callback",
  other: "Other",
};
