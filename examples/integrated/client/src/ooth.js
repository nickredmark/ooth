import { OothClient } from "ooth-client";

const ooth = new OothClient({
  url: "http://localhost:3002/auth",
  secondaryAuthMode: "session",
  standalone: false,
  ws: true
});

export default ooth;
