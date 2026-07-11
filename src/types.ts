export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  item: string;
  amount: number;
  quantity: number;
  region: string;
  source: string; // e.g. "Shopify", "Amazon", "Stripe", "POS"
  type: 'sale' | 'return';
}

export interface ReportSource {
  id: string;
  name: string;
  channel: string;
  recordCount: number;
  addedAt: string;
  status: 'processed' | 'failed';
  errorMessage?: string;
}

export interface ReconciledData {
  transactions: Transaction[];
  sources: ReportSource[];
}
