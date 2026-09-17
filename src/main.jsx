import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installStorageShim } from "./storage.js";
import GrowthGrid from "./GrowthGrid.jsx";
import "./index.css";

// Must run before GrowthGrid's load effect reads window.storage.
installStorageShim();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GrowthGrid />
  </StrictMode>
);
