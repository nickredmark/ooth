import withOothNext from "../src";
import { OothClient } from "ooth-client";

describe("withOothNext", () => {
  test("can be created", () => {
    const oothClient = new OothClient({
      url: "http://localhost:3000/auth",
      secondaryAuthMode: "session"
    });
    const hoc = withOothNext(oothClient);
    expect(hoc).toBeTruthy();
  });
});
