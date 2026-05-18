import bcrypt from "bcryptjs";

export function getAdminEnv() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!email || (!password && !passwordHash)) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) must be set in .env");
  }

  return { email, password, passwordHash };
}

export async function verifyAdminPassword(
  inputPassword: string,
  envPassword?: string,
  envPasswordHash?: string,
): Promise<boolean> {
  if (envPasswordHash) {
    try {
      return await bcrypt.compare(inputPassword, envPasswordHash);
    } catch {
      return false;
    }
  }

  if (envPassword) {
    return inputPassword === envPassword;
  }

  return false;
}
