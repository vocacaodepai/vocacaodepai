import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SITE_URL } from "@/lib/site";

// Server functions de autenticação (doc 07 §4.4). O módulo server-only é
// importado dinamicamente dentro dos handlers para não ir ao bundle do cliente.

export interface AuthConfig {
  /** Botão "Entrar com Google" só aparece quando GOOGLE_CLIENT_ID está configurado. */
  googleEnabled: boolean;
  /** Banco ligado (sem placeholder)? Sem ele os formulários avisam e não tentam. */
  dbConfigured: boolean;
}

export const getAuthConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthConfig> => {
    const srv = await import("./area.server");
    return {
      googleEnabled: Boolean(process.env["GOOGLE_CLIENT_ID"]?.trim()),
      dbConfigured: srv.isDbConfigured(),
    };
  },
);

const SignUpInput = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres.")
    .max(128)
    .regex(/[a-zA-Z]/, "A senha precisa ter letras.")
    .regex(/\d/, "A senha precisa ter números."),
  displayName: z.string().trim().min(2, "Digite seu nome.").max(80),
  newsletterOptIn: z.boolean().default(false),
  acceptTerms: z.literal(true, { message: "Aceite os Termos de Uso e a Política de Privacidade." }),
  turnstileToken: z.string().optional(),
  /** Honeypot: humano não vê; robô preenche. */
  website: z.string().optional(),
  /** Timestamp (ms) de quando o formulário abriu; envio rápido demais = robô. */
  startedAt: z.number().optional(),
});
export type SignUpInput = z.infer<typeof SignUpInput>;

export interface SignUpResult {
  ok: boolean;
  needsConfirmation: boolean;
  /** Quando o projeto não exige confirmação de e-mail, a sessão volta para o client. */
  session: { access_token: string; refresh_token: string } | null;
  error?: string;
}

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const r = SignUpInput.safeParse(d);
    if (!r.success) {
      throw new Error(r.error.issues[0]?.message ?? "Dados inválidos.");
    }
    return r.data;
  })
  .handler(async ({ data }): Promise<SignUpResult> => {
    const srv = await import("./area.server");

    // Robô: responde como se tivesse dado certo, sem gravar nada.
    if (data.website?.trim()) return { ok: true, needsConfirmation: true, session: null };
    if (typeof data.startedAt === "number" && Date.now() - data.startedAt < 2500)
      return { ok: true, needsConfirmation: true, session: null };

    const ip = await srv.requestIp();
    srv.rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000); // 5 cadastros/hora/IP

    if (!(await srv.verifyTurnstile(data.turnstileToken, ip))) {
      throw new Error("Verificação anti-robô falhou. Recarregue a página e tente de novo.");
    }
    if (!srv.isDbConfigured()) {
      throw new Error("A Área do Pai ainda não está ligada ao banco. Volte em breve.");
    }

    const sb = srv.getAnonClient();
    const { data: res, error } = await sb.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { display_name: data.displayName, newsletter_opt_in: data.newsletterOptIn },
        emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent("/area-do-pai/onboarding")}`,
      },
    });
    if (error) throw new Error(error.message);

    // Supabase devolve user sem identities quando o e-mail já existe (não revela ao cliente).
    const alreadyExists = res.user && (res.user.identities?.length ?? 0) === 0 && !res.session;
    if (alreadyExists) return { ok: true, needsConfirmation: true, session: null };

    return {
      ok: true,
      needsConfirmation: !res.session,
      session: res.session
        ? { access_token: res.session.access_token, refresh_token: res.session.refresh_token }
        : null,
    };
  });
