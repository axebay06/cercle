import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const C = {
  bg: "#0d0d15", accent: "#7b6fe8", text: "#e0dff5", textDim: "#5a5a7a", card: "#18182a", cardBorder: "#28283e"
};

export default function Auth() {
  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>◎</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-1px" }}>
          <span style={{ color: C.accent }}>◎</span> Cercle
        </div>
        <div style={{ fontSize: 14, color: C.textDim, marginTop: 8 }}>Sorties entre vrais amis</div>
      </div>

      <div style={{ background: C.card, border: `0.5px solid ${C.cardBorder}`, borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 340, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 8 }}>Rejoindre Cercle</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 24, lineHeight: 1.6 }}>
          Connecte-toi pour accéder à ton cercle d'amis et organiser des sorties.
        </div>
        <button onClick={handleGoogle} style={{ background: "#fff", color: "#333", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuer avec Google
        </button>
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: C.textDim, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
        En continuant, tu acceptes que Cercle garde tes données uniquement pour faire fonctionner l'appli.
      </div>
    </div>
  );
}