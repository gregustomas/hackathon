export interface Account {
  id: string;
  account_number: string;
  balance: number;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  status: "active" | "blocked";
  role: "CLIENT" | "BANKER";
  accounts: Account[];
}
