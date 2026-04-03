// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ set: mockCookieSet }),
}));

// Import after mocks are hoisted
const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets a cookie named auth-token", async () => {
  await createSession("user-123", "user@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [name] = mockCookieSet.mock.calls[0];
  expect(name).toBe("auth-token");
});

test("createSession JWT contains userId and email", async () => {
  await createSession("user-123", "user@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("user@example.com");
});

test("createSession JWT expires in 7 days", async () => {
  const before = Math.floor(Date.now() / 1000);
  await createSession("user-abc", "test@test.com");
  const after = Math.floor(Date.now() / 1000);

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const sevenDays = 7 * 24 * 60 * 60;
  expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDays - 5);
  expect(payload.exp).toBeLessThanOrEqual(after + sevenDays + 5);
});

test("createSession cookie options: httpOnly, sameSite lax, path /", async () => {
  await createSession("user-123", "user@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession cookie expires in 7 days", async () => {
  const before = Date.now();
  await createSession("user-123", "user@example.com");
  const after = Date.now();

  const [, , options] = mockCookieSet.mock.calls[0];
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDays + 1000);
});

test("createSession cookie is not secure outside production", async () => {
  await createSession("user-123", "user@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(false);
});

test("createSession cookie is secure in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  try {
    await createSession("user-123", "user@example.com");

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.secure).toBe(true);
  } finally {
    vi.unstubAllEnvs();
  }
});
