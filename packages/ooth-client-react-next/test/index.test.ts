import withOothNext from "../src";
import { OothClient } from "ooth-client";

describe("withOothNext", () => {
  test("can be created", () => {
    const oothClient = new OothClient({
      oothUrl: "http://localhost:3000/auth"
    });
    const hoc = withOothNext(oothClient);
    expect(hoc).toBeTruthy();
  });
});
