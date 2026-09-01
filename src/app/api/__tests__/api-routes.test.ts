import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ============================================================
// Mock rate-limit — must be before route imports
// ============================================================
vi.mock("@/lib/rate-limit", () => ({
  sensitiveApiLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  apiLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
  ),
}));

// ============================================================
// Mock Supabase client
// ============================================================
const mockUser = { id: "user-1", user_metadata: {} };
const mockProfile = { role: "proprietaire" };

const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });
const mockLimit = vi.fn().mockReturnThis();
const mockEqChain = vi.fn().mockReturnValue({
  single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
  limit: mockLimit,
});
const mockSelect = vi.fn().mockReturnValue({ eq: mockEqChain });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: mockUser } });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

// Hoistes : la route d'invitation essaie l'envoi par courriel puis, s'il
// echoue, fabrique un lien. Les deux appels doivent pouvoir etre pilotes test
// par test.
const { mockInviteUserByEmail, mockGenerateLink, mockEnvoyerInvitation } = vi.hoisted(
  () => ({
    mockInviteUserByEmail: vi.fn(),
    mockGenerateLink: vi.fn(),
    mockEnvoyerInvitation: vi.fn(),
  })
);

vi.mock("@/lib/email/envoyer-invitation", () => ({
  envoyerInvitation: mockEnvoyerInvitation,
}));

const { mockExecuterBalayage } = vi.hoisted(() => ({
  mockExecuterBalayage: vi.fn(),
}));

vi.mock("@/lib/email/rappels", () => ({
  executerBalayage: mockExecuterBalayage,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    auth: {
      admin: {
        inviteUserByEmail: mockInviteUserByEmail,
        generateLink: mockGenerateLink,
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "new-1" } }, error: null }),
        updateUserById: vi.fn().mockResolvedValue({ error: null }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: "vendeur" }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}));

vi.mock("@/lib/email/send-notification", () => ({
  sendNotification: vi.fn().mockResolvedValue({ success: true, resend_id: "re_123" }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockInviteUserByEmail.mockResolvedValue({
    data: { user: { id: "new-1" } },
    error: null,
  });
  mockEnvoyerInvitation.mockResolvedValue({ envoye: true });
  mockGenerateLink.mockResolvedValue({
    data: {
      user: { id: "new-1" },
      properties: {
        action_link:
          "https://ref.supabase.co/auth/v1/verify?token=jeton-hache&type=invite&redirect_to=https://app.oraujusteprix.fr",
      },
    },
    error: null,
  });
  mockGetUser.mockResolvedValue({ data: { user: mockUser } });
  mockEqChain.mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    limit: mockLimit,
  });
});

// ============================================================
// Helper
// ============================================================
function makeNextRequest(method: string, url: string, body?: unknown): NextRequest {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost"), init);
}

