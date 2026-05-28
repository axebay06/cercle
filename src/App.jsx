import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useProfile, useEvents, useMessages, useFriends } from "./useFirestore";

const C = {
  bg: "#0d0d15", surface: "#111118", card: "#18182a", cardBorder: "#28283e",
  accent: "#7b6fe8", accentLight: "#8b7ef8", accentDim: "#1e1e40",
  text: "#e0dff5", textMuted: "#a0a0c0", textDim: "#5a5a7a",
  danger: "#c47a6a", dangerDim: "#2a1a1a",
  success: "#5a9a8a", successDim: "#1a2020",
  navBg: "#0d0d15", divider: "#1e1e2e",
};

const SUGGESTED = [
  { id: "camille", name: "Camille R.", initials: "CR", color: "#e8a84a", bg: "#2a2010", mutuals: 4 },
  { id: "theo", name: "Théo M.", initials: "TM", color: "#5aaa7a", bg: "#1a2a1e", mutuals: 3 },
  { id: "ines", name: "Inès B.", initials: "IB", color: "#c47ab8", bg: "#2a1a2a", mutuals: 2 },
  { id: "lucas", name: "Lucas D.", initials: "LD", color: "#7ab8e8", bg: "#1a2030", mutuals: 2 },
];

const s = {
  app: { maxWidth: 430, margin: "0 auto", background: C.surface, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text },
  card: { margin: "8px 12px", borderRadius: 12, background: C.card, border: `0.5px solid ${C.cardBorder}`, padding: 12, cursor: "pointer" },
  header: { padding: "14px 16px 10px", borderBottom: `0.5px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: 600, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 16px 2px" },
  divider: { height: 0.5, background: C.divider, margin: "6px 0" },
  inp: { background: "#18182a", border: `0.5px solid #28283e`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#e0dff5", width: "100%", outline: "none", marginTop: 4 },
};

const Avatar = ({ user, size = 32, photo }) => (
  photo
    ? <img src={photo} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: "50%", background: user?.bg || C.accentDim, color: user?.color || C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 500, flexShrink: 0 }}>{user?.initials || "?"}</div>
);

