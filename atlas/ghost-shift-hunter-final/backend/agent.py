import os
import base64
import json
import re
from typing import List, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from models import DigitalShift, LogEntry, DiscrepancyReport, CleanedLog
import google.generativeai as genai

# Load environment variables FIRST
load_dotenv()

# Initialize OpenAI client
client = AsyncOpenAI()

# Initialize Gemini - only if key is available
google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key and google_api_key != "YOUR_GOOGLE_API_KEY_HERE":
    genai.configure(api_key=google_api_key)

# --- STAGE 1: PERCEPTION (GPT-5.2 Vision) ---
vision_model = OpenAIModel('gpt-5.2')
vision_agent = Agent(
    vision_model,
    output_type=List[CleanedLog],
    system_prompt=(
        "You are the 'Perception Layer' of a Forensic AI. "
        "Your job is to read raw, messy OCR log lines and output structured, cleaned data."
    )
)

# --- STAGE 3: REASONING (GPT-5.2 Audit) ---
audit_model = OpenAIModel('gpt-5.2')
audit_agent = Agent(
    audit_model,
    output_type=List[DiscrepancyReport],
    system_prompt=(
        "You are the 'Reasoning Brain' of the Ghost Shift Hunter. Perform a Forensic Audit.\n\n"
        "CONTEXT:\n"
        "1. You have the Digital Roster (App Data) with GPS In/Out times.\n"
        "2. You have Physical Logs (Paper) with Sign In/Out times + Supervisor.\n\n"
        "GOAL: Generate a detailed DiscrepancyReport for each worker with:\n"
        "- worker_name, has_issue, issue_type, confidence, reasoning, evidence\n"
        "- matched_fields, mismatched_fields, flags\n"
        "- paper_data: Dict of all fields from the paper log\n"
        "- database_data: Dict of matching fields from the database\n\n"
        "ISSUE RULES:\n"
        "- GHOST_SHIFT: Worker in Roster but missing from Paper.\n"
        "- TIME_THEFT: Paper sign-in earlier than GPS check-in by >5 mins.\n"
        "- UNAUTHORIZED: Name in Paper but not in Roster.\n"
        "- LATE_ARRIVAL: Both Paper and GPS show arrival >10 mins after scheduled start.\n"
        "- CLEAN: Everything matches and is valid."
    )
)

# =============================================================================
# STAGE 1: GPT-5.2 Initial Extraction
# =============================================================================
async def run_vision_from_image(image_bytes: bytes) -> tuple[List[dict], List[str]]:
    """Stage 1: Use GPT-5.2 to extract initial data from image."""
    if not os.getenv("OPENAI_API_KEY"):
        return [], []
    
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    response = await client.chat.completions.create(
        model="gpt-5.2",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert document OCR specialist. Extract ALL data from this worker logbook.\n\n"
                    "For EACH row, extract:\n"
                    "- line: Row number\n"
                    "- name: Worker name\n"
                    "- role: Job role (Packer, Forklift, Temp, etc.)\n"
                    "- time_in: Check-in time (HH:MM format)\n"
                    "- time_out: Check-out time (HH:MM format)\n"
                    "- supervisor: Supervisor name/initials\n"
                    "- signature: Signature if visible\n"
                    "- date: Date if visible\n\n"
                    "Return ONLY a JSON array. No markdown, no explanation."
                )
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract all worker entries from this logbook. Return JSON array only."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}", "detail": "high"}}
                ]
            }
        ],
        max_completion_tokens=3000
    )
    
    content = response.choices[0].message.content or ""
    
    # Parse JSON
    json_match = re.search(r'\[.*\]', content, re.DOTALL)
    if not json_match:
        return [], []
    
    try:
        entries = json.loads(json_match.group())
        column_headers = ["Name", "Role", "Time In", "Time Out", "Supervisor"]
        return entries, column_headers
    except json.JSONDecodeError:
        return [], []

