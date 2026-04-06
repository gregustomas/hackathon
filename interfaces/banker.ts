export interface Account {
  id: string; 
  account_number: string;
  balance?: number;
  created_at?: string;
  updated_at?: string;
  daily_limit?: number;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  accounts: Account[];
}

export interface LoanProfile {
  first_name: string;
  last_name: string;
}

export interface LoanAccount {
  id?: string;
  account_number: string;
}

export interface PendingLoan {
  id: string;
  amount: number;
  purpose: string;
  status: string; 
  created_at: string;
  months_to_pay: number;
  interest_rate: number;
  monthly_payment: number;
  next_payment_date: Date | string;
  remaining_amount: number;
  profiles: LoanProfile | null;
  accounts: LoanAccount | null;
}

export interface CardUnblockRequestProfile {
  first_name: string;
  last_name: string;
}

export interface CardUnblockRequestCard {
  id: string;
  card_number: string;
}

export interface CardUnblockRequest {
  id: string;
  status: string;
  created_at: string;
  profiles: CardUnblockRequestProfile | null;
  accounts: LoanAccount | null;
  cards: CardUnblockRequestCard | null;
}
