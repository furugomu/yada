import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { App } from "./App.tsx";

const root = document.getElementById("app");
if (!root) throw new Error("#app not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
