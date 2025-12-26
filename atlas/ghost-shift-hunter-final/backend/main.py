import os
import uuid
import json
import base64
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from models import AuditRequest, AuditResponse, DiscrepancyReport, DiscrepancyType, PerceiveResponse, ReasonRequest
from data_gen import generate_data, WORKERS_DB
from agent import run_vision_stage, run_audit_stage, run_full_extraction_pipeline
from models import DigitalShift, ShiftStatus

# Load environment variables
load_dotenv()

app = FastAPI(title="Ghost Shift Hunter API")

# ============================================
# HISTORY STORAGE
# ============================================
UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
HISTORY_FILE = UPLOADS_DIR / "history.json"
ANALYTICS_FILE = UPLOADS_DIR / "analytics.json"
MAX_HISTORY = 10

def load_history() -> list:
    """Load audit history from file."""
    if HISTORY_FILE.exists():
        try:
            return json.loads(HISTORY_FILE.read_text())
        except:
            return []
    return []

def save_history(history: list):
    """Save audit history to file."""
    HISTORY_FILE.write_text(json.dumps(history, indent=2))

def add_to_history(entry: dict):
    """Add an entry to history, keeping only last MAX_HISTORY entries."""
    history = load_history()
    history.insert(0, entry)  # Add to front
    history = history[:MAX_HISTORY]  # Keep only last N
    save_history(history)
    return entry

def update_history(audit_id: str, updates: dict):
    """Update an existing history entry with new data (e.g., audit reports)."""
    history = load_history()
    for i, entry in enumerate(history):
        if entry.get("id") == audit_id:
            history[i] = {**entry, **updates}
            save_history(history)
            return history[i]
    return None

# ============================================
# ANALYTICS TRACKING
# ============================================
def load_analytics() -> dict:
    """Load analytics data from file."""
    default_data = {
        "total_visits": 0,
        "unique_visitors": [],
        "audits_run": 0,
        "daily_visits": {},
        "last_visitors": []
    }
    if ANALYTICS_FILE.exists():
        try:
            return json.loads(ANALYTICS_FILE.read_text())
        except:
            return default_data
    return default_data

def save_analytics(data: dict):
    """Save analytics data to file."""
    ANALYTICS_FILE.write_text(json.dumps(data, indent=2))

def track_visit(ip: str, user_agent: str = ""):
    """Track a page visit."""
    analytics = load_analytics()
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Increment total visits
    analytics["total_visits"] = analytics.get("total_visits", 0) + 1
    
    # Track unique visitors by IP
    if ip not in analytics.get("unique_visitors", []):
        analytics["unique_visitors"] = analytics.get("unique_visitors", []) + [ip]
    
    # Track daily visits
    daily = analytics.get("daily_visits", {})
    daily[today] = daily.get(today, 0) + 1
    analytics["daily_visits"] = daily
    
    # Keep last 50 visitors for recent activity
    last_visitors = analytics.get("last_visitors", [])
    last_visitors.insert(0, {
        "ip": ip[:12] + "...",  # Partial IP for privacy
        "time": datetime.now().isoformat(),
        "user_agent": user_agent[:50] if user_agent else "Unknown"
    })
    analytics["last_visitors"] = last_visitors[:50]
    
    save_analytics(analytics)

def track_audit():
    """Track when an audit is run."""
    analytics = load_analytics()
    analytics["audits_run"] = analytics.get("audits_run", 0) + 1
    save_analytics(analytics)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT = 10  # Max requests per hour
RATE_WINDOW = 3600  # 1 hour in seconds

# Track requests by IP: {ip: [timestamp1, timestamp2, ...]}
request_log: dict[str, list[datetime]] = defaultdict(list)

def check_rate_limit(ip: str) -> tuple[bool, int]:
    """Check if IP is within rate limit. Returns (is_allowed, remaining_requests)."""
    now = datetime.now()
    cutoff = now - timedelta(seconds=RATE_WINDOW)
    
    # Clean old entries
    request_log[ip] = [ts for ts in request_log[ip] if ts > cutoff]
    
    current_count = len(request_log[ip])
    remaining = max(0, RATE_LIMIT - current_count)
    
    if current_count >= RATE_LIMIT:
        return False, 0
    
    return True, remaining

