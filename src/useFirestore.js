import { useState, useEffect } from "react";
import {
  doc, collection, onSnapshot, setDoc, updateDoc,
  arrayUnion, arrayRemove, addDoc, deleteDoc, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── useProfile ────────────────────────────────────────────────
export function useProfile(user) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        const defaultProfile = { name: user.displayName || "", photo: user.photoURL || "", city: "", bio: "", uid: user.uid };
        setDoc(ref, defaultProfile);
        setProfile(defaultProfile);
      }
    });
    return unsub;
  }, [user?.uid]);

  const saveProfile = async (data) => {
    if (!user?.uid) return;
    const { photo, ...rest } = data;
    const toSave = { ...rest, uid: user.uid };
    if (photo && photo.length < 900000) toSave.photo = photo;
    await setDoc(doc(db, "users", user.uid), toSave, { merge: true });
  };

  return [profile, saveProfile];
}

// ─── useUserProfile ────────────────────────────────────────────
export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, "users", uid), snap => {
      setProfile(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return [profile, loading];
}

// ─── useEvents ─────────────────────────────────────────────────
export function useEvents(user) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, "events"), snap => {
      const now = new Date();
      const list = snap.docs.map(d => {
        const data = { id: d.id, ...d.data() };
        if (data.dateISO && !data.ended && new Date(data.dateISO) < now) {
          updateDoc(doc(db, "events", d.id), { ended: true });
          data.ended = true;
        }
        return data;
      });
      list.sort((a, b) => {
        if (!a.dateISO) return 1;
        if (!b.dateISO) return -1;
        return a.dateISO.localeCompare(b.dateISO);
      });
      setEvents(list);
    });
    return unsub;
  }, [user?.uid]);

  const createEvent = async (data) => {
    if (!user?.uid) return;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const organizerName = userSnap.exists() ? (userSnap.data().name || "") : (user.displayName || "");
    await addDoc(collection(db, "events"), {
      ...data,
      organizer: user.uid,
      organizerName,
      participants: [user.uid],
      requests: [],
      photos: [],
      announcements: [],
      ended: false,
      createdAt: serverTimestamp(),
    });
  };

  const updateEvent = async (eventId, data) => {
    await updateDoc(doc(db, "events", eventId), data);
  };

  const endEvent = async (eventId) => {
    await updateDoc(doc(db, "events", eventId), { ended: true });
  };

  const deleteEvent = async (eventId) => {
    await deleteDoc(doc(db, "events", eventId));
  };

  const requestJoin = async (eventId) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, "events", eventId), { requests: arrayUnion(user.uid) });
  };

  const acceptRequest = async (eventId, uid) => {
    await updateDoc(doc(db, "events", eventId), { participants: arrayUnion(uid), requests: arrayRemove(uid) });
  };

  const declineRequest = async (eventId, uid) => {
    await updateDoc(doc(db, "events", eventId), { requests: arrayRemove(uid) });
  };

  const addPhoto = async (eventId, dataUrl) => {
    await updateDoc(doc(db, "events", eventId), { photos: arrayUnion(dataUrl) });
  };

  const sendAnnouncement = async (eventId, text) => {
    const ann = {
      text,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toLocaleDateString("fr-FR"),
    };
    await updateDoc(doc(db, "events", eventId), { announcements: arrayUnion(ann) });
  };

  return { events, createEvent, updateEvent, endEvent, deleteEvent, requestJoin, acceptRequest, declineRequest, addPhoto, sendAnnouncement };
}

// ─── useFriends ────────────────────────────────────────────────
export function useFriends(user) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, "friends", user.uid);
    const unsub = onSnapshot(ref, async snap => {
      if (!snap.exists()) { setFriends([]); return; }
      const uids = snap.data().list || [];
      if (uids.length === 0) { setFriends([]); return; }
      const profiles = await Promise.all(
        uids.map(async uid => {
          const pSnap = await getDoc(doc(db, "users", uid));
          return pSnap.exists() ? { uid, ...pSnap.data() } : { uid, name: uid, photo: "" };
        })
      );
      setFriends(profiles);
    });
    return unsub;
  }, [user?.uid]);

  const addFriend = async (uid) => {
    if (!user?.uid || uid === user.uid) return;
    const ref = doc(db, "friends", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { list: [uid] });
    else await updateDoc(ref, { list: arrayUnion(uid) });
    // Relation réciproque
    const refOther = doc(db, "friends", uid);
    const snapOther = await getDoc(refOther);
    if (!snapOther.exists()) await setDoc(refOther, { list: [user.uid] });
    else await updateDoc(refOther, { list: arrayUnion(user.uid) });
  };

  return { friends, addFriend };
}