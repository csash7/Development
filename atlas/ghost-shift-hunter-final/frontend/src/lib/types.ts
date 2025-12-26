// Frontend types matching enhanced backend models

export type DiscrepancyType =
    | "GHOST_SHIFT"
    | "UNAUTHORIZED"
    | "LATE_ARRIVAL"
    | "TIME_THEFT"
    | "EARLY_DEPARTURE"
    | "MISSING_SUPERVISOR"
    | "CLEAN";

export interface FieldComparison {
    field_name: string;
    paper_value: string;
    database_value: string;
    matches: boolean;
}

export interface DiscrepancyReport {
    worker_id?: string;
    worker_name: string;
    has_issue: boolean;
    issue_type: DiscrepancyType;
    confidence: number;
    reasoning: string;
    evidence: string[];
    // Enhanced details for accordion view
    matched_fields: string[];
    mismatched_fields: FieldComparison[];
    flags: string[];
    paper_data: Record<string, string>;
    database_data: Record<string, string>;
}

export interface CleanedLog {
    original_line: number;
    standardized_name: string;
    standardized_time: string;
    standardized_time_out?: string;
    supervisor_initials?: string;
    raw_fields: Record<string, string>;
}

export interface DigitalShift {
    shift_id: string;
    worker_id: string;
    worker_name: string;
    scheduled_start: string;
    scheduled_end: string;
    gps_check_in?: string;
    gps_check_out?: string;
    status: string;
}

export interface AuditResponse {
    shifts: DigitalShift[];
    logs: any[];
    reports: DiscrepancyReport[];
    column_headers: string[];
}

export interface PerceiveResponse {
    shifts: DigitalShift[];
    logs: any[];
    cleaned_logs: CleanedLog[];
    column_headers: string[];
}
