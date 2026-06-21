import { io, Socket } from "socket.io-client"
import { isTokenExpired } from "../app/UserProvider"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

let socket: Socket | null = null
let currentToken: string | null = null

export function getSocket(): Socket {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token && isTokenExpired(token)) {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("username")
    window.location.href = "/auth"
    throw new Error("Session expired")
  }

  if (!socket) {
    currentToken = token
    socket = io(API, {
      transports: ["websocket"],
      auth: { token },
    })
  } else if (token !== currentToken) {
    currentToken = token
    socket.disconnect()
    socket = io(API, {
      transports: ["websocket"],
      auth: { token },
    })
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
