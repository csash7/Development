---
description: How to update the Ghost Shift Hunter agent pipeline
---

# Ghost Shift Hunter Agent Updates

When making changes to the agent pipeline in `ghost-shift-hunter-final/backend/agent.py`:

// turbo-all

1. Update the backend agent logic in `agent.py`
2. Update `main.py` if new functions are exported
3. **ALWAYS update the Agent Logic page** at `frontend/src/app/agents/page.tsx`:
   - Update the Mermaid diagram to reflect the new pipeline stages
   - Update the explainer cards below the diagram
   - Ensure model names (GPT-5.2, Gemini, etc.) are consistent
4. Update the frontend logs in `page.tsx` to show the new stages
5. Restart the backend server

## Key Files
- Agent logic: `/backend/agent.py`
- API endpoints: `/backend/main.py`  
- Agent Logic page (diagram): `/frontend/src/app/agents/page.tsx`
- Main UI (logs): `/frontend/src/app/page.tsx`
