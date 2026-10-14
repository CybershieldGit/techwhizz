"use client";

import { io } from "socket.io-client";

let socketInstance = null;

export const getSocket = () => {
  if (typeof window === "undefined") return null;

  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }

  return socketInstance;
};
