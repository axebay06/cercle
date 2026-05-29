import { useState, useEffect, useRef } from "react";
import { signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const C = {
  bg: "#0d0d15", accent: "#7b6fe8", accentLight: "#8b7ef8", accentDim: "#1e1e40",
  text: "#e0dff5", textDim: "#5a5a7a", card: "#18182a", cardBorder: "#28283e", danger: "#c47a6a"
};

export default function Auth() {
  const [mode, setMode] = useState("choice");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError("Erreur Google : " + e.message);
    }
  };

  const initRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        setError("reCAPTCHA expiré, réessaie.");
        window.recaptchaVerifier = null;
      },
    });
  };

  const goToPhone = () => {
    setMode("phone");
    setError("");
    setTimeout(() => initRecaptcha(), 300);
  };

  const handleSendCode = async () => {
    setError("");
    if (!phone.startsWith("+")) {
      setError("Le numéro doit commencer par + (ex: +33612345678)");
      return;
    }
    if (!window.recaptchaVerifier) {
      initRecaptcha();
    }
    setLoading(true);
    try {
      const confirm = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmation(confirm);
      setMode("code");
    } catch (e) {
      setError("Erreur : " + e.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      initRecaptcha();
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    setError("");
    setLoading(true);
    try {
      await confirmation.confirm(code);
    } catch (e) {
      setError("Code incorrect ou expiré");
    }
    setLoading(false);
  };

  const inp = {
    background: "#0d0d15", border: `0.5px solid ${C.cardBorder}`,
    borderRadius: 10, padding: "11px 14px", fontSize: 14,
    color: C.text, width: "100%", outline: "none", marginTop: 6
  };
  const btn = (disabled) => ({
    background: disabled ? "#2a2a40" : C.accent, color: disabled ? C.textDim : "#fff",
    border: "none", borderRadius: 10, padding: "11px 20px",
    fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    width: "100%", marginTop: 10
  });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "2rem" }}>

      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-1px" }}>
          <span style={{ color: C.accent }}>◎</span> Cercle
        </div>
        <div style={{ fontSize: 14, color: C.textDim, marginTop: 8 }}>Sorties entre vrais amis</div>
      </div>

      <div style={{ background: C.card, border: `0.5px solid ${C.cardBorder}`, borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 340 }}>

        {mode === "choice" && <>
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 8, textAlign: "center" }}>Rejoindre Cercle</div>
          <div style={{ fontSize: 12, color: C.textDim, marginBottom: 20, textAlign: "center", lineHeight: 1.6 }}>
            Connecte-toi pour accéder à ton cercle.
          </div>
          <button onClick={handleGoogle} style={{ background: "#fff", color: "#333", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuer avec Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 0.5, background: C.cardBorder }} />
            <span style={{ fontSize: 11, color: C.textDim }}>OU</span>
            <div style={{ flex: 1, height: 0.5, background: C.cardBorder }} />
          </div>

          <button onClick={goToPhone} style={{ background: C.accentDim, color: C.accentLight, border: `0.5px solid ${C.cardBorder}`, borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            📱 Continuer avec un numéro
          </button>
          {error && <div style={{ fontSize: 11, color: C.danger, marginTop: 10, textAlign: "center" }}>{error}</div>}
        </>}

        {mode === "phone" && <>
          <button onClick={() => { setMode("choice"); setError(""); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer", marginBottom: 8 }}>←</button>
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 4 }}>Ton numéro</div>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 12, lineHeight: 1.5 }}>
            Format international avec indicatif pays.<br/>Ex : +33 6 12 34 56 78
          </div>
          <input type="tel" placeholder="+33612345678" value={phone}
            onChange={e => setPhone(e.target.value.replace(/\s/g, ""))}
            style={inp} />

          <div id="recaptcha-container" />

          {error && <div style={{ fontSize: 11, color: C.danger, marginTop: 8 }}>{error}</div>}
          <button onClick={handleSendCode} disabled={loading || !phone}
            style={btn(loading || !phone)}>
            {loading ? "Envoi en cours..." : "Recevoir un code par SMS"}
          </button>
        </>}

        {mode === "code" && <>
          <button onClick={() => { setMode("phone"); setError(""); setCode(""); setTimeout(() => initRecaptcha(), 300); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer", marginBottom: 8 }}>←</button>
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 4 }}>Code reçu par SMS</div>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 12, lineHeight: 1.5 }}>
            Code envoyé au <span style={{ color: C.accent }}>{phone}</span>
          </div>
          <input type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            style={{ ...inp, textAlign: "center", fontSize: 22, letterSpacing: 6 }} />
          {error && <div style={{ fontSize: 11, color: C.danger, marginTop: 8 }}>{error}</div>}
          <button onClick={handleVerifyCode} disabled={loading || code.length !== 6}
            style={btn(loading || code.length !== 6)}>
            {loading ? "Vérification..." : "Valider le code"}
          </button>
        </>}
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: C.textDim, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
        En continuant, tu acceptes que Cercle garde tes données uniquement pour faire fonctionner l'appli.
      </div>
    </div>
  );
}