import { createSocketClient } from "@/api/sockets-v1";
import { env } from "@/env";

export const socket = createSocketClient(`${env.VITE_SOCKET_SERVER}/v1`, {
  path: env.VITE_SOCKET_PATH,
  withCredentials: true,
  query: {
    room: new URLSearchParams(window.location.search).get("observatory") ?? "DEFAULT_ROOM",
  },
});
