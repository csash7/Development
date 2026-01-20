# Ghost Shift Hunter

Ghost Shift Hunter is an AI-powered compliance and audit tool designed to detect discrepancies between physical paper sign-in logs and digital attendance records (GPS/App).

Built for high-volume staffing environments, it effectively identifies "Ghost Workers" (checked in digitally but not physically present) and Time Theft incidents.

## 🚀 Features

-   **AI-Powered Digitization**: Instantly converts photos of handwritten paper logs into structured JSON data using multi-modal LLMs (GPT-4o/Gemini 1.5).
-   **Automated Audit**: Compare digitized logs against digital rosters (e.g., Traba worker app GPS data) to flag anomalies.
-   **Discrepancy Detection**:
    -   👻 **Ghost Shifts**: Worker verified on app but missing from site log.
    -   ⏰ **Time Theft**: Mismatches between claimed hours and actual sign-in/out times.
    -   🕵️ **Unverified Workers**: Names on paper log not found in the digital roster.
-   **Analytics Dashboard**: Track compliance rates, frequent offenders, and site performance over time.

## 🛠 Tech Stack

-   **Frontend**: Next.js 15, React 19, Tailwind CSS, Framer Motion (for high-fidelity animations).
-   **Backend**: Python FastAPI.
-   **AI/ML**: OpenAI GPT-4o (Vision) & Google Gemini 2.0 (Verification).
-   **Infrastructure**: Nginx, Systemd, deployed on Hostinger VPS.

## 🏃‍♂️ Getting Started

### Prerequisites

-   Node.js 18+
-   Python 3.10+
-   OpenAI / Google Cloud API Keys

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/ghost-shift-hunter.git
    cd ghost-shift-hunter
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    
    # Configure Environment
    cp .env.example .env
    # Add your OPENAI_API_KEY and GOOGLE_API_KEY
    
    # Run Server
    uvicorn main:app --reload --port 8000
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    
    # Run Development Server
    npm run dev
    ```

4.  **Access App**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧠 Design Decisions

-   **Hybrid AI Pipeline**: Uses a primary model (GPT) for extraction and a secondary model (Gemini) for verification to minimize OCR hallucinations.
-   **Privacy Focused**: IP-based rate limiting and ephemeral storage for processed images.
-   **Extensible Schema**: Designed to adapt to various paper log formats (Sign-in sheets, Time cards, Visitor logs).

## 📄 License

MIT
