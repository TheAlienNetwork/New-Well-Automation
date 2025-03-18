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
import routes from "tempo-routes";
import { WitsProvider } from "./context/WitsContext";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <WitsProvider>
        <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/surveys" element={<SurveysPage />} />
            <Route path="/directional" element={<DirectionalPage />} />
            <Route path="/torquedrag" element={<TorqueDragPage />} />
            <Route path="/witsconfig" element={<WitsConfigPage />} />
            <Route path="/parameters" element={<DrillingParametersPage />} />
            <Route path="/oppsupport" element={<OppSupportPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {import.meta.env.VITE_TEMPO === "true" && (
              <Route path="/tempobook/*" />
            )}
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </WitsProvider>
    </Suspense>
  );
}

export default App;
