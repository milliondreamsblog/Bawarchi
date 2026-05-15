import { SignJWT, jwtVerify } from "jose";

const ISSUER = "bawarchie:native";

function secretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export type NativeJwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: "super-admin" | "restaurant";
  slug?: string;
};

export async function signNativeToken(payload: NativeJwtPayload): Promise<string> {
  return await new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    slug: payload.slug,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setSubject(payload.sub)
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifyNativeToken(
  token: string
): Promise<NativeJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as NativeJwtPayload["role"],
      slug: payload.slug as string | undefined,
    };
  } catch {
    return null;
  }
}