const Badge = ({ children, color = C.accent, bg = C.accentDim }) => (
  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: bg, color, display: "inline-block" }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", full = true, disabled = false }) => {
  const vs = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    secondary: { background: "#1e1e30", color: C.accentLight, border: `0.5px solid #2e2e4e` },
    danger: { background: C.dangerDim, color: C.danger, border: `0.5px solid #3a2020` },
    ghost: { background: "transparent", color: C.textMuted, border: `0.5px solid ${C.cardBorder}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...vs[variant], borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto", marginTop: 6, opacity: disabled ? 0.5 : 1 }}>{children}</button>;
};

const SpotDots = ({ filled, total }) => (
  <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 5 }}>
    {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
      <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < filled ? C.accent : "#2a2a3e", display: "inline-block" }} />
    ))}
    <span style={{ fontSize: 10, color: C.textDim, marginLeft: 4 }}>{filled}/{total} places</span>
  </div>
);

const Logo = () => (
  <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.5px" }}>
    <span style={{ color: C.accent }}>◎</span><span style={{ color: C.text }}> Cercle</span>
  </span>
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
    <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 14px", borderTop: `0.5px solid ${C.divider}`, background: C.navBg, position: "sticky", bottom: 0 }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setTab(it.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "0 8px" }}>
          <span style={{ fontSize: it.id === "create" ? 22 : 18, color: it.id === "create" ? C.accent : "inherit" }}>{it.icon}</span>
          <span style={{ fontSize: 9, color: tab === it.id ? C.accent : C.textDim }}>{it.label}</span>
          {tab === it.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent }} />}
        </button>
      ))}
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
  return (
    <div onClick={() => onOpen(ev)} style={s.card}>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 3 }}>{ev.title}</div>
      <div style={{ fontSize: 11, color: C.textDim, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span>📅 {ev.date} · {ev.time}</span>
        <span>📍 {ev.location}</span>
      </div>
      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ev.ended
          ? <Badge color={C.textDim} bg="#1a1a28">Terminé · {(ev.photos||[]).length} souvenir{(ev.photos||[]).length > 1 ? "s" : ""}</Badge>
          : isOrganizer ? <Badge>Ton cercle</Badge>
          : isParticipant ? <Badge color={C.success} bg={C.successDim}>Tu participes ✓</Badge>
          : hasRequested ? <Badge color={C.textMuted} bg="#1e1e30">Demande envoyée…</Badge>
          : isFull ? <Badge color={C.danger} bg={C.dangerDim}>Complet</Badge>
          : <Badge>{ev.mutualFriends || 0} ami{(ev.mutualFriends||0) > 1 ? "s" : ""} en commun</Badge>}
      </div>
      {!ev.ended && <SpotDots filled={participants.length} total={ev.maxSpots} />}
    </div>
  );
};

const FeedScreen = ({ events, onOpen, profile, myUid }) => (
  <div style={{ flex: 1, overflowY: "auto" }}>
    <div style={{ ...s.header, justifyContent: "space-between" }}>
      <div><Logo /><div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Bonjour {profile?.name} 👋</div></div>
      <span style={{ fontSize: 20 }}>🔔</span>
    </div>
    <div style={s.sectionLabel}>Cercles près de toi</div>
    {events.filter(e => !e.ended).map(ev => <EventCard key={ev.id} ev={ev} onOpen={onOpen} myUid={myUid} />)}
    {events.filter(e => !e.ended).length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucun cercle actif pour l'instant</div>}
  </div>
);

const MyEventsScreen = ({ events, onOpen, myUid }) => {
  const mine = events.filter(e => e.organizer === myUid || (e.participants || []).includes(myUid));
  const upcoming = mine.filter(e => !e.ended);
  const past = mine.filter(e => e.ended);
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ ...s.header, justifyContent: "space-between" }}><Logo /></div>
      {upcoming.length > 0 && <>
        <div style={s.sectionLabel}>À venir</div>
        {upcoming.map(ev => <EventCard key={ev.id} ev={ev} onOpen={onOpen} myUid={myUid} />)}
      </>}
      {past.length > 0 && <>
        <div style={{ ...s.sectionLabel, color: C.textDim }}>Passés · Mémoires</div>
        {past.map(ev => <EventCard key={ev.id} ev={ev} onOpen={onOpen} myUid={myUid} />)}
      </>}
      {mine.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.textDim, fontSize: 13 }}>Tu n'as pas encore de cercle.<br />Crée-en un ou rejoins celui d'un ami !</div>}
    </div>
  );
};

const CreateScreen = ({ onCreate, onBack }) => {
  const [form, setForm] = useState({ title: "", date: "", time: "", location: "", maxSpots: 4 });
  const [emoji, setEmoji] = useState("🎉");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const emojis = ["🎳", "🌿", "🔐", "🍕", "🎬", "🏃", "🎮", "🎉", "🍻", "🌆"];
  const submit = () => {
    if (!form.title || !form.date || !form.location) return alert("Remplis au moins le titre, la date et le lieu !");
    onCreate({ ...form, emoji, title: `${form.title} ${emoji}` });
    onBack();
  };
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <span style={{ fontSize: 15, fontWeight: 500, color: C.text }}>Créer un cercle</span>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>Ambiance</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {emojis.map(e => <button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 20, background: emoji === e ? C.accentDim : "#18182a", border: `0.5px solid ${emoji === e ? C.accent : C.cardBorder}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>{e}</button>)}
          </div>
        </div>
        {[["Titre", "title", "Ex: Soirée bowling..."], ["Date", "date", "Ex: Sam 31 mai"], ["Heure", "time", "Ex: 20h00"], ["Lieu", "location", "Ex: Paris 11e"]].map(([label, key, ph]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.textDim }}>{label}</div>
            <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} style={s.inp} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>Places max : <span style={{ color: C.accent, fontWeight: 600 }}>{form.maxSpots}</span></div>
          <input type="range" min={2} max={20} value={form.maxSpots} onChange={e => set("maxSpots", Number(e.target.value))} style={{ width: "100%", accentColor: C.accent }} />
        </div>
        <Btn onClick={submit}>Ouvrir le cercle 🎯</Btn>
      </div>
    </div>
  );
};

