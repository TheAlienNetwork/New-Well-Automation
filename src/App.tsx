import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import SurveysPage from "./pages/SurveysPage";
import DirectionalPage from "./pages/DirectionalPage";
import TorqueDragPage from "./pages/TorqueDragPage";
import WitsConfigPage from "./pages/WitsConfigPage";
import DrillingParametersPage from "./pages/DrillingParametersPage";
import OppSupportPage from "./pages/OppSupportPage";
import ProfilePage from "./pages/ProfilePage";
import DatabaseManagementPage from "./pages/DatabaseManagementPage";
import routes from "tempo-routes";

function App() {
  // Store the result of useRoutes in a variable instead of using it directly in JSX
  const tempoRoutes =
    import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <>
        {/* Render tempo routes first */}
        {tempoRoutes}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/surveys" element={<SurveysPage />} />
          <Route path="/directional" element={<DirectionalPage />} />
          <Route path="/torquedrag" element={<TorqueDragPage />} />
          <Route path="/witsconfig" element={<WitsConfigPage />} />
          <Route path="/parameters" element={<DrillingParametersPage />} />
          <Route path="/oppsupport" element={<OppSupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/database" element={<DatabaseManagementPage />} />
          {import.meta.env.VITE_TEMPO === "true" && (
            <Route path="/tempobook/*" />
          )}
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
