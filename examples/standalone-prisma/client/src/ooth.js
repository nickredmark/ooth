import { OothClient } from "ooth-client";

const ooth = new OothClient({
  url: "http://localhost:3001",
  secondaryAuthMode: "session",
  api: {
    url: "http://localhost:3002",
    primaryAuthMode: "jwt",
    secondaryAuthMode: "session",
    loginPath: "/login",
    logoutPath: "/logout"
  },
  ws: true
});

export default ooth;
