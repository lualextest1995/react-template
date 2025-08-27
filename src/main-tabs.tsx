import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import AppWithTabs from "./AppWithTabs.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithTabs />
  </StrictMode>
);
