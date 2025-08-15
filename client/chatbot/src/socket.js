import { io } from "socket.io-client";
import { BACKEND_URL } from "./config/config";

export const socket = io(BACKEND_URL, {
  transports: ["websocket"], // fast + avoids polling issues on some setups
  withCredentials: true,
});
