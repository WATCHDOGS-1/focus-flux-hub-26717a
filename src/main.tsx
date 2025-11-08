import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// The CSS import is moved to index.html for non-blocking loading.
// import "./index.css"; 

createRoot(document.getElementById("root")!).render(<App />);