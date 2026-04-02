import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { AuthUser } from "@/types/auth";

/** Map Supabase user → AuthUser (synchronous, no DB calls) */
export function mapSupabaseUser(user: SupabaseUser): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username:
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email!.split("@")[0],
    fullName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      undefined,
    avatarUrl:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      undefined,
  };
}

// ─── Email OTP ────────────────────────────────────────────────────────────────

/** Step 1 – send a 4-digit OTP to the given email */
export async function sendOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Step 2 – verify OTP and set a password for the new account */
export async function verifyOtpAndSetPassword(
  email: string,
  token: string,
  password: string,
  username: string
): Promise<AuthUser> {
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (verifyError) throw verifyError;

  const { data, error: updateError } = await supabase.auth.updateUser({
    password,
    data: { username, full_name: username },
  });
  if (updateError) throw updateError;

  return mapSupabaseUser(data.user);
}

/** Login with email + password */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return mapSupabaseUser(data.user);
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: { access_type: "offline", prompt: "consent" },
      skipBrowserRedirect: false,
    },
  });
  if (error) throw error;
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── Profile DB operations ───────────────────────────────────────────────────

export interface ProfileData {
  full_name?: string;
  username?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
}

export async function fetchProfile(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("full_name, username, phone, bio, avatar_url")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("fetchProfile error:", error);
    return null;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  updates: ProfileData
): Promise<void> {
  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;

  // Keep auth metadata in sync
  await supabase.auth.updateUser({
    data: {
      full_name: updates.full_name,
      username: updates.username,
      avatar_url: updates.avatar_url,
    },
  });
}

/** Upload avatar to Storage and return the public URL */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  // Fetch as blob for best performance
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the browser shows the new image
  return `${data.publicUrl}?t=${Date.now()}`;
}
