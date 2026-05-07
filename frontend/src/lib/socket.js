import { io } from 'socket.io-client'

const SOCKET_KEY = '__devmind_socket__'

export function getSocket() {
  if (!globalThis[SOCKET_KEY]) {
    globalThis[SOCKET_KEY] = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      autoConnect: false,
    })
  }
  return globalThis[SOCKET_KEY]
}