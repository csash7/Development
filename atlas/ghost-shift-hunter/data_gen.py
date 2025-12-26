import random
from datetime import datetime, timedelta
from typing import List, Tuple
from .models import Worker, DigitalShift, ShiftStatus, LogEntry

WORKERS_DB = [
    Worker(id="TRB-101", name="John Doe", role="Packer", trust_score=0.95),
    Worker(id="TRB-102", name="Jane Smith", role="Packer", trust_score=0.98),
    Worker(id="TRB-103", name="Michael Johnson", role="Forklift", trust_score=0.85),
    Worker(id="TRB-104", name="Emily Davis", role="Sorter", trust_score=0.92),
    Worker(id="TRB-105", name="Chris Brown", role="Packer", trust_score=0.60), # Low trust
    Worker(id="TRB-500", name="Alex Ghost", role="Packer", trust_score=0.40), # The Ghost
]

def generate_scenario(scenario_type: str) -> Tuple[List[DigitalShift], List[LogEntry]]:
    """
    Generates a Digital Roster and a corresponding Paper Log based on the scenario.
    Types: 'clean', 'ghost', 'late', 'unauthorized'
    """
    
    # 1. Base Roster (Digital Truth)
    # Everyone is scheduled for 08:00 - 16:00
    shifts = []
    log_entries = []
    
    start_time = "08:00"
    end_time = "16:00"

    # Helper for messy OCR
    def corrupt_name(name):
        if random.random() > 0.8:
            return name.replace("o", "0").replace("e", "c") # OCR typos
        return name

    # Scenario Logic
    active_workers = WORKERS_DB[:]
    
    if scenario_type == 'ghost':
        # TRB-500 is in Digital Roster but will NOT be in Paper Log
        pass 
    elif scenario_type == 'clean':
        active_workers = [w for w in WORKERS_DB if w.id != "TRB-500"]

    # Build Digital Roster
    for w in active_workers:
        shifts.append(DigitalShift(
            shift_id=f"SH-{random.randint(1000,9999)}",
            worker_id=w.id,
            worker_name=w.name,
            scheduled_start=start_time,
            scheduled_end=end_time,
            gps_check_in="07:55" if w.id != "TRB-500" else "07:58", # Ghost spoofed GPS
            status=ShiftStatus.COMPLETED
        ))

    # Build Paper Log (Physical Truth)
    line_num = 1
    for w in active_workers:
        # SKIP the Ghost in the paper log
        if scenario_type == 'ghost' and w.id == "TRB-500":
            continue
            
        # Corrupt data for others
        ocr_name = corrupt_name(w.name)
        check_in = "07:58"
        
        if w.id == "TRB-105" and scenario_type == 'late':
            check_in = "08:15" # Chris is late

        log_entries.append(LogEntry(
            line_number=line_num,
            raw_text=f"{line_num}. {ocr_name} - {check_in} - [SIGNATURE]",
            extracted_name=ocr_name,
            extracted_time=check_in,
            signature_detected=True
        ))
        line_num += 1

    # Unauthorized Scenario: Add someone to paper who IS NOT in roster
    if scenario_type == 'unauthorized':
        log_entries.append(LogEntry(
            line_number=line_num,
            raw_text=f"{line_num}. Unknown Guy - 08:00 - [SIGNATURE]",
            extracted_name="Unknown Guy",
            extracted_time="08:00",
            signature_detected=True
        ))

    return shifts, log_entries
