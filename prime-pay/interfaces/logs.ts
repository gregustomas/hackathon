export interface AdminLog {
    id: string;
    created_at: string;
    user_email: string;
    action_type: string;
    message: string;
    severity: string;
}
