import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ERPNanoCP from "./ERPNanoCP.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ERPNanoCP />
  </StrictMode>
);
