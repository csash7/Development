import streamlit as st
import pandas as pd
from datetime import datetime
from data_gen import generate_scenario
from agent import GhostHunterAgent
from models import DiscrepancyType

# Page Config
st.set_page_config(
    page_title="Atlas | Ghost Shift Hunter",
    page_icon="👻",
    layout="wide"
)

# Custom CSS for "Traba/Palantir" Vibe
st.markdown("""
<style>
    .stApp {
        background-color: #0e1117;
        color: #e0e0e0;
    }
    .metric-card {
        background-color: #1e2129;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #30363d;
        text-align: center;
    }
    .metric-value {
        font-size: 28px;
        font-weight: bold;
        color: #58a6ff;
    }
    .metric-label {
        font-size: 14px;
        color: #8b949e;
    }
    div[data-testid="stExpander"] {
        background-color: #161b22;
        border: 1px solid #30363d;
    }
    .success-box {
        padding: 1rem;
        background-color: #0f3d2e;
        border: 1px solid #2ea043;
        border-radius: 6px;
        color: #e6ffed;
    }
    .error-box {
        padding: 1rem;
        background-color: #3d1515;
        border: 1px solid #f85149;
        border-radius: 6px;
        color: #ffefef;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar
st.sidebar.title("👻 Ghost Shift Hunter")
st.sidebar.markdown("**Atlas Module v0.1**")
st.sidebar.divider()

scenario = st.sidebar.selectbox(
    "Simulation Scenario",
    ("clean", "ghost", "late", "unauthorized"),
    format_func=lambda x: f"Scenario: {x.title().replace('_', ' ')}"
)

st.sidebar.info(
    """
    **How it works:**
    1. **Ingest**: Simulates uploading a paper sign-in sheet.
    2. **Digitize**: Extracts "messy" OCR text.
    3. **Reconcile**: Agent compares against Traba Digital Roster.
    4. **Audit**: Flags "Ghosts" (Paid but not present).
    """
)

# Main Header
col1, col2 = st.columns([3, 1])
with col1:
    st.title("Atlas Operations Audit")
    st.markdown("Reconciling **Physical Truth** (Paper Logs) vs **Digital Truth** (App GPS)")
with col2:
    st.markdown(f"**Date:** {datetime.now().strftime('%Y-%m-%d')}")
    st.markdown("**Site:** US Cold Storage #402")

# Generate Data
if 'scenario_data' not in st.session_state or st.session_state.current_scenario != scenario:
    with st.spinner("Simulating Data Ingestion..."):
        shifts, logs = generate_scenario(scenario)
        st.session_state.scenario_data = (shifts, logs)
        st.session_state.current_scenario = scenario

shifts, logs = st.session_state.scenario_data

# 1. VISUAL REVIEW SECTION
st.divider()
c1, c2 = st.columns(2)

with c1:
    st.subheader("📱 Digital Roster (Traba App)")
    df_shifts = pd.DataFrame([s.dict() for s in shifts])
    st.dataframe(
        df_shifts[["worker_name", "shift_id", "status", "gps_check_in"]],
        use_container_width=True,
        hide_index=True
    )

with c2:
    st.subheader("📄 Physical Log (OCR Extraction)")
    
    # Simulate an image
    st.image(
        "https://placehold.co/600x200/222222/FFF.png?text=PAPER+SIGN-IN+SHEET+SCAN", 
        caption="Uploaded at 16:05 PM by Guard",
        use_column_width=True
    )
    
    with st.expander("View Raw OCR Data", expanded=True):
        for log in logs:
            st.markdown(f"`{log.raw_text}`")

# 2. AGENT ACTION SECTION
st.divider()
st.subheader("🤖 Atlas Agent Analysis")

if st.button("Run Audit Agent", type="primary", use_container_width=True):
    with st.spinner("Agent reconciling identities..."):
        agent = GhostHunterAgent(shifts, logs)
        reports = agent.run_audit()
        unauth_reports = agent.find_unauthorized()
        all_reports = reports + unauth_reports
        
        # Metrics
        ghosts = len([r for r in all_reports if r.issue_type == DiscrepancyType.GHOST_SHIFT])
        unauth = len([r for r in all_reports if r.issue_type == DiscrepancyType.UNAUTHORIZED])
        issues = len([r for r in all_reports if r.has_issue])
        
        # Display Metrics
        m1, m2, m3, m4 = st.columns(4)
        m1.markdown(f"<div class='metric-card'><div class='metric-value'>{len(shifts)}</div><div class='metric-label'>Total Shifts</div></div>", unsafe_allow_html=True)
        m2.markdown(f"<div class='metric-card'><div class='metric-value' style='color: #f85149'>{ghosts}</div><div class='metric-label'>Ghost Shifts</div></div>", unsafe_allow_html=True)
        m3.markdown(f"<div class='metric-card'><div class='metric-value' style='color: #e3b341'>{unauth}</div><div class='metric-label'>Unauthorized</div></div>", unsafe_allow_html=True)
        m4.markdown(f"<div class='metric-card'><div class='metric-value' style='color: #2ea043'>{len(shifts) - issues}</div><div class='metric-label'>Verified Clean</div></div>", unsafe_allow_html=True)

        st.markdown("### 📝 Discrepancy Report")
        
        # Reports
        if issues == 0:
            st.markdown("<div class='success-box'>✅ <b>ALL CLEAR</b>: Physical logs match Digital Roster 100%.</div>", unsafe_allow_html=True)
        else:
            for report in all_reports:
                if report.has_issue:
                    with st.container():
                        # Determine Color
                        color = "#f85149" if report.issue_type in [DiscrepancyType.GHOST_SHIFT, DiscrepancyType.UNAUTHORIZED] else "#e3b341"
                        
                        st.markdown(f"""
                        <div style="border-left: 4px solid {color}; padding-left: 1rem; margin-bottom: 1rem; background-color: #161b22; padding: 1rem; border-radius: 0 4px 4px 0;">
                            <h4 style="margin:0; color: {color}">{report.issue_type.value} DETECTED</h4>
                            <p style="font-size: 1.1em; font-weight: bold;">{report.worker_name}</p>
                            <p><i>"{report.reasoning}"</i></p>
                            <details>
                                <summary style="font-size: 0.8em; color: #8b949e">View Evidence (Confidence: {int(report.confidence*100)}%)</summary>
                                <ul style="font-size: 0.8em; color: #8b949e">
                                    {''.join([f'<li>{e}</li>' for e in report.evidence])}
                                </ul>
                            </details>
                        </div>
                        """, unsafe_allow_html=True)