const FriendsScreen = ({ onOpenConv, messages, friends, onAddFriend }) => (
  <div style={{ flex: 1, overflowY: "auto" }}>
    <div style={{ ...s.header, justifyContent: "space-between" }}>
      <Logo />
      <span style={{ fontSize: 11, color: C.textDim }}>Messages</span>
    </div>
    <div style={s.sectionLabel}>Amis · {friends.length}</div>
    {friends.map(id => {
      const msgs = messages[id] || [];
      const last = msgs[msgs.length - 1];
      const initials = id.slice(0, 2).toUpperCase();
      return (
        <div key={id} onClick={() => onOpenConv(id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${C.divider}`, cursor: "pointer" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{id}</div>
            <div style={{ fontSize: 11, color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {last ? (last.from === "me" ? `Toi : ${last.text}` : last.text) : "Commencer une conversation"}
            </div>
          </div>
          {last && <span style={{ fontSize: 10, color: C.textDim, flexShrink: 0 }}>{last.time}</span>}
        </div>
      );
    })}
    <div style={{ ...s.sectionLabel, color: C.textDim, marginTop: 8 }}>Suggestions</div>
    {SUGGESTED.filter(s => !friends.includes(s.id)).map(u => (
      <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${C.divider}` }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: u.bg, color: u.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500 }}>{u.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{u.name}</div>
          <div style={{ fontSize: 11, color: C.textDim }}>{u.mutuals} ami{u.mutuals > 1 ? "s" : ""} en commun</div>
        </div>
        <button onClick={() => onAddFriend(u.id)} style={{ background: C.accentDim, color: C.accentLight, border: `0.5px solid #2e2e4e`, borderRadius: 8, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>+ Ajouter</button>
      </div>
    ))}
  </div>
);

const ConversationScreen = ({ friendId, onBack, messages, onSend }) => {
  const [input, setInput] = useState("");
  const send = () => {
    if (!input.trim()) return;
    onSend(friendId, input.trim());
    setInput("");
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <div style={{ flex: 1, marginLeft: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{friendId}</div>
          <div style={{ fontSize: 10, color: C.success }}>Dans ton cercle</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && <div style={{ textAlign: "center", color: C.textDim, fontSize: 12, marginTop: 40 }}>Début de ta conversation 👋</div>}
        {messages.map((msg, i) => {
          const isMe = msg.from === "me";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "75%", padding: "8px 12px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMe ? C.accent : C.card, border: isMe ? "none" : `0.5px solid ${C.cardBorder}`, color: isMe ? "#fff" : C.text, fontSize: 13, lineHeight: 1.5 }}>
                {msg.text}
                <div style={{ fontSize: 9, color: isMe ? "rgba(255,255,255,0.6)" : C.textDim, marginTop: 3, textAlign: "right" }}>{msg.time}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "10px 16px 16px", borderTop: `0.5px solid ${C.divider}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Message..." style={{ flex: 1, background: C.card, border: `0.5px solid ${C.cardBorder}`, borderRadius: 20, padding: "8px 14px", fontSize: 13, color: C.text, outline: "none" }} />
        <button onClick={send} style={{ background: C.accent, border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>↑</button>
      </div>
    </div>
  );
};

const EditProfileScreen = ({ profile, onSave, onBack }) => {
  const [form, setForm] = useState({ ...profile });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 400;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        set("photo", canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  };
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <span style={{ fontSize: 15, fontWeight: 500, color: C.text }}>Modifier le profil</span>
      </div>
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <label style={{ cursor: "pointer", position: "relative" }}>
          {form.photo
            ? <img src={form.photo} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.accent}` }} />
            : <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 500, border: `2px solid ${C.accent}` }}>AX</div>}
          <div style={{ position: "absolute", bottom: 0, right: 0, background: C.accent, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📷</div>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </label>
        <span style={{ fontSize: 11, color: C.textDim }}>Appuie pour changer la photo</span>
      </div>
      <div style={{ padding: "0 16px" }}>
        {[["Prénom", "name", "Ton prénom"], ["Ville", "city", "Paris..."], ["Bio", "bio", "Dis quelque chose sur toi..."]].map(([label, key, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.textDim }}>{label}</div>
            <input value={form[key] || ""} onChange={e => set(key, e.target.value)} placeholder={ph} style={s.inp} />
          </div>
        ))}
        <Btn onClick={() => { onSave(form); onBack(); }}>Enregistrer ✓</Btn>
      </div>
    </div>
  );

const ProfileScreen = ({ events, profile, onEdit, user, myUid }) => {
  const memories = events.filter(e => e.ended && (e.organizer === myUid || (e.participants || []).includes(myUid)));
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ ...s.header, justifyContent: "space-between" }}><Logo /></div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {profile?.photo
          ? <img src={profile.photo} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.accent}` }} />
          : user?.photoURL
          ? <img src={user.photoURL} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.accent}` }} />
          : <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600 }}>AX</div>}
        <div style={{ fontSize: 17, fontWeight: 500, color: C.text }}>{profile?.name || user?.displayName}</div>
        {profile?.city && <div style={{ fontSize: 12, color: C.textDim }}>📍 {profile.city}</div>}
        {profile?.bio && <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", maxWidth: 260 }}>{profile.bio}</div>}
        <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
          {[["—", "Amis"], [events.filter(e => (e.participants||[]).includes(myUid) || e.organizer === myUid).length.toString(), "Cercles"], [memories.length.toString(), "Mémoires"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: C.accent }}>{n}</div>
              <div style={{ fontSize: 11, color: C.textDim }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 16px 8px" }}>
        <Btn variant="secondary" onClick={onEdit}>✏️ Modifier le profil</Btn>
        <Btn variant="danger" onClick={() => signOut(auth)}>Déconnexion</Btn>
      </div>
      <div style={s.divider} />
      <div style={s.sectionLabel}>Mes mémoires 📸</div>
      {memories.length === 0 && <div style={{ padding: "12px 16px", fontSize: 12, color: C.textDim }}>Tes souvenirs apparaîtront ici après chaque sortie.</div>}
      {memories.map(ev => (
        <div key={ev.id} style={{ margin: "8px 12px", borderRadius: 12, background: C.card, border: `0.5px solid ${C.cardBorder}`, padding: 12 }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>{ev.emoji}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{ev.title}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{ev.date} · {(ev.participants||[]).length} personnes</div>
          {(ev.photos||[]).length > 0 && <div style={{ fontSize: 11, color: C.accent, marginTop: 4 }}>{ev.photos.length} souvenir{ev.photos.length > 1 ? "s" : ""}</div>}
        </div>
      ))}
    </div>
  );
};

const EventDetail = ({ ev, onBack, onAction, myUid }) => {
  const participants = ev.participants || [];
  const requests = ev.requests || [];
  const photos = ev.photos || [];
  const isFull = participants.length >= ev.maxSpots;
  const isParticipant = participants.includes(myUid);
  const hasRequested = requests.includes(myUid);
  const isOrganizer = ev.organizer === myUid;
  const [uploading, setUploading] = useState(false);

  const getName = uid => uid === myUid ? "Toi" : uid.slice(0, 8) + "...";

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev2 => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
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

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 18, cursor: "pointer" }}>←</button>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.text, flex: 1 }}>{ev.title}</div>
      </div>
      <div style={{ padding: "10px 16px 0" }}>
        {[["📅", `${ev.date} · ${ev.time}`], ["📍", ev.location], ["👥", `${participants.length} / ${ev.maxSpots} participants`], ["👤", `Cercle de ${ev.organizerName || "..."}`]].map(([icon, text]) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
            <span>{icon}</span><span style={{ fontSize: 12, color: C.textMuted }}>{text}</span>
          </div>
        ))}
      </div>
      <div style={s.divider} />
      <div style={{ padding: "0 16px 8px" }}>
        <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8 }}>Dans le cercle</div>
        {participants.map(pid => (
          <div key={pid} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>
              {getName(pid).slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: C.textMuted, flex: 1 }}>{getName(pid)}</span>
            {pid === ev.organizer && <Badge>Créateur</Badge>}
            {pid === myUid && pid !== ev.organizer && <Badge color={C.success} bg={C.successDim}>Toi</Badge>}
          </div>
        ))}
      </div>

      {isOrganizer && requests.length > 0 && (
        <>
          <div style={s.divider} />
          <div style={{ padding: "8px 16px" }}>
            <div style={{ fontSize: 11, color: C.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Demandes · {requests.length}</div>
            {requests.map(pid => (
              <div key={pid} style={{ background: C.card, border: `0.5px solid ${C.cardBorder}`, borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{pid.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{pid.slice(0, 12)}...</div>
                    <div style={{ fontSize: 10, color: C.textDim }}>Demande à rejoindre</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => onAction("accept", ev.id, pid)} style={{ flex: 1, background: C.accent, color: "#fff", border: "none", borderRadius: 6, padding: "5px 0", fontSize: 11, cursor: "pointer" }}>Accepter</button>
                  <button onClick={() => onAction("decline", ev.id, pid)} style={{ flex: 1, background: C.dangerDim, color: C.danger, border: `0.5px solid #3a2020`, borderRadius: 6, padding: "5px 0", fontSize: 11, cursor: "pointer" }}>Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={s.divider} />

      {ev.ended ? (
        <div style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Souvenirs du cercle 📸</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: C.card, border: `0.5px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.startsWith("data:") || p.startsWith("http")
                  ? <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 28 }}>{p}</span>}
              </div>
            ))}
            <label style={{ borderRadius: 10, aspectRatio: "1", background: "#141420", border: `1px dashed ${C.cardBorder}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer", gap: 4 }}>
              <span style={{ fontSize: 24 }}>{uploading ? "⏳" : "📷"}</span>
              <span style={{ fontSize: 10, color: C.textDim }}>{uploading ? "Envoi..." : "Ajouter"}</span>
              {!uploading && <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />}
            </label>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 16px" }}>
          {isOrganizer && (
            <div style={{ background: "#141420", border: `0.5px solid ${C.divider}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: C.accent, marginBottom: 6, fontWeight: 600 }}>📣 Envoyer une annonce</div>
              <input placeholder="Ex: RDV métro Oberkampf à 19h45..." style={{ ...s.inp, marginTop: 0 }} />
              <Btn variant="secondary">Envoyer à tous</Btn>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#141420", border: `0.5px solid ${C.divider}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <span>🔒</span>
            <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>
              Discussion disponible <span style={{ color: C.accentLight }}>après la sortie</span>.<br />Souvenirs · photos · moments.
            </div>
          </div>
          {!isOrganizer && !isParticipant && !hasRequested && !isFull && <Btn onClick={() => onAction("request", ev.id, myUid)}>Rejoindre le cercle · {ev.maxSpots - participants.length} place{ev.maxSpots - participants.length > 1 ? "s" : ""}</Btn>}
          {hasRequested && <Btn variant="ghost">Demande envoyée ⏳</Btn>}
          {isParticipant && !isOrganizer && <Btn variant="ghost">Tu es dans ce cercle ✓</Btn>}
          {isOrganizer && <Btn variant="secondary">Gérer le cercle</Btn>}
          {isFull && !isParticipant && !isOrganizer && <Btn variant="danger">Cercle complet</Btn>}
        </div>
      )}
    </div>
  );
};

export default function App({ user }) {
  const [tab, setTab] = useState("feed");
  const [selected, setSelected] = useState(null);
  const [prevTab, setPrevTab] = useState("feed");
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState({});

  const [profile, saveProfile] = useProfile(user);
  const { events, createEvent, requestJoin, acceptRequest, declineRequest, addPhoto } = useEvents(user);
  const { friends, addFriend } = useFriends(user);

  const handleOpen = ev => { setPrevTab(tab); setSelected(ev); setTab("detail"); };

  const handleAction = async (type, evId, payload) => {
    if (type === "request") await requestJoin(evId);
    if (type === "accept") await acceptRequest(evId, payload);
    if (type === "decline") await declineRequest(evId, payload);
    if (type === "photo") await addPhoto(evId, payload);
    // Mise à jour locale immédiate pour éviter le reset visuel
    setSelected(prev => {
      if (!prev || prev.id !== evId) return prev;
      if (type === "request") return { ...prev, requests: [...(prev.requests || []), payload] };
      if (type === "accept") return { ...prev, participants: [...(prev.participants || []), payload], requests: (prev.requests || []).filter(r => r !== payload) };
      if (type === "decline") return { ...prev, requests: (prev.requests || []).filter(r => r !== payload) };
      if (type === "photo") return { ...prev, photos: [...(prev.photos || []), payload] };
      return prev;
    });
  };

  const handleSend = (friendId, text) => {
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages(prev => ({ ...prev, [friendId]: [...(prev[friendId] || []), { from: "me", text, time }] }));
  };

  const openConv = id => { setActiveConv(id); setTab("conv"); };

  if (!profile) return (
    <div style={{ background: "#0d0d15", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#7b6fe8", fontSize: 32 }}>◎</span>
    </div>
  );

  return (
    <div style={s.app}>
      {tab === "conv" && activeConv
        ? <ConversationScreen friendId={activeConv} onBack={() => { setTab("friends"); setActiveConv(null); }} messages={messages[activeConv] || []} onSend={handleSend} />
        : tab === "editprofile"
        ? <EditProfileScreen profile={profile} onSave={saveProfile} onBack={() => setTab("profile")} />
        : tab === "detail" && selected
        ? <EventDetail ev={selected} onBack={() => { setTab(prevTab); setSelected(null); }} onAction={handleAction} myUid={user.uid} />
        : tab === "create"
        ? <CreateScreen onCreate={createEvent} onBack={() => setTab("feed")} />
        : <>
          {tab === "feed" && <FeedScreen events={events} onOpen={handleOpen} profile={profile} myUid={user.uid} />}
          {tab === "myevents" && <MyEventsScreen events={events} onOpen={handleOpen} myUid={user.uid} />}
          {tab === "friends" && <FriendsScreen onOpenConv={openConv} messages={messages} friends={friends} onAddFriend={addFriend} />}
          {tab === "profile" && <ProfileScreen events={events} profile={profile} onEdit={() => setTab("editprofile")} user={user} myUid={user.uid} />}
        </>}
      {!["detail", "create", "conv", "editprofile"].includes(tab) && <BottomNav tab={tab} setTab={setTab} />}
    </div>
  );
}