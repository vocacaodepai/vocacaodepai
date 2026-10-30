import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

// Funções de autenticação da Área do Pai (doc 07 §4.3). Tudo roda no navegador
// com a chave publicável; o cadastro por e-mail+senha passa pela server function
// `signUpFn` (src/lib/area-do-pai/auth.functions.ts) para validar Turnstile e
// aplicar rate limit.

// Cached staff check so multiple components can ask without refetching.
let staffPromise: Promise<boolean> | null = null;

export function isCurrentUserStaff(): Promise<boolean> {
  if (!staffPromise) {
    staffPromise = (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        return data?.role === "admin" || data?.role === "editor";
      } catch {
        return false;
      }
    })();
  }
  return staffPromise;
}

// Reset the cache on login/logout so visibility reacts to auth changes.
supabase.auth.onAuthStateChange(() => {
  staffPromise = null;
});

/* ---------------- Área do Pai (Fase 5) ---------------- */

const origin = () => (typeof window !== "undefined" ? window.location.origin : SITE_URL);

/** Só aceita caminho interno ("/..." e não "//..."): evita open redirect (doc 07 §8.6). */
export function safeNext(next: string | null | undefined, fallback = "/area-do-pai"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return fallback;
  return next;
}

export const callbackUrl = (next = "/area-do-pai") =>
  `${origin()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string, next?: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function signInWithGoogle(next?: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl(next),
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl("/recuperar-senha?step=nova"),
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function updateEmail(email: string) {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
}

export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: callbackUrl("/area-do-pai/onboarding") },
  });
  if (error) throw error;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export const AUTH_ERRORS_PTBR: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada.",
  "User already registered": "Este e-mail já tem conta. Entre ou recupere a senha.",
  "Password should be at least 8 characters": "A senha precisa de pelo menos 8 caracteres.",
  "Password should be at least 6 characters": "A senha precisa de pelo menos 8 caracteres.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "For security purposes, you can only request this after 60 seconds.":
    "Por segurança, espere 1 minuto antes de pedir de novo.",
  "Signup requires a valid password": "Informe uma senha válida (mínimo 8 caracteres).",
  "Unable to validate email address: invalid format": "Informe um e-mail válido.",
  "New password should be different from the old password.":
    "A nova senha precisa ser diferente da atual.",
  "Auth session missing!": "Sua sessão expirou. Entre de novo.",
  "Failed to fetch": "Sem conexão com o servidor. Confira a internet e tente de novo.",
};

export function ptError(e: unknown): string {
  const msg = (e as { message?: string } | null)?.message ?? "";
  if (AUTH_ERRORS_PTBR[msg]) return AUTH_ERRORS_PTBR[msg];
  const lower = msg.toLowerCase();
  if (lower.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (lower.includes("not confirmed")) return AUTH_ERRORS_PTBR["Email not confirmed"];
  if (lower.includes("already registered") || lower.includes("already exists"))
    return AUTH_ERRORS_PTBR["User already registered"];
  if (lower.includes("invalid login")) return AUTH_ERRORS_PTBR["Invalid login credentials"];
  if (lower.includes("placeholder") || lower.includes("invalid supabaseurl"))
    return "A Área do Pai ainda não está ligada ao banco. Volte em breve.";
  // Mensagens já em PT-BR (lançadas pelas nossas server functions) passam direto.
  if (
    /^(Muitas|Verificação|Sessão|Faça|Não|Informe|A |O |Sua|Este|Confirme|Por|Você|Somente|Acesso|Administradores)/.test(
      msg,
    )
  )
    return msg;
  return "Não foi possível concluir. Tente novamente.";
}

/** Força da senha (0-4) para o medidor do cadastro. */
export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  const label = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"][score] ?? "Fraca";
  return { score, label };
}

export function isValidPassword(pw: string): boolean {
  return pw.length >= 8 && pw.length <= 128 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);
}
