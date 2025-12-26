from pydantic import BaseModel
from typing import List, Optional
from rapidfuzz import process, fuzz # Using rapidfuzz instead of thefuzz for speed/modernity if possible, but requirements said thefuzz. Adapting to thefuzz.
from thefuzz import fuzz
from .models import Worker, DigitalShift, LogEntry, DiscrepancyReport, DiscrepancyType

class GhostHunterAgent:
    """
    The AI Auditor that reconciles the Digital Roster against the Physical Log.
    Uses 'Agentic' patterns: Observation -> Reasoning -> Conclusion.
    """
    
    def __init__(self, digital_roster: List[DigitalShift], paper_logs: List[LogEntry]):
        self.digital_roster = digital_roster
        self.paper_logs = paper_logs

    def _fuzzy_match(self, name: str, candidates: List[str]) -> tuple[str, int]:
        """Returns best match and score."""
        # Simple wrapper around thefuzz
        best = process.extractOne(name, candidates, scorer=fuzz.token_sort_ratio)
        if best:
           return best[0], best[1]
        return None, 0

    def analyze_worker(self, shift: DigitalShift) -> DiscrepancyReport:
        """
        The Core 'Reasoning' Step.
        Agent asks: "Is this digital worker actually on the paper?"
        """
        # 1. Observation
        paper_names = [entry.extracted_name for entry in self.paper_logs if entry.extracted_name]
        
        # 2. Tool Use: Fuzzy Matching
        match_name, score = self._fuzzy_match(shift.worker_name, paper_names)
        
        # 3. Reasoning & Conclusion
        evidence = [
            f"Digital Roster: {shift.worker_name} (ID: {shift.worker_id})",
            f"Best Paper Match: '{match_name}' (Confidence: {score}%)"
        ]
        
        # Scenario A: High Confidence Match
        if score > 80:
            # Check timestamps (simple logic for now)
            # Find the specific log entry
            log_entry = next((e for e in self.paper_logs if e.extracted_name == match_name), None)
            
            if log_entry:
                evidence.append(f"Paper Log Time: {log_entry.extracted_time}")
                # Mock Time Check: If log time > 08:00 + 15 mins -> Late
                # Assuming standard 08:00 start for this demo
                if log_entry.extracted_time > "08:15":
                     return DiscrepancyReport(
                        worker_id=shift.worker_id,
                        worker_name=shift.worker_name,
                        has_issue=True,
                        issue_type=DiscrepancyType.LATE_ARRIVAL,
                        confidence=0.95,
                        reasoning=f"Worker matched on paper but arrived late ({log_entry.extracted_time}).",
                        evidence=evidence
                    )
            
            return DiscrepancyReport(
                worker_id=shift.worker_id,
                worker_name=shift.worker_name,
                has_issue=False,
                issue_type=DiscrepancyType.CLEAN,
                confidence=score / 100.0,
                reasoning="Match found between Digital and Paper records.",
                evidence=evidence
            )
            
        # Scenario B: No / Low Match -> GHOST
        else:
            reason = "Automatic Ghost Detection: Worker is in Digital Roster but NOT found in Paper Log."
            if shift.gps_check_in:
                evidence.append(f"GPS Signal: Present at {shift.gps_check_in} (Suspicious - No Physical Sig)")
                
            return DiscrepancyReport(
                worker_id=shift.worker_id,
                worker_name=shift.worker_name,
                has_issue=True,
                issue_type=DiscrepancyType.GHOST_SHIFT,
                confidence=0.92, # High confidence it's a ghost if no name match
                reasoning=reason,
                evidence=evidence
            )

    def run_audit(self) -> List[DiscrepancyReport]:
        reports = []
        # Check every digital shift
        for shift in self.digital_roster:
            report = self.analyze_worker(shift)
            reports.append(report)
            
        return reports

    def find_unauthorized(self) -> List[DiscrepancyReport]:
        """Finds people on paper who are NOT in digital."""
        reports = []
        digital_names = [s.worker_name for s in self.digital_roster]
        
        for entry in self.paper_logs:
            match_name, score = self._fuzzy_match(entry.extracted_name, digital_names)
            if score < 80:
                 reports.append(DiscrepancyReport(
                    worker_name=entry.extracted_name,
                    has_issue=True,
                    issue_type=DiscrepancyType.UNAUTHORIZED,
                    confidence=0.88,
                    reasoning=f"Name '{entry.extracted_name}' appears on paper log but has no Digital Roster assignment.",
                    evidence=[f"Paper Log Line {entry.line_number}: {entry.raw_text}"]
                ))
        return reports
