import random
from typing import Tuple, List
from models import Worker, DigitalShift, ShiftStatus, LogEntry

WORKERS_DB = [
    Worker(id="TRB-101", name="John Doe", role="Packer", trust_score=0.95),
    Worker(id="TRB-102", name="Jane Smith", role="Packer", trust_score=0.98),
    Worker(id="TRB-103", name="Michael Johnson", role="Forklift", trust_score=0.85),
    Worker(id="TRB-500", name="Alex Ghost", role="Packer", trust_score=0.40), 
]

def generate_data(scenario: str) -> Tuple[List[DigitalShift], List[LogEntry]]:
    shifts = []
    log_entries = []
    
    # Logic:
    # 1. Everyone in DB gets a Digital Shift (Standard Roster)
    # 2. GPS data acts as "Digital Truth"
    
    start_time = "08:00"
    
    # Filter workers based on scenario? No, let's keep roster constant mostly.
    # Actually for "clean", remove the ghost from roster to show a perfect day.
    
    active_roster = WORKERS_DB[:]
    if scenario == 'clean':
        active_roster = [w for w in WORKERS_DB if w.id != "TRB-500"]

    for w in active_roster:
        shifts.append(DigitalShift(
            shift_id=f"SH-{random.randint(1000,9999)}",
            worker_id=w.id,
            worker_name=w.name,
            scheduled_start=start_time,
            scheduled_end="16:00",
            gps_check_in="07:55" if w.id != "TRB-500" else "07:59",
            gps_check_out="16:05", # Default good checkout
            status=ShiftStatus.COMPLETED
        ))

    # Build Log Entries (Physical Truth)
    line_num = 1
    for w in active_roster:
        # GHOST SCENARIO: Alex Ghost (TRB-500) is missing from paper
        if scenario == 'ghost' and w.id == "TRB-500":
            continue
            
        name_on_paper = w.name
        time_on_paper = "07:58"
        time_out_on_paper = "16:02"
        supervisor = "SUP-AK"
        
        # LATE SCENARIO: Michael Johnson is late
        if scenario == 'late' and w.id == "TRB-103":
            # 50% chance of honest late, 50% chance of Time Theft
            if random.random() > 0.5:
                # dishonest: arrived 08:20 GPS, wrote 08:00 Paper
                shifts[i].gps_check_in = "08:20"
                time_on_paper = "08:00" 
            else:
                # honest: arrived 08:15 GPS, wrote 08:15 Paper
                shifts[i].gps_check_in = "08:15"
                time_on_paper = "08:15"
        
        # Typos for realism
        if random.random() > 0.7:
             name_on_paper = name_on_paper.replace('e', 'c')

        log_entries.append(LogEntry(
            line_number=line_num,
            raw_text=f"{line_num}. {name_on_paper} - In: {time_on_paper} - Out: {time_out_on_paper} - Sup: {supervisor}",
            extracted_name=name_on_paper,
            extracted_time=time_on_paper,
            extracted_time_out=time_out_on_paper,
            supervisor_sign=supervisor
        ))
        line_num += 1

    # UNAUTHORIZED SCENARIO
    if scenario == 'unauthorized':
        log_entries.append(LogEntry(
            line_number=line_num,
            raw_text=f"{line_num}. Unknown Intruder - In: 08:05 - Out: ?? - Sup: ??",
            extracted_name="Unknown Intruder",
            extracted_time="08:05",
            extracted_time_out=None,
            supervisor_sign=None
        ))

    return shifts, log_entries