def record_request(ip: str):
    """Record a request for rate limiting."""
    request_log[ip].append(datetime.now())

# CORS - restrict to known origins in production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT"],  # Removed DELETE, restricted methods
    allow_headers=["*"],
)

def generate_mock_roster(extracted_names: list = None):
    """Generate a mock digital roster based on extracted workers.
    
    If extracted_names is provided, generate roster for those workers only.
    Otherwise, use the hardcoded WORKERS_DB for demo mode.
    """
    import random
    shifts = []
    
    if extracted_names:
        # Generate roster for extracted workers only
        for i, name in enumerate(extracted_names):
            shifts.append(DigitalShift(
                shift_id=f"SH-{random.randint(1000,9999)}",
                worker_id=f"TRB-{100+i}",
                worker_name=name,
                scheduled_start="08:00",
                scheduled_end="16:00",
                gps_check_in="07:55",
                gps_check_out="16:05",
                status=ShiftStatus.COMPLETED
            ))
        
        # Add a GHOST WORKER: checked in via GPS but NOT on paper log
        shifts.append(DigitalShift(
            shift_id=f"SH-{random.randint(1000,9999)}",
            worker_id="TRB-GHOST",
            worker_name="Marcus Rivera",
            scheduled_start="08:00",
            scheduled_end="16:00",
            gps_check_in="07:59",
            gps_check_out="16:02",
            status=ShiftStatus.COMPLETED
        ))
    else:
        # Demo mode: use hardcoded workers
        for w in WORKERS_DB:
            shifts.append(DigitalShift(
                shift_id=f"SH-{random.randint(1000,9999)}",
                worker_id=w.id,
                worker_name=w.name,
                scheduled_start="08:00",
                scheduled_end="16:00",
                gps_check_in="07:55" if w.id != "TRB-500" else "08:15",
                gps_check_out="16:05",
                status=ShiftStatus.COMPLETED
            ))
    return shifts

@app.post("/api/perceive-image")
async def perceive_from_image(request: Request, file: UploadFile = File(...)):
    """Process an uploaded image using GPT-5.2 + Gemini 2.0 verification pipeline."""
    
    # Rate limiting check
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, remaining = check_rate_limit(client_ip)
    
    if not is_allowed:
        raise HTTPException(
            status_code=429, 
            detail="Rate limit exceeded. Maximum 10 uploads per hour. Please try again later."
        )
    
    # Record this request
    record_request(client_ip)
    
    # Track this audit for analytics
    track_audit()
    
    # 1. Check for API Key
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY not configured")
    
    # 2. Read image bytes
    image_bytes = await file.read()
    
    # 2.5 Save the image to disk with unique ID
    audit_id = str(uuid.uuid4())[:8]
    image_filename = f"{audit_id}_{file.filename or 'upload.png'}"
    image_path = UPLOADS_DIR / image_filename
    image_path.write_bytes(image_bytes)
    
    # 3. Run Full Pipeline: GPT-5.2 Extraction -> Gemini Verification
    try:
        cleaned_logs, column_headers = await run_full_extraction_pipeline(image_bytes)
        
        # 4. Generate mock digital roster based on extracted workers
        extracted_names = [log.standardized_name for log in cleaned_logs]
        shifts = generate_mock_roster(extracted_names)
        
        # 5. Check if Gemini was used
        gemini_used = os.getenv("GOOGLE_API_KEY") and os.getenv("GOOGLE_API_KEY") != "YOUR_GOOGLE_API_KEY_HERE"
        
        result = {
            "shifts": [s.model_dump() for s in shifts],
            "cleaned_logs": [l.model_dump() for l in cleaned_logs],
            "column_headers": column_headers,
            "logs": [],
            "gemini_verified": gemini_used
        }
        
        # 6. Save to history
        history_entry = {
            "id": audit_id,
            "timestamp": datetime.now().isoformat(),
            "image_url": f"/uploads/{image_filename}",
            "worker_count": len(cleaned_logs),
            "issue_count": 0,  # Will be updated after audit
            "result": result
        }
        add_to_history(history_entry)
        
        # Add audit_id to response so frontend can reference it
        result["audit_id"] = audit_id
        
        return result
    except Exception as e:
        print(f"Vision Error: {e}")
        # Clean up saved image on error
        if image_path.exists():
            image_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/perceive", response_model=PerceiveResponse)
