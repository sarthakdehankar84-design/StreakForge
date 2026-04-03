// --- Dashboard.tsx ---

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Zap, Trophy, ChevronRight, Star, TrendingUp, Swords, ShieldCheck } from "lucide-react";
// Ab getUser() ki jagah userProfile se data aayega
import { getHabits, completeHabit, isHabitCompletedToday, todayStr, getMissedStreakInfo } from "@/lib/storage"; // Temporary: local storage se habits
import { mockDailyStats } from "@/lib/mockData";
import type { Habit } from "@/types"; // User type ab FirebaseUser aur userProfile se handle hoga
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
  firebaseUser: FirebaseAuthUser; // Firebase Authentication se user object
  userProfile: any;           // Firestore se fetch kiya hua app-specific user profile (jismein xp, level, streak honge)
  db: Firestore;      // Firestore database instance
  auth: Auth;         // Firebase Authentication instance
}
// --- END: Firebase Imports and DashboardProps Interface ---


// Ab Dashboard component ko props (firebaseUser, userProfile, db, auth) milenge main.tsx se
export default function Dashboard({ firebaseUser, userProfile, db, auth }: DashboardProps) {

  // const [localAppUser, setLocalAppUser] = useState<LocalAppUser>(getUser()); // <-- YE LINE HATANI HAI
  const [habits, setHabits] = useState<Habit[]>(getHabits()); // Habits abhi bhi local storage se aa rahi hain
  const [toast, setToast] = useState<{ xp: number; name: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number } | null>(null);
  const [shieldModal, setShieldModal] = useState<{ streakAtRisk: number } | null>(null);

  // Check for missed streak once per day session
  useEffect(() => {
    const sessionKey = `sf_shield_check_${todayStr()}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      // getMissedStreakInfo ko userProfile ke saath update karna padega
      const { missed, streakAtRisk } = getMissedStreakInfo(); // Abhi bhi local storage se, TODO: Firestore se karein
      if (missed && streakAtRisk > 0) {
        setTimeout(() => setShieldModal({ streakAtRisk }), 1200);
      }
    }
  }, []); // Dependencies ko review karein


  // Calculations ab userProfile ka use karengi
  const todayCompleted = habits.filter(isHabitCompletedToday).length; // Habits abhi local storage se
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;

  const weekStats = mockDailyStats.slice(-7);
  const weekXP = weekStats.reduce((s, d) => s + d.xpEarned, 0); // Isko bhi userProfile se update karna hoga
  const shields = userProfile.shields ?? 0; // Ab userProfile se

  const handleComplete = (habitId: string) => {
    const result = completeHabit(habitId); // Abhi bhi local storage use kar raha hai
    if (result.xpEarned > 0) {
      setHabits(getHabits());
      // TODO: Yahan par Firestore mein userProfile.xp aur other fields ko update karein
      // aur userProfile state ko refresh karein (ya phir main.tsx mein onAuthStateChanged listener handle karega)
      setToast({ xp: result.xpEarned, name: result.habit.name });
      if (result.leveledUp) {
        setTimeout(() => setLevelUp({ level: result.newLevel }), 600);
      }
    }
  };

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - 6 + i);
    return {
      day: dayNames[d.getDay()],
      date: d.toISOString().split("T")[0],
      isToday: d.toISOString().split("T")[0] === todayStr(),
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] pb-nav">
      {levelUp && (
        <LevelUpOverlay
          level={levelUp.level}
          onDismiss={() => setLevelUp(null)}
        />
      )}
      {shieldModal && (
        <ShieldModal
          missedStreak={shieldModal.streakAtRisk}
          onUsed={() => {
            setShieldModal(null);
            // TODO: userProfile update kareinNo response
            
