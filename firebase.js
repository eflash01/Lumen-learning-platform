import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, increment, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHiqdviQG-uY-YRfXNVlY6waAeAyHuCbs",
  authDomain: "login-aad15.firebaseapp.com",
  projectId: "login-aad15",
  storageBucket: "login-aad15.firebasestorage.app",
  messagingSenderId: "362745117365",
  appId: "1:362745117365:web:e3f0e61b17f3f61bea9cfc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Second app instance so an admin can create accounts without being signed out
export const auth2 = getAuth(initializeApp(firebaseConfig, "creator"));

export { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendPasswordResetEmail,
  doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, increment, writeBatch };

export const $ = id => document.getElementById(id);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const fmt = ts => ts?.toDate ? ts.toDate().toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Never";
export const setMsg = (el, text, kind) => { el.textContent = text; el.className = "msg " + (kind || ""); };

export function friendly(e) {
  const c = e.code || "";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(c)) return "Email or password is incorrect.";
  if (c === "auth/too-many-requests") return "Too many attempts. Wait a few minutes and try again.";
  if (c === "auth/email-already-in-use") return "An account with this email already exists.";
  if (c === "auth/weak-password") return "Password must be at least 6 characters.";
  if (c === "auth/operation-not-allowed") return "Email/Password sign-in is not enabled in Firebase Console (Authentication > Sign-in method).";
  if (c === "auth/unauthorized-domain") return "This web address is not authorized. Add it in Firebase Console > Authentication > Settings > Authorized domains.";
  if (c === "auth/network-request-failed") return "Network error. Check your connection.";
  if (c === "auth/operation-not-supported-in-this-environment") return "Open this page from a web address (http://localhost or your host), not as a local file.";
  if (c.includes("permission-denied")) return "Permission denied. Check your Firestore rules.";
  return e.message || "Something went wrong.";
}

export async function loadProfile(u) {
  const s = await getDoc(doc(db, "users", u.uid));
  return s.exists() ? { uid: u.uid, ...s.data() } : null;
}

// Sign in, then record the login time on the user's profile and in the login log
export async function signInAndRecord(email, pass) {
  const c = await signInWithEmailAndPassword(auth, email, pass);
  const ref = doc(db, "users", c.user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await signOut(auth);
    throw { message: "This account has no profile. Ask your administrator to create it." };
  }
  await updateDoc(ref, { lastLogin: serverTimestamp(), loginCount: increment(1) });
  await addDoc(collection(db, "logins"), { uid: c.user.uid, email: c.user.email, at: serverTimestamp() });
  return { uid: c.user.uid, ...(await getDoc(ref)).data() };
}