async def perceive_logs(request: AuditRequest):
    """Fallback endpoint using mock data (for demo scenarios)."""
    shifts, logs = generate_data(request.scenario)
    
    if not os.getenv("OPENAI_API_KEY"):
        return PerceiveResponse(shifts=shifts, logs=logs, cleaned_logs=[])

    try:
        cleaned_logs = await run_vision_stage(logs)
        return PerceiveResponse(shifts=shifts, logs=logs, cleaned_logs=cleaned_logs)
    except Exception as e:
        print(f"Vision Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reason", response_model=AuditResponse)
async def reason_audit(request: ReasonRequest):
    if not os.getenv("OPENAI_API_KEY"):
        return AuditResponse(shifts=request.shifts, logs=[], reports=[])

    try:
        reports = await run_audit_stage(request.shifts, request.cleaned_logs)
        
        # Update history with the complete audit reports if audit_id provided
        if request.audit_id:
            issue_count = sum(1 for r in reports if r.has_issue)
            update_history(request.audit_id, {
                "reports": [r.model_dump() for r in reports],
                "issue_count": issue_count
            })
        
        return AuditResponse(
            shifts=request.shifts,
            logs=[],
            reports=reports
        )
    except Exception as e:
        print(f"Audit Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check(request: Request):
    gemini_available = os.getenv("GOOGLE_API_KEY") and os.getenv("GOOGLE_API_KEY") != "YOUR_GOOGLE_API_KEY_HERE"
    
    # Get rate limit info for this client
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, remaining = check_rate_limit(client_ip)
    
    return {
        "status": "operational", 
        "system": "Ghost Shift Hunter (GPT-5.2 + Gemini 2.0 Pipeline)",
        "gemini_enabled": gemini_available,
        "rate_limit": {
            "remaining": remaining,
            "limit": RATE_LIMIT,
            "window_seconds": RATE_WINDOW
        }
    }

# ============================================
# ANALYTICS ENDPOINTS
# ============================================
@app.post("/api/track")
def track_visitor(request: Request):
    """Track a page visit (called by frontend on load)."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    track_visit(client_ip, user_agent)
    return {"status": "ok"}

# Private analytics dashboard - use a secret key so only you can access it
ANALYTICS_SECRET = "ghost2024stats"  # Change this to your own secret!

@app.get("/api/analytics/{secret}")
def get_analytics(secret: str):
    """Get analytics data. Access with /api/analytics/ghost2024stats"""
    if secret != ANALYTICS_SECRET:
        raise HTTPException(status_code=404, detail="Not found")
    
    analytics = load_analytics()
    unique_count = len(analytics.get("unique_visitors", []))
    total = analytics.get("total_visits", 0)
    audits = analytics.get("audits_run", 0)
    daily = analytics.get("daily_visits", {})
    recent = analytics.get("last_visitors", [])[:20]  # Last 20 visitors
    
    # Get today's stats
    today = datetime.now().strftime("%Y-%m-%d")
    today_visits = daily.get(today, 0)
    
    return {
        "summary": {
            "total_visits": total,
            "unique_visitors": unique_count,
            "audits_run": audits,
            "today_visits": today_visits
        },
        "daily_visits": dict(sorted(daily.items(), reverse=True)[:14]),  # Last 14 days
        "recent_visitors": recent
    }

@app.get("/api/rate-limit")
def get_rate_limit(request: Request):
    """Get current rate limit status for the client."""
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, remaining = check_rate_limit(client_ip)
    
    return {
        "remaining": remaining,
        "limit": RATE_LIMIT,
        "window_seconds": RATE_WINDOW,
        "is_allowed": is_allowed
    }

# ============================================
# HISTORY ENDPOINTS
# ============================================

@app.get("/api/history")
def get_history():
    """Get list of past audits (last 10)."""
    history = load_history()
    # Return summary list (without full results for efficiency)
    return {
        "history": [
            {
                "id": h["id"],
                "timestamp": h["timestamp"],
                "image_url": h["image_url"],
                "worker_count": h.get("worker_count", 0),
                "issue_count": h.get("issue_count", 0)
            }
            for h in history
        ]
    }

@app.get("/api/history/{audit_id}")
def get_history_detail(audit_id: str):
    """Get full details of a specific audit."""
    history = load_history()
    for entry in history:
        if entry["id"] == audit_id:
            return entry
    raise HTTPException(status_code=404, detail="Audit not found")

# ============================================
# DATABASE / ROSTER MANAGEMENT ENDPOINTS
# ============================================

# In-memory roster storage (simulating a database)
ROSTER_DB = [
    {
        "id": "TRB-101",
        "name": "John Doe",
        "role": "Packer",
        "scheduled_start": "08:00",
        "scheduled_end": "16:00",
        "gps_check_in": "07:55",
        "gps_check_out": "16:05"
    },
    {
        "id": "TRB-102",
        "name": "Jane Smith",
        "role": "Packer",
        "scheduled_start": "08:00",
        "scheduled_end": "16:00",
        "gps_check_in": "07:58",
        "gps_check_out": "16:02"
    },
    {
        "id": "TRB-103",
        "name": "Michael Johnson",
        "role": "Forklift",
        "scheduled_start": "08:00",
        "scheduled_end": "16:00",
        "gps_check_in": "08:15",
        "gps_check_out": "15:30"
    },
    {
        "id": "TRB-104",
        "name": "Alex Walker",
        "role": "Temp",
        "scheduled_start": "08:00",
        "scheduled_end": "16:00",
        "gps_check_in": "08:00",
        "gps_check_out": "16:00"
    },
    {
        "id": "TRB-GHOST",
        "name": "Marcus Rivera",
        "role": "Packer",
        "scheduled_start": "08:00",
        "scheduled_end": "16:00",
        "gps_check_in": "07:59",
        "gps_check_out": "16:02"
    }
]

@app.get("/api/roster")
def get_roster():
    """Get all workers in the digital roster."""
    return {"roster": ROSTER_DB}

@app.put("/api/roster/{worker_id}")
def update_worker(worker_id: str, worker_data: dict):
    """Update a worker's information."""
    for i, worker in enumerate(ROSTER_DB):
        if worker["id"] == worker_id:
            ROSTER_DB[i] = {**worker, **worker_data, "id": worker_id}
            return {"success": True, "worker": ROSTER_DB[i]}
    raise HTTPException(status_code=404, detail="Worker not found")

@app.post("/api/roster")
def add_worker(worker_data: dict):
    """Add a new worker to the roster."""
    new_id = f"TRB-{len(ROSTER_DB) + 200}"
    new_worker = {
        "id": new_id,
        "name": worker_data.get("name", "New Worker"),
        "role": worker_data.get("role", "Temp"),
        "scheduled_start": worker_data.get("scheduled_start", "08:00"),
        "scheduled_end": worker_data.get("scheduled_end", "16:00"),
        "gps_check_in": worker_data.get("gps_check_in", "-"),
        "gps_check_out": worker_data.get("gps_check_out", "-")
    }
    ROSTER_DB.append(new_worker)
    return {"success": True, "worker": new_worker}

@app.delete("/api/roster/{worker_id}")
def delete_worker(worker_id: str):
    """Delete a worker from the roster."""
    global ROSTER_DB
    original_len = len(ROSTER_DB)
    ROSTER_DB = [w for w in ROSTER_DB if w["id"] != worker_id]
    if len(ROSTER_DB) < original_len:
        return {"success": True}
    raise HTTPException(status_code=404, detail="Worker not found")
