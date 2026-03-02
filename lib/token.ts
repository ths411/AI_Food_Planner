import { randomBytes } from "crypto";

export function createShareToken() {
  return randomBytes(16).toString("hex");
}

