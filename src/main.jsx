import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import App from "./App";
import Auth from "./Auth";
import "./index.css";

function Root() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  if (user === undefined) return (
    <div style={{ background: "#0d0d15", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#7b6fe8", fontSize: 32 }}>◎</span>
    </div>
  );

  return user ? <App user={user} /> : <Auth />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode><Root /></StrictMode>
);