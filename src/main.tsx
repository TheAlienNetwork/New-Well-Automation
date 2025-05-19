import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

import { TempoDevtools } from "tempo-devtools";
import { UserProvider } from "./context/UserContext";
import { SurveyProvider } from "./context/SurveyContext";
import { CurveDataProvider } from "./context/CurveDataContext";
import { WitsProvider } from "./context/WitsContext";

TempoDevtools.init();

// Use empty basename for Electron (file protocol) and BASE_URL for web
const basename =
  window.location.protocol === "file:" ? "" : import.meta.env.BASE_URL || "";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <UserProvider>
        <SurveyProvider>
          <WitsProvider>
            <CurveDataProvider>
              <App />
            </CurveDataProvider>
          </WitsProvider>
        </SurveyProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
