import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { Agents } from "./pages/Agents";
import { Tools } from "./pages/Tools";
import { Playground } from "./pages/Playground";
import { Settings } from "./pages/Settings";

import { AgentBuilder } from "./pages/AgentBuilder";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="agent/:agentId/builder" element={<AgentBuilder />} />
          <Route path="builder" element={<AgentBuilder />} />
          <Route path="tools" element={<Tools />} />
          <Route path="playground" element={<Playground />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
