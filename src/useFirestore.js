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
    await setDoc(doc(db, "users", user.uid), { ...data, uid: user.uid }, { merge: true });
    setProfile(data);
  };

  return [profile, saveProfile];
}

// ── Events ──────────────────────────────────────────────────────
export function useEvents(user) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "events"), snap => {
      const evs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(evs);
    });
    return unsub;
  }, [user]);

  const createEvent = async (form) => {
    await addDoc(collection(db, "events"), {
      ...form,
      organizer: user.uid,
      organizerName: user.displayName,
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