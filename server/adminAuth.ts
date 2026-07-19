import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { createHash, timingSafeEqual } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + FIFTEEN_MINUTES });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function passwordsMatch(supplied: string, expected: string): boolean {
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function setupAdminAuth(app: Express): Promise<void> {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is required for admin authentication");
  }

  app.set("trust proxy", 1);

  // Create the session table ourselves. connect-pg-simple's
  // createTableIfMissing reads table.sql relative to __dirname, which doesn't
  // exist inside the esbuild bundle — so it silently breaks login on any
  // fresh database in production.
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);
  } catch (err) {
    console.error("[adminAuth] Failed to ensure session table:", err instanceof Error ? err.message : err);
  }

  const PgStore = connectPgSimple(session);
  app.use(
    "/api/admin",
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "session",
      }),
      name: "admin.sid",
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.post("/api/admin/login", (req: Request, res: Response) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.status(503).json({ message: "Admin login is not configured yet. Set the ADMIN_PASSWORD secret." });
    }

    const ip = req.ip ?? "unknown";
    if (tooManyAttempts(ip)) {
      return res.status(429).json({ message: "Too many attempts. Try again in 15 minutes." });
    }

    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!password || !passwordsMatch(password, adminPassword)) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    attempts.delete(ip);
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ message: "Login failed. Try again." });
      }
      req.session.isAdmin = true;
      return res.json({ success: true });
    });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.clearCookie("admin.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/admin/session", (req: Request, res: Response) => {
    return res.json({ authenticated: req.session.isAdmin === true });
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.isAdmin === true) {
    next();
    return;
  }
  res.status(401).json({ message: "Not authenticated." });
}
