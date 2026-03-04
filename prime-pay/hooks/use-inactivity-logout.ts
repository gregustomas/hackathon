"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minuty
const WARNING_BEFORE_MS = 30 * 1000;         // varování 30 s před odhlášením

type UseInactivityLogoutResult = {
  showWarning: boolean;
  secondsLeft: number;
  minutesLeft: number;
  secondsRemainder: number;
  stayLoggedIn: () => void;
  performLogout: () => void;
};

export const useInactivityLogout = (onLogout: () => void): UseInactivityLogoutResult => {
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(
    Math.floor(WARNING_BEFORE_MS / 1000),
  );

  const minutesLeft = Math.floor(secondsLeft / 60);
  const secondsRemainder = secondsLeft % 60;

  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    logoutTimer.current = null;
    warningTimer.current = null;
    countdownInterval.current = null;
  }, []);

  const performLogout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    onLogout();
  }, [clearAllTimers, onLogout]);

  const startCountdown = useCallback(() => {
    setShowWarning(true);
    setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000));

    if (countdownInterval.current) clearInterval(countdownInterval.current);

    countdownInterval.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetTimers = useCallback(() => {
    setShowWarning(false);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);

    warningTimer.current = setTimeout(
      startCountdown,
      INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS,
    );
    logoutTimer.current = setTimeout(performLogout, INACTIVITY_TIMEOUT_MS);
  }, [performLogout, startCountdown]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keypress",
      "touchstart",
      "scroll",
      "click",
    ];

    const handler = () => resetTimers();

    const initialTimeout = setTimeout(() => {
      resetTimers();
    }, 0);

    events.forEach((event) =>
      window.addEventListener(event, handler, { passive: true }),
    );

    return () => {
      clearTimeout(initialTimeout);
      events.forEach((event) => window.removeEventListener(event, handler));
      clearAllTimers();
    };
  }, [resetTimers, clearAllTimers]);

  const stayLoggedIn = () => {
    resetTimers();
  };

  return {
    showWarning,
    secondsLeft,
    minutesLeft,
    secondsRemainder,
    stayLoggedIn,
    performLogout,
  };
};
