"use client";

import { useState, useEffect } from "react";

interface CurrentUserInfo {
  userId: number | null;
  isCurrentUser: (checkUserId: number | undefined | null) => boolean;
  getDisplayName: (userId: number | undefined | null, username: string) => string;
}

/**
 * Hook to get current user info from JWT token
 * Provides helpers to check if a user is the current user
 * and get display name ("Tôi" for current user)
 */
export function useCurrentUser(): CurrentUserInfo {
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.user_id);
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }, []);

  const isCurrentUser = (checkUserId: number | undefined | null): boolean => {
    if (!userId || !checkUserId) return false;
    return Number(userId) === Number(checkUserId);
  };

  const getDisplayName = (checkUserId: number | undefined | null, username: string): string => {
    if (isCurrentUser(checkUserId)) {
      return "Tôi";
    }
    return username;
  };

  return { userId, isCurrentUser, getDisplayName };
}

/**
 * Get current user ID from localStorage (non-hook version for one-time use)
 */
export function getCurrentUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("access_token");
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Check if the given user ID matches the current logged-in user
 */
export function isCurrentUser(checkUserId: number | undefined | null): boolean {
  const currentId = getCurrentUserId();
  if (!currentId || !checkUserId) return false;
  return Number(currentId) === Number(checkUserId);
}

/**
 * Get display name - returns "Tôi" if it's the current user
 */
export function getDisplayName(checkUserId: number | undefined | null, username: string): string {
  if (isCurrentUser(checkUserId)) {
    return "Tôi";
  }
  return username;
}
