import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useProfile, useEvents, useFriends, useUserProfile } from "./useFirestore";

const C = {
  bg: "#0d0d15", surface: "#111118", card: "#18182a", cardBorder: "#28283e",
  accent: "#7b6fe8", accentLight: "#8b7ef8", accentDim: "#1e1e40",
  gradStart: "#7b6fe8", gradEnd: "#a78bfa",
  text: "#e0dff5", textMuted: "#a0a0c0", textDim: "#5a5a7a",
  danger: "#c47a6a", dangerDim: "#2a1a1a",
  success: "#5a9a8a", successDim: "#1a2020",
  navBg: "#0c0c14", divider: "#1e1e2e",
};

const s = {
  app: { maxWidth: 430, margin: "0 auto", background: C.surface, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text },
  card: { margin: "8px 12px", borderRadius: 16, background: C.card, border: `0.5px solid ${C.cardBorder}`, padding: 14, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" },
  header: { padding: "16px 16px 12px", borderBottom: `0.5px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 8, background: `linear-gradient(180deg, #14142a 0%, ${C.surface} 100%)` },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase", padding: "10px 16px 4px" },
  divider: { height: 0.5, background: C.divider, margin: "6px 0" },
  inp: { background: "#141422", border: `0.5px solid #28283e`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#e0dff5", width: "100%", outline: "none", marginTop: 4 },
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
};

const formatDateFR = iso => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
};

const GradientText = ({ children, size = 20 }) => (
  <span style={{ fontWeight: 700, fontSize: size, letterSpacing: "-0.5px", background: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{children}</span>
);

const Logo = () => <GradientText size={20}>◎ Cercle</GradientText>;

const Badge = ({ children, color = C.accent, bg = C.accentDim, dot = false }) => (
  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: bg, color, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
    {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />}
    {children}
  </span>
);

const Toast = ({ msg }) => msg ? (
  <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#1e1e40", color: C.accentLight, padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 999, border: `0.5px solid ${C.accent}`, boxShadow: `0 4px 20px ${C.accent}40`, whiteSpace: "nowrap" }}>{msg}</div>
) : null;

const Btn = ({ children, onClick, variant = "primary", full = true, disabled = false, icon }) => {
  const vs = {
    primary: { background: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`, color: "#fff", border: "none", boxShadow: `0 4px 15px ${C.accent}40` },
    secondary: { background: "#1a1a2e", color: C.accentLight, border: `0.5px solid #2e2e4e` },
    danger: { background: C.dangerDim, color: C.danger, border: `0.5px solid #3a2020` },
    ghost: { background: "transparent", color: C.textMuted, border: `0.5px solid ${C.cardBorder}` },
    warning: { background: "#2a1a00", color: "#e8a84a", border: `0.5px solid #3a2800` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...vs[variant], borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto", marginTop: 8, opacity: disabled ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
};

const SpotDots = ({ filled, total }) => (
  <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 6 }}>
    {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
      <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < filled ? C.accent : "#2a2a3e", display: "inline-block" }} />
    ))}
    <span style={{ fontSize: 10, color: C.textDim, marginLeft: 4, fontWeight: 500 }}>{filled}/{total}</span>
  </div>
);

const BottomNav = ({ tab, setTab }) => {
  const items = [
    { id: "feed", icon: "🧭", label: "Explorer" },
    { id: "myevents", icon: "📅", label: "Mes cercles" },
    { id: "create", icon: "◎", label: "Créer" },
    { id: "friends", icon: "💬", label: "Messages" },
    { id: "profile", icon: "👤", label: "Profil" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 18px", borderTop: `0.5px solid ${C.divider}`, background: C.navBg, position: "sticky", bottom: 0 }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setTab(it.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 10px" }}>
          <span style={{ fontSize: it.id === "create" ? 24 : 20, transition: "transform 0.2s", transform: tab === it.id ? "scale(1.15)" : "scale(1)" }}>{it.icon}</span>
          <span style={{ fontSize: 9, fontWeight: tab === it.id ? 700 : 400, color: tab === it.id ? C.accent : C.textDim }}>{it.label}</span>
          {tab === it.id && <div style={{ width: 16, height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${C.gradStart}, ${C.gradEnd})` }} />}
        </button>
      ))}
    </div>
  );
};

// ── Panel notifications ─────────────────────────────────────────
const NotifsPanel = ({ events, myUid, onAccept, onDecline, onClose }) => {
  const pending = events
    .filter(e => e.organizer === myUid)
    .flatMap(ev => (ev.requests || []).map(uid => ({ ev, uid })));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: C.surface, borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", maxHeight: "70vh", overflowY: "auto", border: `0.5px solid ${C.cardBorder}` }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.cardBorder, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>🔔 Notifications</div>
        {pending.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: C.textDim, fontSize: 13 }}>Aucune notification pour l'instant</div>}
        {pending.map(({ ev, uid }, i) => (
          <div key={i} style={{ background: C.card, border: `0.5px solid ${C.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>{ev.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>{uid.slice(0, 2).toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Demande de participation</div>
                <div style={{ fontSize: 11, color: C.textDim }}>veut rejoindre ton cercle</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onAccept(ev.id, uid)} style={{ flex: 1, background: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`, color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Accepter</button>
              <button onClick={() => onDecline(ev.id, uid)} style={{ flex: 1, background: C.dangerDim, color: C.danger, border: `0.5px solid #3a2020`, borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer" }}>Refuser</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Gestion du cercle ───────────────────────────────────────────
const ManageCircleScreen = ({ ev, onBack, onUpdate, onEnd, onDelete, showToast }) => {
  const [form, setForm] = useState({ title: ev.title, location: ev.location, dateISO: ev.dateISO || "", time: ev.time || "", maxSpots: ev.maxSpots });
  const [confirming, setConfirming] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <GradientText size={15}>Gérer le cercle</GradientText>
      </div>
      <div style={{ padding: "16px" }}>
        {[["Titre", "title", "Soirée bowling..."], ["Lieu", "location", "Paris 11e..."]].map(([label, key, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} style={s.inp} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</div>
            <input type="date" value={form.dateISO} onChange={e => set("dateISO", e.target.value)} style={{ ...s.inp, colorScheme: "dark" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Heure</div>
            <input type="time" value={form.time} onChange={e => set("time", e.target.value)} style={{ ...s.inp, colorScheme: "dark" }} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Places max : <span style={{ color: C.accent }}>{form.maxSpots}</span></div>
          <input type="range" min={2} max={20} value={form.maxSpots} onChange={e => set("maxSpots", Number(e.target.value))} style={{ width: "100%", accentColor: C.accent }} />
        </div>
        <Btn onClick={async () => { await onUpdate(ev.id, { ...form, date: formatDateFR(form.dateISO) }); showToast("✅ Modifications enregistrées !"); onBack(); }} icon="💾">Enregistrer</Btn>
        <div style={{ height: 1, background: C.divider, margin: "20px 0" }} />
        {confirming === "end" ? (
          <div style={{ background: C.card, border: `0.5px solid ${C.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 10 }}>Terminer le cercle ? Les souvenirs seront accessibles.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => { await onEnd(ev.id); showToast("🎉 Cercle terminé !"); onBack(); }} style={{ flex: 1, background: C.success, color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Confirmer</button>
              <button onClick={() => setConfirming(null)} style={{ flex: 1, background: C.card, color: C.textMuted, border: `0.5px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        ) : <Btn variant="warning" onClick={() => setConfirming("end")} icon="🎉">Terminer le cercle</Btn>}
        {confirming === "delete" ? (
          <div style={{ background: C.dangerDim, border: `0.5px solid #3a2020`, borderRadius: 12, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: 13, color: C.danger, marginBottom: 10 }}>Supprimer définitivement ?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => { await onDelete(ev.id); showToast("🗑 Cercle supprimé"); onBack(); }} style={{ flex: 1, background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Supprimer</button>
              <button onClick={() => setConfirming(null)} style={{ flex: 1, background: C.card, color: C.textMuted, border: `0.5px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        ) : <Btn variant="danger" onClick={() => setConfirming("delete")} icon="🗑">Supprimer le cercle</Btn>}
      </div>
    </div>
  );
};

const EventCard = ({ ev, onOpen, myUid }) => {
  const participants = ev.participants || [];
  const requests = ev.requests || [];
  const isFull = participants.length >= ev.maxSpots;
  const isParticipant = participants.includes(myUid);
  const hasRequested = requests.includes(myUid);
  const isOrganizer = ev.organizer === myUid;
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onOpen(ev)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...s.card, transform: hovered ? "translateY(-2px)" : "none", boxShadow: hovered ? `0 8px 25px rgba(123,111,232,0.15)` : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{ev.title}</div>
        {ev.ended && <span style={{ fontSize: 16 }}>📸</span>}
      </div>
      <div style={{ fontSize: 11, color: C.textDim, display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <span>📅 {ev.date || formatDateFR(ev.dateISO)}{ev.time ? ` · ${ev.time}` : ""}</span>
        <span>📍 {ev.location}</span>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {ev.ended ? <Badge color={C.textMuted} bg="#1a1a28">{(ev.photos || []).length} souvenir{(ev.photos || []).length !== 1 ? "s" : ""}</Badge>
          : isOrganizer ? <Badge dot>{requests.length > 0 ? `${requests.length} demande${requests.length > 1 ? "s" : ""}` : "Ton cercle"}</Badge>
          : isParticipant ? <Badge color={C.success} bg={C.successDim} dot>Inscrit ✓</Badge>
          : hasRequested ? <Badge color={C.textMuted} bg="#1e1e30">En attente…</Badge>
          : isFull ? <Badge color={C.danger} bg={C.dangerDim}>Complet</Badge>
          : <Badge dot>{ev.mutualFriends || 0} ami{(ev.mutualFriends || 0) > 1 ? "s" : ""} en commun</Badge>}
      </div>
      {!ev.ended && <SpotDots filled={participants.length} total={ev.maxSpots} />}
    </div>
  );
};

const FeedScreen = ({ events, onOpen, profile, myUid, notifCount, onOpenNotifs }) => {
  const active = events.filter(e => !e.ended);
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ ...s.header, justifyContent: "space-between" }}>
        <div><Logo /><div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Bonjour {profile?.name} 👋</div></div>
        <div onClick={onOpenNotifs} style={{ width: 38, height: 38, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", position: "relative", border: `0.5px solid ${C.cardBorder}` }}>
          🔔
          {notifCount > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: C.danger, fontSize: 9, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{notifCount}</div>}
        </div>
      </div>
      {active.length > 0 && (
        <div style={{ padding: "12px 16px 6px" }}>
          <div style={{ background: `linear-gradient(135deg, ${C.accentDim}, #1a1030)`, borderRadius: 16, padding: "14px 16px", border: `0.5px solid ${C.cardBorder}` }}>
            <div style={{ fontSize: 12, color: C.accentLight, fontWeight: 600, marginBottom: 4 }}>✨ {active.length} cercle{active.length > 1 ? "s" : ""} à venir</div>
            <div style={{ fontSize: 11, color: C.textDim }}>Rejoins une sortie ou crée la tienne.</div>
          </div>
        </div>
      )}
      <div style={s.sectionLabel}>Cercles à venir</div>
      {active.map(ev => <EventCard key={ev.id} ev={ev} onOpen={onOpen} myUid={myUid} />)}
      {active.length === 0 && (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.textMuted }}>Aucun cercle actif</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>Crée le premier !</div>
        </div>
      )}
    </div>
  );
};

const MyEventsScreen = ({ events, onOpen, myUid }) => {
  const mine = events.filter(e => e.organizer === myUid || (e.participants || []).includes(myUid));
  const upcoming = mine.filter(e => !e.ended);
  const past = mine.filter(e => e.ended);
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ ...s.header, justifyContent: "space-between" }}><Logo /></div>
      {upcoming.length > 0 && <><div style={s.sectionLabel}>À venir · {upcoming.length}</div>{upcoming.map(ev => <EventCard key={ev.id} ev={ev} onOpen={onOpen} myUid={myUid} />)}</>}
      {past.length > 0 && <><div style={{ ...s.sectionLabel, color: C.textDim }}>Mémoires · {past.length}</div>{past.map(ev => <EventCard key={ev.id} ev={ev} onOpen={onOpen} myUid={myUid} />)}</>}
      {mine.length === 0 && <div style={{ padding: 40, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📅</div><div style={{ fontSize: 14, color: C.textMuted }}>Aucun cercle pour l'instant</div></div>}
    </div>
  );
};

const CreateScreen = ({ onCreate, onBack }) => {
  const [form, setForm] = useState({ title: "", dateISO: "", time: "", location: "", maxSpots: 4 });
  const [emoji, setEmoji] = useState("🎉");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const emojis = ["🎳", "🌿", "🔐", "🍕", "🎬", "🏃", "🎮", "🎉", "🍻", "🌆", "🎨", "🎵"];
  const submit = () => {
    if (!form.title || !form.dateISO || !form.location) return alert("Remplis au moins le titre, la date et le lieu !");
    onCreate({ ...form, emoji, title: `${form.title} ${emoji}`, date: formatDateFR(form.dateISO) });
    onBack();
  };
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <GradientText size={16}>Créer un cercle</GradientText>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ambiance</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {emojis.map(e => <button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 22, background: emoji === e ? C.accentDim : "#141422", border: `1.5px solid ${emoji === e ? C.accent : "transparent"}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", transform: emoji === e ? "scale(1.1)" : "scale(1)", transition: "all 0.15s" }}>{e}</button>)}
          </div>
        </div>
        {[["Titre", "title", "Ex: Soirée bowling..."], ["Lieu", "location", "Ex: Paris 11e..."]].map(([label, key, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} style={s.inp} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</div>
            <input type="date" value={form.dateISO} onChange={e => set("dateISO", e.target.value)} min={new Date().toISOString().split("T")[0]} style={{ ...s.inp, colorScheme: "dark" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Heure</div>
            <input type="time" value={form.time} onChange={e => set("time", e.target.value)} style={{ ...s.inp, colorScheme: "dark" }} />
          </div>
        </div>
        {form.dateISO && <div style={{ fontSize: 11, color: C.accent, marginBottom: 14, fontWeight: 500 }}>📅 {formatDateFR(form.dateISO)}{form.time ? ` à ${form.time}` : ""}</div>}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Places max : <span style={{ color: C.accent }}>{form.maxSpots}</span></div>
          <input type="range" min={2} max={20} value={form.maxSpots} onChange={e => set("maxSpots", Number(e.target.value))} style={{ width: "100%", accentColor: C.accent }} />
        </div>
        <Btn onClick={submit} icon="🎯">Ouvrir le cercle</Btn>
      </div>
    </div>
  );
};

const SUGGESTED = [
  { id: "camille", name: "Camille R.", initials: "CR", color: "#e8a84a", bg: "#2a2010", mutuals: 4 },
  { id: "theo", name: "Théo M.", initials: "TM", color: "#5aaa7a", bg: "#1a2a1e", mutuals: 3 },
  { id: "ines", name: "Inès B.", initials: "IB", color: "#c47ab8", bg: "#2a1a2a", mutuals: 2 },
];

const FriendsScreen = ({ onOpenConv, messages, friends, onAddFriend }) => (
  <div style={{ flex: 1, overflowY: "auto" }}>
    <div style={{ ...s.header, justifyContent: "space-between" }}><Logo /><span style={{ fontSize: 11, color: C.textDim }}>Messages</span></div>
    {friends.length > 0 && <>
      <div style={s.sectionLabel}>Amis · {friends.length}</div>
      {friends.map(friend => {
        const msgs = messages[friend.uid] || [];
        const last = msgs[msgs.length - 1];
        return (
          <div key={friend.uid} onClick={() => onOpenConv(friend.uid)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `0.5px solid ${C.divider}`, cursor: "pointer" }}>
            {friend.photo
              ? <img src={friend.photo} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${C.cardBorder}` }} />
              : <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accentDim}, #1a1030)`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}>{getInitials(friend.name)}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{friend.name || friend.uid}</div>
              <div style={{ fontSize: 11, color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{last ? (last.from === "me" ? `Toi : ${last.text}` : last.text) : "Commencer une conversation"}</div>
            </div>
            {last && <span style={{ fontSize: 10, color: C.textDim }}>{last.time}</span>}
          </div>
        );
      })}
    </>}
    <div style={{ ...s.sectionLabel, color: C.textDim }}>Suggestions</div>
    {SUGGESTED.filter(su => !friends.find(f => f.uid === su.id)).map(u => (
      <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `0.5px solid ${C.divider}` }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: u.bg, color: u.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}>{u.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{u.name}</div>
          <div style={{ fontSize: 11, color: C.textDim }}>{u.mutuals} ami{u.mutuals > 1 ? "s" : ""} en commun</div>
        </div>
        <button onClick={() => onAddFriend(u.id)} style={{ background: C.accentDim, color: C.accentLight, border: `0.5px solid #2e2e4e`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Ajouter</button>
      </div>
    ))}
  </div>
);

const ConversationScreen = ({ friendId, friendName, onBack, messages, onSend }) => {
  const [input, setInput] = useState("");
  const send = () => { if (!input.trim()) return; onSend(friendId, input.trim()); setInput(""); };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: C.accent }}>{getInitials(friendName)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{friendName || friendId}</div>
          <div style={{ fontSize: 10, color: C.success }}>● Dans ton cercle</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, background: C.bg }}>
        {messages.length === 0 && <div style={{ textAlign: "center", color: C.textDim, fontSize: 12, marginTop: 60 }}>Début de la conversation 👋</div>}
        {messages.map((msg, i) => {
          const isMe = msg.from === "me";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "75%", padding: "9px 13px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isMe ? `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})` : C.card, border: isMe ? "none" : `0.5px solid ${C.cardBorder}`, color: isMe ? "#fff" : C.text, fontSize: 13, lineHeight: 1.5 }}>
                {msg.text}
                <div style={{ fontSize: 9, color: isMe ? "rgba(255,255,255,0.6)" : C.textDim, marginTop: 3, textAlign: "right" }}>{msg.time}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "10px 16px 18px", borderTop: `0.5px solid ${C.divider}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Message..." style={{ flex: 1, background: C.card, border: `0.5px solid ${C.cardBorder}`, borderRadius: 22, padding: "9px 16px", fontSize: 13, color: C.text, outline: "none" }} />
        <button onClick={send} style={{ background: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`, border: "none", borderRadius: "50%", width: 38, height: 38, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>↑</button>
      </div>
    </div>
  );
};

const EditProfileScreen = ({ profile, onSave, onBack, user }) => {
  const [form, setForm] = useState({ ...profile });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const initials = getInitials(form.name || user?.displayName);
  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 400;
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; } }
        else { if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        set("photo", canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <GradientText size={15}>Modifier le profil</GradientText>
      </div>
      <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <label style={{ cursor: "pointer", position: "relative" }}>
          {form.photo
            ? <img src={form.photo} alt="" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.accent}` }} />
            : <div style={{ width: 88, height: 88, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accentDim}, #1a1030)`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, border: `3px solid ${C.accent}` }}>{initials}</div>}
          <div style={{ position: "absolute", bottom: 2, right: 2, background: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`, borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📷</div>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </label>
        <span style={{ fontSize: 11, color: C.textDim }}>Appuie pour changer</span>
      </div>
      <div style={{ padding: "0 16px" }}>
        {[["Prénom", "name", "Ton prénom"], ["Ville", "city", "Paris..."], ["Bio", "bio", "Dis quelque chose..."]].map(([label, key, ph]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            <input value={form[key] || ""} onChange={e => set(key, e.target.value)} placeholder={ph} style={s.inp} />
          </div>
        ))}
        <Btn onClick={() => { onSave(form); onBack(); }} icon="✓">Enregistrer</Btn>
      </div>
    </div>
  );
};

const ProfileScreen = ({ events, profile, onEdit, user, myUid }) => {
  const initials = getInitials(profile?.name || user?.displayName);
  const memories = events.filter(e => e.ended && (e.organizer === myUid || (e.participants || []).includes(myUid)));
  const totalCircles = events.filter(e => (e.participants || []).includes(myUid) || e.organizer === myUid).length;
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ background: `linear-gradient(180deg, #14142a 0%, ${C.surface} 100%)`, padding: "20px 16px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingBottom: 20 }}>
          {(profile?.photo || user?.photoURL)
            ? <img src={profile?.photo ?? user?.photoURL} alt="" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.accent}`, boxShadow: `0 0 0 4px ${C.accentDim}` }} />
            : <div style={{ width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accentDim}, #1a1030)`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, border: `3px solid ${C.accent}` }}>{initials}</div>}
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{profile?.name || user?.displayName}</div>
          {profile?.city && <div style={{ fontSize: 12, color: C.textDim }}>📍 {profile.city}</div>}
          {profile?.bio && <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>{profile.bio}</div>}
          <div style={{ display: "flex", gap: 32, marginTop: 4 }}>
            {[[totalCircles.toString(), "Cercles"], [memories.length.toString(), "Mémoires"]].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: "0 16px 8px" }}>
        <Btn variant="secondary" onClick={onEdit} icon="✏️">Modifier le profil</Btn>
        <Btn variant="danger" onClick={() => signOut(auth)} icon="→">Déconnexion</Btn>
      </div>
      <div style={s.divider} />
      <div style={s.sectionLabel}>Mes mémoires 📸</div>
      {memories.length === 0 && <div style={{ padding: "20px 16px", fontSize: 12, color: C.textDim, textAlign: "center" }}>Tes souvenirs apparaîtront ici après chaque sortie.</div>}
      {memories.map(ev => (
        <div key={ev.id} style={{ margin: "8px 12px", borderRadius: 14, background: C.card, border: `0.5px solid ${C.cardBorder}`, padding: 14 }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{ev.emoji}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ev.title}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{ev.date || formatDateFR(ev.dateISO)} · {(ev.participants || []).length} personnes</div>
          {(ev.photos || []).length > 0 && <div style={{ fontSize: 11, color: C.accent, marginTop: 5 }}>📸 {ev.photos.length} souvenir{ev.photos.length > 1 ? "s" : ""}</div>}
        </div>
      ))}
    </div>
  );
};

const UserProfileScreen = ({ uid, onBack, myUid, onAddFriend, friends, events }) => {
  const [userProfile, loading] = useUserProfile(uid);
  const isFriend = friends.some(f => f.uid === uid);
  const commonEvents = events.filter(e => (e.participants || []).includes(uid) && (e.participants || []).includes(myUid));
  const initials = getInitials(userProfile?.name);
  if (loading) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: C.accent, fontSize: 28 }}>◎</span></div>;
  if (!userProfile) return <div style={{ flex: 1 }}><div style={s.header}><button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button><span style={{ color: C.text }}>Introuvable</span></div></div>;
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <GradientText size={14}>{userProfile.name}</GradientText>
      </div>
      <div style={{ background: `linear-gradient(180deg, #14142a, ${C.surface})`, padding: "24px 16px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {userProfile.photo
          ? <img src={userProfile.photo} alt="" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.accent}` }} />
          : <div style={{ width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accentDim}, #1a1030)`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 }}>{initials}</div>}
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{userProfile.name}</div>
        {userProfile.city && <div style={{ fontSize: 12, color: C.textDim }}>📍 {userProfile.city}</div>}
        {userProfile.bio && <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>{userProfile.bio}</div>}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>{commonEvents.length}</div>
          <div style={{ fontSize: 11, color: C.textDim }}>Cercle{commonEvents.length > 1 ? "s" : ""} en commun</div>
        </div>
      </div>
      <div style={{ padding: "0 16px 12px" }}>
        {uid !== myUid && !isFriend ? <Btn onClick={() => { onAddFriend(uid); onBack(); }} icon="+">Ajouter à mon cercle</Btn> : <Btn variant="ghost" icon="✓">Dans ton cercle</Btn>}
      </div>
      {commonEvents.length > 0 && <><div style={s.sectionLabel}>Cercles en commun</div>{commonEvents.map(ev => <div key={ev.id} style={{ margin: "6px 12px", borderRadius: 12, background: C.card, border: `0.5px solid ${C.cardBorder}`, padding: "11px 13px" }}><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{ev.title}</div><div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>📅 {ev.date || formatDateFR(ev.dateISO)}</div></div>)}</>}
    </div>
  );
};

const EventDetail = ({ ev, onBack, onAction, myUid, onViewProfile, onManage, showToast }) => {
  const participants = ev.participants || [];
  const requests = ev.requests || [];
  const photos = ev.photos || [];
  const announcements = ev.announcements || [];
  const isFull = participants.length >= ev.maxSpots;
  const isParticipant = participants.includes(myUid);
  const hasRequested = requests.includes(myUid);
  const isOrganizer = ev.organizer === myUid;
  const [uploading, setUploading] = useState(false);
  const [annText, setAnnText] = useState("");

  const handlePhotoUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev2 => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; } }
        else { if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        onAction("photo", ev.id, canvas.toDataURL("image/jpeg", 0.75));
        setUploading(false);
      };
      img.src = ev2.target.result;
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleShare = () => {
    const url = `${window.location.origin}/event/${ev.id}`;
    if (navigator.share) {
      navigator.share({ title: ev.title, text: `Rejoins mon cercle : ${ev.title}`, url });
    } else {
      navigator.clipboard.writeText(url);
      showToast("🔗 Lien copié !");
    }
  };

  const handleSendAnn = async () => {
    if (!annText.trim()) return;
    await onAction("announce", ev.id, annText.trim());
    setAnnText("");
    showToast("📣 Annonce envoyée !");
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ background: `linear-gradient(180deg, #14142a, ${C.surface})`, padding: "16px 16px 20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer", marginBottom: 12 }}>←</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{ev.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>{ev.title}</div>
          </div>
          <button onClick={handleShare} style={{ background: C.accentDim, border: `0.5px solid ${C.cardBorder}`, borderRadius: 10, padding: "8px 12px", color: C.accentLight, fontSize: 12, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            🔗 Partager
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[["📅", `${ev.date || formatDateFR(ev.dateISO)}${ev.time ? ` à ${ev.time}` : ""}`], ["📍", ev.location], ["👥", `${participants.length} / ${ev.maxSpots} participants`], ["👤", `Organisé par ${ev.organizerName || "..."}`]].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>{icon}</span><span style={{ fontSize: 12, color: C.textMuted }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 8px" }}>
        <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Dans le cercle</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {participants.map(pid => (
            <div key={pid} onClick={() => pid !== myUid && onViewProfile(pid)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: pid !== myUid ? "pointer" : "default" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: pid === myUid ? `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})` : C.accentDim, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, border: pid === ev.organizer ? `2px solid ${C.accent}` : "none" }}>
                {pid === myUid ? "Toi" : pid.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 9, color: C.textDim }}>{pid === ev.organizer ? "Orga" : pid === myUid ? "Toi" : "Membre"}</span>
            </div>
          ))}
        </div>
      </div>

      {isOrganizer && requests.length > 0 && (
        <div style={{ padding: "8px 16px" }}>
          <div style={{ fontSize: 11, color: C.accent, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>🔔 Demandes · {requests.length}</div>
          {requests.map(pid => (
            <div key={pid} style={{ background: C.card, border: `0.5px solid ${C.cardBorder}`, borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>{pid.slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.text, cursor: "pointer" }} onClick={() => onViewProfile(pid)}>Voir le profil →</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>Veut rejoindre le cercle</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => { onAction("accept", ev.id, pid); showToast("✅ Accepté !"); }} style={{ flex: 1, background: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`, color: "#fff", border: "none", borderRadius: 8, padding: "7px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Accepter</button>
                <button onClick={() => { onAction("decline", ev.id, pid); showToast("❌ Refusé"); }} style={{ flex: 1, background: C.dangerDim, color: C.danger, border: `0.5px solid #3a2020`, borderRadius: 8, padding: "7px 0", fontSize: 12, cursor: "pointer" }}>Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={s.divider} />

      {ev.ended ? (
        <div style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Souvenirs 📸</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "1", background: C.card, border: `0.5px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.startsWith("data:") || p.startsWith("http") ? <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32 }}>{p}</span>}
              </div>
            ))}
            <label style={{ borderRadius: 12, aspectRatio: "1", background: "#141420", border: `1.5px dashed ${C.cardBorder}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer", gap: 6 }}>
              <span style={{ fontSize: 28 }}>{uploading ? "⏳" : "📷"}</span>
              <span style={{ fontSize: 10, color: C.textDim }}>{uploading ? "Envoi..." : "Ajouter"}</span>
              {!uploading && <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />}
            </label>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 16px" }}>
          {isOrganizer && (
            <div style={{ background: "#141420", border: `0.5px solid ${C.divider}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.accent, marginBottom: 8, fontWeight: 600 }}>📣 Annonce aux participants</div>
              {announcements.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {announcements.map((a, i) => (
                    <div key={i} style={{ background: C.card, borderRadius: 8, padding: "7px 10px", marginBottom: 5, fontSize: 12, color: C.textMuted }}>
                      <span style={{ color: C.accent, fontSize: 10 }}>{a.date} {a.time} — </span>{a.text}
                    </div>
                  ))}
                </div>
              )}
              <input value={annText} onChange={e => setAnnText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendAnn()} placeholder="Ex: RDV métro Oberkampf à 19h45..." style={{ ...s.inp, marginTop: 0 }} />
              <Btn variant="secondary" onClick={handleSendAnn} disabled={!annText.trim()}>Envoyer à tous</Btn>
            </div>
          )}
          {!isOrganizer && announcements.length > 0 && (
            <div style={{ background: "#141420", border: `0.5px solid ${C.divider}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.accent, marginBottom: 8, fontWeight: 600 }}>📣 Annonces</div>
              {announcements.map((a, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 8, padding: "7px 10px", marginBottom: 5, fontSize: 12, color: C.textMuted }}>
                  <span style={{ color: C.accent, fontSize: 10 }}>{a.date} {a.time} — </span>{a.text}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#141420", border: `0.5px solid ${C.divider}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>Discussion disponible <span style={{ color: C.accentLight, fontWeight: 500 }}>après la sortie</span>.<br />Souvenirs · photos · moments.</div>
          </div>
          {!isOrganizer && !isParticipant && !hasRequested && !isFull && (
            <Btn onClick={async () => { await onAction("request", ev.id, myUid); showToast("✅ Demande envoyée !"); }}>
              Rejoindre · {ev.maxSpots - participants.length} place{ev.maxSpots - participants.length > 1 ? "s" : ""}
            </Btn>
          )}
          {hasRequested && <Btn variant="ghost">Demande envoyée ⏳</Btn>}
          {isParticipant && !isOrganizer && <Btn variant="ghost">Tu es dans ce cercle ✓</Btn>}
          {isOrganizer && <Btn variant="secondary" onClick={() => onManage(ev)} icon="⚙️">Gérer le cercle</Btn>}
          {isFull && !isParticipant && !isOrganizer && <Btn variant="danger">Cercle complet</Btn>}
        </div>
      )}
    </div>
  );
};

export default function App({ user }) {
  const [navStack, setNavStack] = useState(["feed"]);
  const tab = navStack[navStack.length - 1];
  const navigate = (t) => setNavStack(s => [...s, t]);
  const goBack = () => setNavStack(s => s.length > 1 ? s.slice(0, -1) : s);
  const setTab = (t) => setNavStack([t]);

  const [selected, setSelected] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState({});
  const [viewingUid, setViewingUid] = useState(null);
  const [managingEv, setManagingEv] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [toast, setToast] = useState("");

  const [profile, saveProfile] = useProfile(user);
  const { events, createEvent, updateEvent, endEvent, deleteEvent, requestJoin, acceptRequest, declineRequest, addPhoto, sendAnnouncement } = useEvents(user);
  const { friends, addFriend } = useFriends(user);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const notifCount = events.filter(e => e.organizer === user.uid).reduce((acc, ev) => acc + (ev.requests || []).length, 0);

  // selected dérivé depuis events pour rester synchronisé
  const selectedEvent = selected ? (events.find(e => e.id === selected.id) ?? selected) : null;

  const handleOpen = ev => { setSelected(ev); navigate("detail"); };

  const handleAction = async (type, evId, payload) => {
    if (type === "request") await requestJoin(evId);
    if (type === "accept") await acceptRequest(evId, payload);
    if (type === "decline") await declineRequest(evId, payload);
    if (type === "photo") await addPhoto(evId, payload);
    if (type === "announce") await sendAnnouncement(evId, payload);
  };

  const handleSend = (friendId, text) => {
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages(prev => ({ ...prev, [friendId]: [...(prev[friendId] || []), { from: "me", text, time }] }));
  };

  const openConv = (uid) => {
    const friend = friends.find(f => f.uid === uid);
    setActiveConv(uid);
    setActiveFriend(friend || { uid, name: uid });
    navigate("conv");
  };

  const viewProfile = (uid) => { setViewingUid(uid); navigate("userprofile"); };

  if (!profile) return (
    <div style={{ background: "#0d0d15", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#7b6fe8", fontSize: 36 }}>◎</span>
    </div>
  );

  const hiddenNav = ["detail", "create", "conv", "editprofile", "userprofile", "manage"];

  return (
    <div style={s.app}>
      <Toast msg={toast} />
      {showNotifs && (
        <NotifsPanel events={events} myUid={user.uid}
          onAccept={(evId, uid) => { acceptRequest(evId, uid); showToast("✅ Accepté !"); }}
          onDecline={(evId, uid) => { declineRequest(evId, uid); showToast("❌ Refusé"); }}
          onClose={() => setShowNotifs(false)} />
      )}
      {tab === "manage" && managingEv
        ? <ManageCircleScreen ev={managingEv} onBack={() => { setManagingEv(null); goBack(); }} onUpdate={updateEvent} onEnd={async (id) => { await endEvent(id); setTab("feed"); setSelected(null); }} onDelete={async (id) => { await deleteEvent(id); setTab("feed"); setSelected(null); }} showToast={showToast} />
        : tab === "conv" && activeConv
        ? <ConversationScreen friendId={activeConv} friendName={activeFriend?.name} onBack={() => { goBack(); setActiveConv(null); setActiveFriend(null); }} messages={messages[activeConv] || []} onSend={handleSend} />
        : tab === "editprofile"
        ? <EditProfileScreen profile={profile} onSave={saveProfile} onBack={goBack} user={user} />
        : tab === "userprofile" && viewingUid
        ? <UserProfileScreen uid={viewingUid} onBack={() => { goBack(); setViewingUid(null); }} myUid={user.uid} onAddFriend={addFriend} friends={friends} events={events} />
        : tab === "detail" && selectedEvent
        ? <EventDetail ev={selectedEvent} onBack={() => { goBack(); setSelected(null); }} onAction={handleAction} myUid={user.uid} onViewProfile={viewProfile} showToast={showToast}
            onManage={ev => { setManagingEv(ev); navigate("manage"); }} />
        : tab === "create"
        ? <CreateScreen onCreate={createEvent} onBack={() => setTab("feed")} />
        : <>
          {tab === "feed" && <FeedScreen events={events} onOpen={handleOpen} profile={profile} myUid={user.uid} notifCount={notifCount} onOpenNotifs={() => setShowNotifs(true)} />}
          {tab === "myevents" && <MyEventsScreen events={events} onOpen={handleOpen} myUid={user.uid} />}
          {tab === "friends" && <FriendsScreen onOpenConv={openConv} messages={messages} friends={friends} onAddFriend={addFriend} />}
          {tab === "profile" && <ProfileScreen events={events} profile={profile} onEdit={() => navigate("editprofile")} user={user} myUid={user.uid} />}
        </>}
      {!hiddenNav.includes(tab) && <BottomNav tab={tab} setTab={setTab} />}
    </div>
  );
}