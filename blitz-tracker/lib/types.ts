export type Status = "submitted" | "paid";

export interface PaySubmission {
  id: number;
  created_at: string;
  customer_name: string | null;
  address: string | null;
  plan_sold: string | null;
  install_date: string | null;
  pay_amount: number;
  status: Status;
  paid_date: string | null;
  screenshot_url: string | null;
  notes: string | null;
}

export const STATUS_LABELS: Record<Status, string> = {
  submitted: "Submitted",
  paid: "Paid",
};
