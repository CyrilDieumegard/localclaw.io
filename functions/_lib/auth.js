import { betterAuth } from "better-auth";

const PRODUCTION_ORIGINS = [
  "https://localclaw.io",
  "https://www.localclaw.io"
];

export function createAuth(env, request) {
  assertAuthConfig(env);

  const requestOrigin = new URL(request.url).origin;
  const trustedOrigins = [...PRODUCTION_ORIGINS];

  if (isLocalOrigin(requestOrigin)) {
    trustedOrigins.push(requestOrigin);
  }

  return betterAuth({
    appName: "LocalClaw",
    database: env.LOCALCLAW_DB,
    baseURL: env.BETTER_AUTH_URL || (isLocalOrigin(requestOrigin) ? requestOrigin : PRODUCTION_ORIGINS[0]),
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
    emailAndPassword: {
      enabled: false
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET
      }
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24
    },
    advanced: {
      useSecureCookies: !isLocalOrigin(requestOrigin),
      cookiePrefix: "localclaw"
    }
  });
}

export async function getRequiredSession(context) {
  let auth;

  try {
    auth = createAuth(context.env, context.request);
  } catch (error) {
    return {
      response: json({
        ok: false,
        error: "account_unavailable",
        message: "Accounts are not configured yet."
      }, 503),
      session: null
    };
  }

  const session = await auth.api.getSession({
    headers: context.request.headers
  });

  if (!session?.user?.id) {
    return {
      response: json({
        ok: false,
        error: "authentication_required",
        message: "Sign in to manage your machines."
      }, 401),
      session: null
    };
  }

  return { response: null, session };
}

export function requireSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;

  const requestOrigin = new URL(request.url).origin;
  return origin === requestOrigin;
}

export function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

function assertAuthConfig(env) {
  if (!env.LOCALCLAW_DB) {
    throw new Error("Missing LOCALCLAW_DB binding");
  }

  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("Missing BETTER_AUTH_SECRET");
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing Google OAuth credentials");
  }
}

function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