# =============================================================================
# STAGE 2: Gemini 2.0 Verification & Enhancement
# =============================================================================
async def run_gemini_verification(image_bytes: bytes, initial_extraction: List[dict]) -> List[dict]:
    """Stage 2: Use Gemini 2.0 Flash to verify and enhance the extraction."""
    google_key = os.getenv("GOOGLE_API_KEY")
    if not google_key or google_key == "YOUR_GOOGLE_API_KEY_HERE":
        # Skip Gemini verification if no key, return initial data
        return initial_extraction
    
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Prepare the verification prompt
        prompt = f"""You are a data validation specialist. 

I have extracted the following worker logbook data from an image:
{json.dumps(initial_extraction, indent=2)}

Please review this extraction and:
1. Fill in any missing fields (null values) if you can determine them from context
2. Correct any obvious errors in names, times, or roles
3. Ensure all times are in HH:MM 24-hour format
4. Ensure all names are properly capitalized

Return the CORRECTED and ENHANCED data as a JSON array.
Return ONLY the JSON array, no markdown formatting, no explanation.

The fields should be: line, name, role, time_in, time_out, supervisor, signature, date
"""
        
        # Also send the image to Gemini for cross-reference
        import PIL.Image
        import io
        image = PIL.Image.open(io.BytesIO(image_bytes))
        
        response = model.generate_content([prompt, image])
        
        # Parse the response
        content = response.text or ""
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        
        if json_match:
            try:
                verified_entries = json.loads(json_match.group())
                return verified_entries
            except json.JSONDecodeError:
                return initial_extraction
        
        return initial_extraction
        
    except Exception as e:
        print(f"Gemini verification error: {e}")
        return initial_extraction

# =============================================================================
# Combined Pipeline: Extract + Verify
# =============================================================================
async def run_full_extraction_pipeline(image_bytes: bytes) -> tuple[List[CleanedLog], List[str]]:
    """Run the full 2-stage extraction pipeline: GPT-5.2 -> Gemini -> CleanedLog"""
    
    # Stage 1: GPT-5.2 Initial Extraction
    initial_entries, column_headers = await run_vision_from_image(image_bytes)
    
    if not initial_entries:
        return [], []
    
    # Stage 2: Gemini Verification (if available)
    verified_entries = await run_gemini_verification(image_bytes, initial_entries)
    
    # Convert to CleanedLog objects
    cleaned_logs = []
    for entry in verified_entries:
        raw_fields = {}
        
        # Build raw_fields from all entry data
        field_mappings = {
            'name': 'Name',
            'role': 'Role', 
            'time_in': 'Time In',
            'time_out': 'Time Out',
            'supervisor': 'Supervisor',
            'signature': 'Signature',
            'date': 'Date'
        }
        
        for key, display_name in field_mappings.items():
            if key in entry and entry[key]:
                raw_fields[display_name] = str(entry[key])
        
        cleaned_logs.append(CleanedLog(
            original_line=entry.get('line', 0),
            standardized_name=entry.get('name', 'Unknown'),
            standardized_time=entry.get('time_in', ''),
            standardized_time_out=entry.get('time_out'),
            supervisor_initials=entry.get('supervisor'),
            raw_fields=raw_fields
        ))
    
    return cleaned_logs, column_headers

async def run_vision_stage(logs: List[LogEntry]) -> List[CleanedLog]:
    """Fallback: Process text-based log entries."""
    if not os.getenv("OPENAI_API_KEY"):
        return []

    raw_log_text = "\n".join([f"Line {l.line_number}: {l.raw_text}" for l in logs])
    cleaned_logs_result = await vision_agent.run(f"Clean and structure these raw log lines:\n{raw_log_text}")
    return cleaned_logs_result.output

async def run_audit_stage(shifts: List[DigitalShift], cleaned_logs: List[CleanedLog]) -> List[DiscrepancyReport]:
    if not os.getenv("OPENAI_API_KEY"):
        return []
    
    # Build a lookup of raw_fields by worker name
    paper_data_lookup = {}
    for log in cleaned_logs:
        paper_data_lookup[log.standardized_name] = log.raw_fields.copy()
    
    # Build database lookup
    db_data_lookup = {}
    for shift in shifts:
        db_data_lookup[shift.worker_name] = {
            "Name": shift.worker_name,
            "Scheduled Start": shift.scheduled_start,
            "Scheduled End": shift.scheduled_end,
            "GPS Check-In": shift.gps_check_in or "-",
            "GPS Check-Out": shift.gps_check_out or "-",
            "Status": shift.status.value if shift.status else "-"
        }
    
    audit_prompt = (
        f"--- DIGITAL ROSTER (DATABASE) ---\n"
        f"{[s.model_dump_json() for s in shifts]}\n\n"
        f"--- PHYSICAL LOGS (PAPER) ---\n"
        f"{[l.model_dump_json() for l in cleaned_logs]}\n\n"
        "Generate a DiscrepancyReport for each worker. Focus on issue_type, confidence, reasoning, and evidence. "
        "The paper_data and database_data will be populated automatically."
    )
    
    audit_result = await audit_agent.run(audit_prompt)
    reports = audit_result.output
    
    # POST-PROCESS: Inject the actual extracted data into each report
    for report in reports:
        # Always inject paper_data from our extracted raw_fields
        if report.worker_name in paper_data_lookup:
            report.paper_data = paper_data_lookup[report.worker_name]
        
        # Always inject database_data from shifts
        if report.worker_name in db_data_lookup:
            report.database_data = db_data_lookup[report.worker_name]
    
    return reports
