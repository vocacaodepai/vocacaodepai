import { useEffect, useState } from "react";
import {
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Save,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/area-do-pai/client";
import { useAuth } from "@/lib/auth-context";
import {
  getAccessToken,
  isValidPassword,
  ptError,
  resendConfirmation,
  updateEmail,
  updatePassword,
} from "@/lib/auth";
import { setNewsletterPref } from "@/lib/area-do-pai/area.functions";
import { INTERESTS, UFS } from "@/lib/phases";
import { isValidEmail } from "@/lib/newsletter";
import {
  AreaShell,
  Card,
  dangerBtn,
  inputClass,
  primaryBtn,
  secondaryBtn,
} from "@/components/area-do-pai/AreaShell";
import { cn } from "@/lib/utils";

// /minha-conta (doc 07 §4.12): Dados · Acesso · Notificações · Privacidade (LGPD).

type Tab = "dados" | "acesso" | "notificacoes" | "privacidade";
const TABS: Array<{ id: Tab; label: string }> = [
  { id: "dados", label: "Dados" },
  { id: "acesso", label: "Acesso" },
  { id: "notificacoes", label: "Notificações" },
  { id: "privacidade", label: "Privacidade" },
];

export default function MinhaContaPage() {
  const navigate = useNavigate();
  const { user, member, refreshProfile, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("dados");

  // Dados
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingData, setSavingData] = useState(false);

  // Acesso
  const [newEmail, setNewEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busyAccess, setBusyAccess] = useState(false);

  // Notificações
  const [newsletter, setNewsletter] = useState(false);
  const [busyNews, setBusyNews] = useState(false);

  // Privacidade
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!member) return;
    setDisplayName(member.display_name);
    setBio(member.bio ?? "");
    setCity(member.city ?? "");
    setUf(member.uf ?? "");
    setInterests(member.interests ?? []);
    setNewsletter(member.newsletter_opt_in);
  }, [member]);

  const saveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (displayName.trim().length < 2) return void toast.error("Digite um nome de exibição.");
    setSavingData(true);
    try {
      const { error } = await db
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim().slice(0, 280) || null,
          city: city.trim() || null,
          uf: uf || null,
          interests,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Dados salvos.");
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setSavingData(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) return void toast.error("Imagem até 2 MB.");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type))
      return void toast.error("Use JPG, PNG ou WebP.");
    setAvatarUploading(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error: pErr } = await db
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (pErr) throw pErr;
      await refreshProfile();
      toast.success("Foto atualizada.");
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setAvatarUploading(false);
    }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(newEmail)) return void toast.error("Informe um e-mail válido.");
    setBusyAccess(true);
    try {
      await updateEmail(newEmail.trim());
      toast.success("Enviamos links de confirmação para o e-mail atual e para o novo.");
      setNewEmail("");
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setBusyAccess(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword(pw))
      return void toast.error("A senha precisa de 8 caracteres ou mais, com letras e números.");
    if (pw !== pw2) return void toast.error("As senhas não conferem.");
    setBusyAccess(true);
    try {
      await updatePassword(pw);
      setPw("");
      setPw2("");
      toast.success("Senha atualizada.");
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setBusyAccess(false);
    }
  };

  const signOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Você saiu de todos os dispositivos.");
    navigate("/entrar", { replace: true });
  };

  const saveNewsletter = async (optIn: boolean) => {
    setBusyNews(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Sessão expirada. Entre novamente.");
      const r = await setNewsletterPref({ data: { accessToken, optIn } });
      setNewsletter(optIn);
      await refreshProfile();
      toast.success(
        optIn
          ? r.emailed
            ? "Enviamos o e-mail de confirmação."
            : "Preferência salva."
          : "Você saiu do resumo semanal.",
      );
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setBusyNews(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const { data, error } = await db.rpc("export_my_data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `vocacaodepai-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (confirmText !== "EXCLUIR") return;
    setDeleting(true);
    try {
      const { error } = await db.rpc("delete_my_account");
      if (error) throw error;
      await logout();
      toast.success("Conta excluída. Sentiremos sua falta, pai.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(ptError(err));
      setDeleting(false);
    }
  };

  return (
    <AreaShell title="Minha conta" description="Seus dados, acesso, notificações e privacidade.">
      <div
        role="tablist"
        className="mb-5 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-bold transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <Card title="Dados do perfil">
          <form onSubmit={saveData} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {member?.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (displayName || "P").charAt(0).toUpperCase()
                )}
              </div>
              <label className={cn(secondaryBtn, "cursor-pointer")}>
                {avatarUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Trocar foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nome de exibição
              </span>
              <input
                value={displayName}
                maxLength={80}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Bio (até 280 caracteres)
              </span>
              <textarea
                value={bio}
                maxLength={280}
                rows={3}
                onChange={(e) => setBio(e.target.value)}
                className={cn(inputClass, "h-auto py-2")}
                placeholder="Pai de dois, marceneiro nas horas vagas…"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cidade
                </span>
                <input
                  value={city}
                  maxLength={80}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  UF
                </span>
                <select value={uf} onChange={(e) => setUf(e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {UFS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Interesses
              </span>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                  const on = interests.includes(i.slug);
                  return (
                    <button
                      key={i.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setInterests((l) => (on ? l.filter((s) => s !== i.slug) : [...l, i.slug]))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary",
                      )}
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="submit" disabled={savingData} className={primaryBtn}>
              {savingData ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}{" "}
              Salvar
            </button>
          </form>
        </Card>
      )}

      {tab === "acesso" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="E-mail">
            <p className="text-sm text-muted-foreground">
              Atual: <strong className="text-foreground">{user?.email ?? "—"}</strong>{" "}
              {user && !user.emailConfirmed && (
                <button
                  type="button"
                  onClick={() =>
                    user.email &&
                    resendConfirmation(user.email).then(
                      () => toast.success("Reenviamos a confirmação."),
                      (e) => toast.error(ptError(e)),
                    )
                  }
                  className="ml-1 font-bold text-primary hover:underline"
                >
                  (não confirmado — reenviar)
                </button>
              )}
            </p>
            <form onSubmit={changeEmail} className="mt-3 space-y-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Novo e-mail"
                className={inputClass}
              />
              <button type="submit" disabled={busyAccess} className={secondaryBtn}>
                <Mail className="h-4 w-4" /> Trocar e-mail
              </button>
              <p className="text-xs text-muted-foreground">
                A troca exige confirmação nos dois endereços.
              </p>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Provedores vinculados: {user?.providers.length ? user.providers.join(", ") : "e-mail"}
            </p>
          </Card>
          <Card title="Senha">
            <form onSubmit={changePassword} className="space-y-2">
              <input
                type="password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Nova senha (mínimo 8, letras e números)"
                className={inputClass}
              />
              <input
                type="password"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Repita a nova senha"
                className={inputClass}
              />
              <button type="submit" disabled={busyAccess} className={primaryBtn}>
                <KeyRound className="h-4 w-4" /> Atualizar senha
              </button>
            </form>
            <button type="button" onClick={signOutAll} className={cn(secondaryBtn, "mt-4")}>
              <LogOut className="h-4 w-4" /> Sair de todos os dispositivos
            </button>
          </Card>
        </div>
      )}

      {tab === "notificacoes" && (
        <Card title="Resumo semanal por e-mail">
          <p className="text-sm text-muted-foreground">
            Toda semana: conteúdo para a fase dos seus filhos, o Pai Indica da semana e o mercado em
            1 minuto. Confirmação em dois passos; sai quando quiser.
          </p>
          <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={newsletter}
              disabled={busyNews}
              onChange={(e) => saveNewsletter(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            Quero receber o resumo semanal
            {busyNews && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </label>
          <p className="mt-3 text-xs text-muted-foreground">
            Os segmentos (fases dos filhos e interesses) vêm do seu cadastro de filhos e da aba
            Dados.
          </p>
        </Card>
      )}

      {tab === "privacidade" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Baixar meus dados">
            <p className="text-sm text-muted-foreground">
              Um arquivo JSON com sua conta, perfil, filhos, salvos, assinaturas, insígnias e
              newsletter (portabilidade, LGPD art. 18).
            </p>
            <button
              type="button"
              onClick={exportData}
              disabled={exporting}
              className={cn(primaryBtn, "mt-4")}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Baixar meus dados (JSON)
            </button>
          </Card>
          <Card title="Excluir minha conta">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              Tem certeza? Isso apaga sua conta, filhos cadastrados e salvos. Não dá para desfazer.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Seus dados são tratados conforme a LGPD (Lei 13.709/2018). Exclusão é definitiva e
              imediata; conteúdos públicos aprovados (histórias, respostas) podem permanecer
              anonimizados. Dúvidas:{" "}
              <Link to="/politica-de-privacidade" className="underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Digite EXCLUIR para confirmar"
              className={cn(inputClass, "mt-4")}
            />
            <button
              type="button"
              onClick={deleteAccount}
              disabled={confirmText !== "EXCLUIR" || deleting}
              className={cn(dangerBtn, "mt-2")}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Excluir minha conta
            </button>
          </Card>
        </div>
      )}
    </AreaShell>
  );
}
