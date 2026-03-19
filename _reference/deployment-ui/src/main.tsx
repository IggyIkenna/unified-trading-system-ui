import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { installDeploymentMockHandlers } from "./lib/mock-api";
installDeploymentMockHandlers(import.meta.env.VITE_MOCK_API === "true");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
