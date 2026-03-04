export type UserRole = "CLIENT" | "CHILD" | "BANKER" | "ADMIN";

export interface Profile {
    first_name: string;
    last_name: string;
    role: UserRole;
}

export interface Account {
    id: string;
    account_number: string;
    balance: number;
    daily_limit: number;
    is_child_account: boolean;
}

export interface AccountRef {
    account_number: string;
    profiles: {
        first_name: string;
    } | null;
}

export interface Transaction {
    id: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description: string;
    receiver: { account_number: string } | { account_number: string }[] | null;
    sender: { account_number: string } | { account_number: string }[] | null;
    created_at: string;
}

export interface PendingChildTransaction {
    id: string;
    amount: number;
    description: string | null;
    created_at: string;
    status: string;
    from_account_id: string;
    to_account_id: string;
    sender: AccountRef | null;
}

export interface ChildAccountWithProfile {
    id: string;
    account_number: string;
    profiles: {
        first_name: string;
    } | null;
}