export type Role = 'owner' | 'manager' | 'staff';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: Role;
    manager_id: string | null;
    hourly_rate: number;
    appointment_commission: number;
    created_at: string;
    updated_at: string;
}

export type AttendanceType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out';

export interface AttendanceEvent {
    id: string;
    user_id: string;
    type: AttendanceType;
    timestamp: string;
    created_at: string;
}

export interface DailyAppointment {
    id: string;
    user_id: string;
    date: string;
    count: number;
    created_at: string;
}

export type CorrectionStatus = 'pending' | 'approved' | 'rejected';
export type CorrectionType = 'attendance' | 'appointment';

export interface CorrectionRequest {
    id: string;
    user_id: string;
    target_date: string;
    type: CorrectionType;
    before_value: Record<string, unknown> | null;
    after_value: Record<string, unknown> | null;
    reason: string;
    status: CorrectionStatus;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
}
