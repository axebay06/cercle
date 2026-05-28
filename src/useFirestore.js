import { useEffect, useState } from "react";
import {
  collection, doc, setDoc, getDoc, onSnapshot,
  addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ── Profil utilisateur ──────────────────────────────────────────
export function useProfile(user) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    getDoc(ref).then(snap => {
      if (!snap.exists()) {
        const init = { name: user.displayName || "Utilisateur", city: "", bio: "", photo: user.photoURL || null, uid: user.uid };
        setDoc(ref, init);
        setProfile(init);
      } else {
        setProfile(snap.data());
      }
    });
  }, [user]);

  const saveProfile = async (data) => {
    if (!user) return;
    const { photo, ...rest } = data;
    const toSave = { ...rest, uid: user.uid };
    if (photo && photo.length < 900000) toSave.photo = photo;
    await setDoc(doc(db, "users", user.uid), toSave, { merge: true });
    setProfile({ ...data });
  };

  return [profile, saveProfile];
}

// ── Profil d'un autre utilisateur ───────────────────────────────
export function useUserProfile(uid) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getDoc(doc(db, "users", uid)).then(snap => {
      setUserProfile(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, [uid]);

  return [userProfile, loading];
}

// ── Events ──────────────────────────────────────────────────────
export function useEvents(user) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "events"), snap => {
      const now = new Date();
      const evs = snap.docs.map(d => {
        const data = { id: d.id, ...d.data() };
        // Auto-marquer comme terminé si la date est passée
        if (data.dateISO && !data.ended) {
          const eventDate = new Date(data.dateISO);
          if (eventDate < now) {
            updateDoc(doc(db, "events", d.id), { ended: true });
            data.ended = true;
          }
        }
        return data;
      });
      // Trier par date — les plus proches en premier
      evs.sort((a, b) => {
        if (!a.dateISO) return 1;
        if (!b.dateISO) return -1;
        return new Date(a.dateISO) - new Date(b.dateISO);
      });
      setEvents(evs);
    });
    return unsub;
  }, [user]);

  const createEvent = async (form) => {
    await addDoc(collection(db, "events"), {
      ...form,
      organizer: user.uid,
      organizerName: user.displayName || "Utilisateur",
      participants: [user.uid],
      requests: [],
      photos: [],
      ended: false,
      createdAt: serverTimestamp(),
    });
  };

  const requestJoin = async (eventId) => {
    await updateDoc(doc(db, "events", eventId), { requests: arrayUnion(user.uid) });
  };

  const acceptRequest = async (eventId, userId) => {
    await updateDoc(doc(db, "events", eventId), {
      participants: arrayUnion(userId),
      requests: arrayRemove(userId),
    });
  };

  const declineRequest = async (eventId, userId) => {
    await updateDoc(doc(db, "events", eventId), { requests: arrayRemove(userId) });
  };

  const addPhoto = async (eventId, photoData) => {
    await updateDoc(doc(db, "events", eventId), { photos: arrayUnion(photoData) });
  };

  return { events, createEvent, requestJoin, acceptRequest, declineRequest, addPhoto };
}

// ── Messages ────────────────────────────────────────────────────
export function useMessages(user) {
  const [messages, setMessages] = useState({});

  const getConvId = (uid1, uid2) => [uid1, uid2].sort().join("_");

  const listenConv = (friendId) => {
    const convId = getConvId(user.uid, friendId);
    const unsub = onSnapshot(collection(db, "conversations", convId, "messages"), snap => {
      const msgs = snap.docs.map(d => d.data()).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(prev => ({ ...prev, [friendId]: msgs }));
    });
    return unsub;
  };

  const sendMessage = async (friendId, text) => {
    const convId = getConvId(user.uid, friendId);
    await addDoc(collection(db, "conversations", convId, "messages"), {
      from: user.uid,
      text,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      createdAt: serverTimestamp(),
    });
  };

  return { messages, listenConv, sendMessage };
}

// ── Amis ────────────────────────────────────────────────────────
export function useFriends(user) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), snap => {
      if (snap.exists()) setFriends(snap.data().friends || []);
    });
    return unsub;
  }, [user]);

  const addFriend = async (friendId) => {
    await updateDoc(doc(db, "users", user.uid), { friends: arrayUnion(friendId) });
  };

  return { friends, addFriend };
}