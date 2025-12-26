Traba Director / FDE Interview Strategy: The "Ghost Shift Hunter" Thesis
1. The Core Narrative ("The Barrel")
Your Brand: You are not just a Senior Engineer. You are a "Wartime" Leader currently operating at Director speed at C3 AI. You combine Hardware Roots (Nokia) with High-Velocity AI Deployment (C3).

The Pitch:

"I build GenAI agents and ship full-stack POCs in under 7 days to close enterprise deals. I am looking for a 'wartime' culture where I can apply that velocity to a specific vertical (US Manufacturing) rather than general enterprise software."

2. The Business Problem: "Why Ghost Shifts Exist"
Use this section to demonstrate deep Operational Empathy during the interview.

The Myth vs. Reality
The Myth: "The Site Manager stands at the door and checks every worker into the app."

The Reality: The Site Manager is in an office 500 feet away. The door is manned by a third-party Security Guard with a clipboard.

The Leakage Points (Why Traba Loses Money)
The "Lazy Approval": Managers often bulk-approve shifts based on GPS data alone, assuming the guard checked everyone.

GPS Failure: Metal roofs (Faraday Cages) block GPS, causing "False Absences" that lead to disputes.

"Buddy Punching": A worker sends their phone with a friend to clock in via GPS, but is physically absent.

The Result: The "Digital Truth" (Atlas) and "Physical Truth" (Paper Log) drift apart. This causes billing disputes and churn.

3. The Technical Solution: "The Ghost Shift Hunter"
This is the Prototype you built (or "designed") to solve the business problem.

The Concept
A Zero-Friction Audit Layer that digitizes the physical paper logs and reconciles them against the Traba Digital Roster.

Architecture
Input: Site Manager or Security Guard snaps a photo of the paper sign-in sheet at the end of the shift.

Processing (The Agent):

OCR/Vision AI (GPT-4o): Extracts messy handwriting (Names, Times, Signatures).

Fuzzy Matching: Maps "Jon D." on paper to "John Doe (TRB-1024)" in the database.

Validation Logic:

If User is in Digital Roster + On Paper = Verified.

If User is in Digital Roster + NOT on Paper = Potential "Ghost" (Flag for dispute).

If User is NOT in Digital Roster + On Paper = Unauthorized Worker.

Output: A "Discrepancy Report" sent to the Billing Team before the invoice is generated.

Why Not Other Solutions? (The "Director" Defense)
Why not GPS only? Indoor accuracy is poor in factories; it proves location, not work.

Why not Face ID Kiosks?

Legal Risk: Illinois BIPA laws (biometric lawsuits).

Hardware Friction: Managers won't keep iPads charged/connected.

Bottleneck: Scanning 200 faces at 8:00 AM creates a line; signing paper is parallel and fast.

4. The "Behavioral Gauntlet" (Tailored to Resume)
The "Hardest Thing" Question
Context: Rescuing a distressed C3 AI energy project.

The Story: "The project was Red. The data models were broken, the team was demoralized. I didn't just manage; I audited the code, rewrote the pipelines myself overnight to fix latency, and re-trained the team. We went Green in 20 days and the client expanded the contract."

The Signal: You take ownership of failure and fix it personally.

The "Disagreement" Question
Context: Launching a GenAI demo before management felt it was "ready."

The Story: "Management wanted to wait 3 months to stabilize the new GenAI product. I knew the client needed it now. I disagreed and offered to build the demo myself and own the bugs. I shipped it in 4 days, bugs and all. The client signed immediately because the value was obvious."

The Signal: You value speed over safety.

5. The Negotiation Strategy
Compensation
The Anchor: $225,000 Base Salary.

The Data: "I'm anchoring to the Director/Staff FDE market in NYC and Traba's own bands for Senior roles."

The Equity: Target 0.5% (Accept 0.35%+).

Script: "Since I am building the Atlas unit from scratch, I view this as a Founding Engineer role. I am targeting 0.5% equity to align with that long-term upside."

Visa Strategy (The "Day 1" Clause)
The Constraint: ~3 Years left on H-1B.

The Ask: "I need a clause for Day 1 Green Card Sponsorship (PERM) initiation."

The Pivot: "I also want Traba's counsel to evaluate me for an O-1A Visa immediately based on my Director role and critical AI work, to stop the H-1B clock."

6. Questions to Ask Zac/Founders
The Bottleneck: "Is the biggest bottleneck in Atlas right now technical (the product isn't ready) or operational (clients are refusing to adopt it)?"

The Culture: "Who is the most 'Barrel-like' person on the team, and what did they ship last week that impressed you?"

The Macro: "How are you positioning Atlas to clients who are worried about supply chain volatility under the new administration?"

Final Prep Checklist
[ ] Build the Demo: Have the "Ghost Shift Hunter" script ready to run (even if it just parses one dummy image).

[ ] Watch the Videos: Keith Rabois (Barrels) & Mike Shebat (Olympian Culture).

[ ] Stand Up: Take the Zoom call standing up to project energy.