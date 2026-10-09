import crypto from "node:crypto";

export const RESET_TTL_MS = 24 * 60 * 60 * 1000; // povezave, ki jih ustvari skrbnik: 24 ur
export const SELF_RESET_TTL_MS = 60 * 60 * 1000; // "pozabljeno geslo" po e-pošti: 1 ura

export const newResetToken = () => crypto.randomBytes(32).toString("base64url");
export const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
