import bcrypt from "bcryptjs";

/** Hash a plaintext password for storage. */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/** Bcrypt hashes look like $2a$10$... / $2b$... / $2y$... */
const BCRYPT_PREFIX = /^\$2[aby]\$\d+\$/;

export type VerifyResult = {
  valid: boolean;
  /**
   * True when the password matched against a *legacy* plain-text stored
   * value. Callers should bcrypt-rehash and persist the new hash on the
   * same request so the row self-upgrades on next login.
   */
  needsRehash: boolean;
};

/**
 * Verify a password against a stored value. Accepts both bcrypt hashes
 * (current) and legacy plain-text rows (created before the hashing
 * regression was fixed). For legacy rows the comparison is constant-time-ish
 * but the caller MUST rehash on success — see `needsRehash`.
 */
export async function verifyPassword(
  password: string,
  storedPassword: string
): Promise<VerifyResult> {
  if (BCRYPT_PREFIX.test(storedPassword)) {
    const valid = await bcrypt.compare(password, storedPassword);
    return { valid, needsRehash: false };
  }
  const valid = password === storedPassword;
  return { valid, needsRehash: valid };
}
