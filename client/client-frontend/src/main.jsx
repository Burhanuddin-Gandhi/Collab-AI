import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";


import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#283830",
          color: "#e4ede8",
          border: "1px solid #3a5045",
          fontSize: "13px",
          position: " center"
        },
        success: { iconTheme: { primary: "#7ec8a4", secondary: "#283830" } },
        error: { iconTheme: { primary: "#f87171", secondary: "#283830" } },
      }}
    />
  </BrowserRouter>
);