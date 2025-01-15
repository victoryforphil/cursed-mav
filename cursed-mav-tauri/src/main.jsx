import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { Ion } from "cesium";


// Set Cesium ion access token from environment variable
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
