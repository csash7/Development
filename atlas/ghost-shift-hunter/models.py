from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ShiftStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"

class Worker(BaseModel):
    id: str
    name: str
    role: str
    trust_score: float = Field(..., description="0-1 score based on history")

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
    """Represents a single line extracted from the physical paper log via OCR."""
    raw_text: str
    extracted_name: Optional[str] = None
    extracted_time: Optional[str] = None
    signature_detected: bool = False
    line_number: int

class DiscrepancyType(str, Enum):
    GHOST_SHIFT = "GHOST_SHIFT"          # In Digital, Not in Paper
    UNAUTHORIZED = "UNAUTHORIZED"        # In Paper, Not in Digital
    LATE_ARRIVAL = "LATE_ARRIVAL"        # Time mismatch
    BUDDY_PUNCH = "BUDDY_PUNCH"          # Suspicious signature/handwriting (simulated)
    CLEAN = "CLEAN"

class DiscrepancyReport(BaseModel):
    worker_id: Optional[str] = None
    worker_name: str
    has_issue: bool
    issue_type: DiscrepancyType
    confidence: float
    reasoning: str
    evidence: List[str]