// ============================================================
// /api/search
// ============================================================
describe("GET /api/search", () => {
  it("retourne un tableau vide si query < 2 chars", async () => {
    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest("GET", "http://localhost/api/search?q=a");
    const res = await GET(req);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("retourne un tableau vide si query manquante", async () => {
    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest("GET", "http://localhost/api/search");
    const res = await GET(req);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("retourne 401 si non authentifié", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import("@/app/api/search/route");
    const req = makeNextRequest("GET", "http://localhost/api/search?q=test");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

// ============================================================
// /api/users/invite
// ============================================================
describe("POST /api/users/invite", () => {
  it("retourne 401 si non authentifié", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import("@/app/api/users/invite/route");
    const req = makeNextRequest("POST", "http://localhost/api/users/invite", {
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      mode: "create",
      password: "123456",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retourne 403 si pas propriétaire", async () => {
    mockEqChain.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({ data: { role: "vendeur" }, error: null }),
      limit: mockLimit,
    });
    const { POST } = await import("@/app/api/users/invite/route");
    const req = makeNextRequest("POST", "http://localhost/api/users/invite", {
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      mode: "create",
      password: "123456",
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("retourne 400 si champs manquants", async () => {
    const { POST } = await import("@/app/api/users/invite/route");
    const req = makeNextRequest("POST", "http://localhost/api/users/invite", {
      email: "",
      firstName: "",
      lastName: "",
      mode: "create",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("envoie l'invitation par courriel, vers l'écran de mot de passe", async () => {
    const { POST } = await import("@/app/api/users/invite/route");
    const req = makeNextRequest("POST", "http://localhost/api/users/invite", {
      email: "vendeur@test.com",
      firstName: "Test",
      lastName: "User",
      mode: "invite",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(data.envoye).toBe(true);
    // Le courriel porte le lien qui passe par le callback : c'est lui qui
    // verifie le jeton avant de deposer sur le choix du mot de passe.
    expect(mockEnvoyerInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        destinataire: "vendeur@test.com",
        lien: expect.stringContaining("/auth/callback?token_hash=jeton-hache"),
      })
    );
    expect(data.inviteLink).toContain("next=/reset-password");
  });

  it("garde le lien à copier quand le courriel ne peut pas partir", async () => {
    mockEnvoyerInvitation.mockResolvedValueOnce({
      envoye: false,
      motif: "The gmail.com domain is not verified",
    });
    const { POST } = await import("@/app/api/users/invite/route");
    const req = makeNextRequest("POST", "http://localhost/api/users/invite", {
      email: "vendeur@test.com",
      firstName: "Test",
      lastName: "User",
      mode: "invite",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.envoye).toBe(false);
    expect(data.motifNonEnvoi).toContain("not verified");
    expect(data.inviteLink).toContain("/auth/callback?token_hash=jeton-hache");
  });

  it("n'echoue pas si l'expéditeur lève une erreur inattendue", async () => {
    // Sans le filet, une cle absente faisait lever le constructeur de Resend et
    // la creation du vendeur repondait 500 — alors que le compte, lui, existait.
    mockEnvoyerInvitation.mockRejectedValueOnce(new Error("Missing API key"));
    const { POST } = await import("@/app/api/users/invite/route");
    const req = makeNextRequest("POST", "http://localhost/api/users/invite", {
      email: "vendeur@test.com",
      firstName: "Test",
      lastName: "User",
      mode: "invite",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.envoye).toBe(false);
    expect(data.inviteLink).toContain("/auth/callback");
  });

  it("retourne 400 si password < 6 chars en mode create", async () => {
    const { POST } = await import("@/app/api/users/invite/route");
    const req = makeNextRequest("POST", "http://localhost/api/users/invite", {
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      mode: "create",
      password: "12345",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ============================================================
// /api/cron/emails
//
// Le balayage n'est appele par aucun utilisateur : c'est pg_cron qui frappe a
// la porte. Seul un secret partage l'ouvre, et ces cas verifient qu'elle reste
// fermee dans tous les autres.
// ============================================================
describe("POST /api/cron/emails", () => {
  const SECRET = "secret-de-balayage";

  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    mockExecuterBalayage.mockResolvedValue({
      devis: 0,
      commandes: 0,
      soldes: 0,
      clotures: 0,
      echecs: 0,
    });
  });

  it("refuse tout quand aucun secret n'est configuré", async () => {
    delete process.env.CRON_SECRET;
    const { POST } = await import("@/app/api/cron/emails/route");
    const res = await POST(makeNextRequest("POST", "http://localhost/api/cron/emails"));

    expect(res.status).toBe(503);
    expect(mockExecuterBalayage).not.toHaveBeenCalled();
  });

  it("retourne 401 sans en-tête d'autorisation", async () => {
    const { POST } = await import("@/app/api/cron/emails/route");
    const res = await POST(makeNextRequest("POST", "http://localhost/api/cron/emails"));

    expect(res.status).toBe(401);
    expect(mockExecuterBalayage).not.toHaveBeenCalled();
  });

  it("retourne 401 sur un mauvais secret", async () => {
    const { POST } = await import("@/app/api/cron/emails/route");
    const req = new NextRequest(new URL("http://localhost/api/cron/emails"), {
      method: "POST",
      headers: { authorization: "Bearer mauvais-secret" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockExecuterBalayage).not.toHaveBeenCalled();
  });

  it("balaye sur présentation du bon secret", async () => {
    const { POST } = await import("@/app/api/cron/emails/route");
    const req = new NextRequest(new URL("http://localhost/api/cron/emails"), {
      method: "POST",
      headers: { authorization: `Bearer ${SECRET}` },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockExecuterBalayage).toHaveBeenCalledOnce();
  });

  it("accepte aussi le secret en en-tête dédié", async () => {
    const { POST } = await import("@/app/api/cron/emails/route");
    const req = new NextRequest(new URL("http://localhost/api/cron/emails"), {
      method: "POST",
      headers: { "x-cron-secret": SECRET },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it("rend 500 quand le balayage échoue, sans masquer le motif", async () => {
    mockExecuterBalayage.mockRejectedValueOnce(new Error("base injoignable"));
    const { POST } = await import("@/app/api/cron/emails/route");
    const req = new NextRequest(new URL("http://localhost/api/cron/emails"), {
      method: "POST",
      headers: { authorization: `Bearer ${SECRET}` },
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("base injoignable");
  });
});

// ============================================================
// /api/users/[id]/toggle-active
// ============================================================
describe("PATCH /api/users/[id]/toggle-active", () => {
  it("retourne 401 si non authentifié", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const { PATCH } = await import("@/app/api/users/[id]/toggle-active/route");
    const req = makeNextRequest("PATCH", "http://localhost/api/users/target-1/toggle-active", {
      status: "inactive",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "target-1" }) });
    expect(res.status).toBe(401);
  });

  it("retourne 400 si self-modification", async () => {
    const { PATCH } = await import("@/app/api/users/[id]/toggle-active/route");
    const req = makeNextRequest("PATCH", "http://localhost/api/users/user-1/toggle-active", {
      status: "inactive",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "user-1" }) });
    expect(res.status).toBe(400);
  });

  it("retourne 400 pour un statut invalide", async () => {
    const { PATCH } = await import("@/app/api/users/[id]/toggle-active/route");
    const req = makeNextRequest("PATCH", "http://localhost/api/users/target-1/toggle-active", {
      status: "banned",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "target-1" }) });
    expect(res.status).toBe(400);
  });
});

// ============================================================
// /api/users/[id]/delete
// ============================================================
describe("DELETE /api/users/[id]/delete", () => {
  it("retourne 401 si non authentifié", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const { DELETE } = await import("@/app/api/users/[id]/delete/route");
    const req = makeNextRequest("DELETE", "http://localhost/api/users/target-1/delete");
    const res = await DELETE(req, { params: Promise.resolve({ id: "target-1" }) });
    expect(res.status).toBe(401);
  });

  it("retourne 400 si self-deletion", async () => {
    const { DELETE } = await import("@/app/api/users/[id]/delete/route");
    const req = makeNextRequest("DELETE", "http://localhost/api/users/user-1/delete");
    const res = await DELETE(req, { params: Promise.resolve({ id: "user-1" }) });
    expect(res.status).toBe(400);
  });
});
