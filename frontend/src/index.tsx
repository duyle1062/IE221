import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import "./styles/index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Disable StrictMode in development to prevent double API calls
root.render(<App />);
