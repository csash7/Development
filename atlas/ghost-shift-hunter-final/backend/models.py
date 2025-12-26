from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Tuple
from enum import Enum

class ShiftStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"

class Worker(BaseModel):
    id: str
    name: str
    role: str
    trust_score: float

class DigitalShift(BaseModel):
    shift_id: str
    worker_id: str
    worker_name: str
    scheduled_start: str
    scheduled_end: str
    gps_check_in: Optional[str] = None
    gps_check_out: Optional[str] = None
    status: ShiftStatus

class LogEntry(BaseModel):
    raw_text: str
    extracted_name: Optional[str] = None
    extracted_time: Optional[str] = None
    line_number: int

class DiscrepancyType(str, Enum):
    GHOST_SHIFT = "GHOST_SHIFT"
    UNAUTHORIZED = "UNAUTHORIZED"
    LATE_ARRIVAL = "LATE_ARRIVAL"
    TIME_THEFT = "TIME_THEFT"
    EARLY_DEPARTURE = "EARLY_DEPARTURE"
    MISSING_SUPERVISOR = "MISSING_SUPERVISOR"
    CLEAN = "CLEAN"

# Enhanced CleanedLog with dynamic fields
class CleanedLog(BaseModel):
    original_line: int
    standardized_name: str
    standardized_time: str
    standardized_time_out: Optional[str] = None
    supervisor_initials: Optional[str] = None
    # Dynamic raw fields extracted from the document
    raw_fields: Dict[str, str] = Field(default_factory=dict)

# Field comparison for detailed analysis
class FieldComparison(BaseModel):
    field_name: str
    paper_value: str
    database_value: str
    matches: bool

class DiscrepancyReport(BaseModel):
    worker_id: Optional[str] = None
    worker_name: str
    has_issue: bool
    issue_type: DiscrepancyType
    confidence: float
    reasoning: str
    evidence: List[str]
    # Enhanced details for accordion view
    matched_fields: List[str] = Field(default_factory=list)
    mismatched_fields: List[FieldComparison] = Field(default_factory=list)
    flags: List[str] = Field(default_factory=list)
    # Raw extracted data from paper
    paper_data: Dict[str, str] = Field(default_factory=dict)
    # Database data for comparison
    database_data: Dict[str, str] = Field(default_factory=dict)

class PerceiveResponse(BaseModel):
    shifts: List[DigitalShift]
    logs: List[LogEntry]
    cleaned_logs: List[CleanedLog]
    # Column headers detected from the document
    column_headers: List[str] = Field(default_factory=list)
    
class ReasonRequest(BaseModel):
    shifts: List[DigitalShift]
    cleaned_logs: List[CleanedLog]
    audit_id: Optional[str] = None  # Optional: to update history with reports

class AuditRequest(BaseModel):
    scenario: str = "ghost"

class AuditResponse(BaseModel):
    shifts: List[DigitalShift]
    logs: List[LogEntry]
    reports: List[DiscrepancyReport]
    column_headers: List[str] = Field(default_factory=list)
