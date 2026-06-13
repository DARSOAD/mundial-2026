// lib/auth.ts
import { getParticipants } from "./data";

const AUTH_KEY = "mundial_user_id";

export async function loginUser(userId: string, passwordInput: string) {
  const participants = await getParticipants();
  const user = participants.find((p: any) => p.userId === userId);

  if (!user) {
    return { success: false, error: "Usuario no encontrado" };
  }

  if (user.password !== passwordInput) {
    return { success: false, error: "Contraseña incorrecta" };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, userId);
  }

  return { success: true };
}

export async function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}

export async function getLoggedInUser() {
  if (typeof window === 'undefined') return null;

  const userId = localStorage.getItem(AUTH_KEY);
  if (!userId) return null;

  const participants = await getParticipants();
  return participants.find((p: any) => p.userId === userId) || null;
}
