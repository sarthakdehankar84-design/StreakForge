// --- Dashboard.tsx ---

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Zap, Trophy, ChevronRight, Star, TrendingUp, Swords, ShieldCheck } from "lucide-react";
import { getUser, getHabits, completeHabit, isHabitCompletedToday, todayStr, getMissedStreakInfo } from "@/lib/storage";
import { mockDailyStats } from "@/lib/mockData";
import type { User as LocalAppUser, Habit } from "@/types"; // Aliased to LocalAppUser to avoid conflict with Firebase User
import CircularProgress from "@/components/features/CircularProgress";
import XPBar from "@/components/features/XPBar";
import HabitCard from "@/components/features/HabitCard";
import XPToast from "@/components/features/XPToast";
import LevelUpOverlay from "@/components/features/LevelUpOverlay";
import ShieldModal from "@/components/features/ShieldModal";
import DailyChallenges from "@/components/features/DailyChallenges";

// --- START: Firebase Imports and DashboardProps Interface ---
// Firebase types ko import karein
import { User as FirebaseAuthUser } from 'firebase/auth'; // Firebase Authentication se user
import { Firestore } from 'firebase/firestore';     // Firestore database instance
import { Auth } from 'firebase/auth';             // Firebase Auth instance

// Yeh interface batata hai ki Dashboard component ko kaunse props milenge
interface DashboardProps {
  user: FirebaseAuthUser; // Firebase Authentication se aaya hua user object
  db: Firestore;      // Firestore database instance
  auth: Auth;         // Firebase Authentication instance
}
// --- END: Firebase Imports and DashboardProps Interface ---


// Ab Dashboard component ko props (user, db, auth) milenge main.tsx se
export default function Dashboard({ user: firebaseAuthUser, db, auth }: DashboardProps) { // 'user' prop ko 'firebaseAuthUser' rename kiya
  // Existing local state for app-specific user data (from local storage)
  // TODO: Abhi yeh getUser() local storage se la raha hai. Eventually, isko Firebase Firestore se fetch karna hoga.
  const [localAppUser, setLocalAppUser] = useState<LocalAppUser>(getUser());
  const [habits, setHabits] = useState<Habit[]>(getHabits()); // Habits bhi local storage se aa rahi hain
  const [toast, setToast] = useState<{ xp: number; name: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);
  const [shieldModal, setShieldModal] = useState<{ streakAtRisk: number } | null>(null);

  // --- START: Firebase User Effect (New) ---
  // Is useEffect se hum Firebase authenticated user (firebaseAuthUser) ko monitor karenge.
  // Jab firebaseAuthUser available ho, toh hum corresponding app-specific user data (localAppUser) ko
  // Firestore se fetch karna shuru kar sakte hain. Abhi ke liye, yeh sirf log karega.
  useEffect(() => {
    if (firebaseAuthUser) {
      console.log("Firebase authenticated user available:", firebaseAuthUser.uid, "Email:", firebaseAuthUser.email);
      // TODO: Yahan par Firestore se `users` collection mein firebaseAuthUser.uid ke through user ka profile data fetch karein.
      // fetchUserFromFirestore(firebaseAuthUser.uid, db).then(data => setLocalAppUser(data));
      // Aur agar data nahi milta to naya profile bana sakte hain.
    } else {
      console.log("No Firebase authenticated user. Local storage user is being used.");
      // Jab user logged out ho, ya auth check ho raha ho.
      // localAppUser ko reset kar sakte hain ya null set kar sakte hain agar zaroori ho.
      setLocalAppUser(getUser()); // Ensure local storage user is still set if needed.
    }
  }, [firebaseAuthUser, db]); // Jab Firebase auth user ya db instance badle
  // --- END: Firebase User Effect ---


  // Check for missed streak once per day session
  useEffect(() => {
    const sessionKey = `sf_shield_check_${todayStr()}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      const { missed, streakAtRisk } = getMissedStreakInfo(); // Abhi bhi local storage se
      if (missed && streakAtRisk > 0) {
        setTimeout(() => setShieldModal({ streakNo response
                                         
