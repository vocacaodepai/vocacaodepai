-- 0008_seed_autor.sql — autor institucional "Equipe Vocação de Pai" (doc 03 §9.2; usado pelos 10 posts seed e pela rotina da Fase 8)
--
-- <AUTHOR_UUID> = e8bb17c5-ce46-4d2c-bda7-4d86d975f6fa  (registrado em docs/plano/PROGRESSO.md)
--
-- O doc 03 §9.2 manda criar o usuário contato@vocacaodepai.com.br no Supabase Auth (Dashboard › Authentication › Users
-- › Add user, "Auto Confirm User" marcado) e depois ajustar o perfil por SQL. Esta migration faz as duas coisas de forma
-- idempotente:
--   1. se ainda não existir usuário com esse e-mail, cria-o em auth.users/auth.identities com o <AUTHOR_UUID> fixo e uma
--      senha aleatória que ninguém conhece — o dono define a senha real pelo Dashboard ("Reset password" / "Send password
--      recovery") e a guarda; se o dono já tiver criado o usuário pelo Dashboard, nada é inserido e o id dele prevalece;
--   2. garante a linha em public.profiles com display_name = 'Equipe Vocação de Pai' e role = 'editor'
--      (o trigger handle_new_user já cria o perfil no insert; aqui só ajustamos nome e papel).
-- Aplicar via mcp__Supabase__apply_migration. Nunca DELETE/DROP (CLAUDE.md §4.2).

do $seed$
declare
  v_id    uuid := 'e8bb17c5-ce46-4d2c-bda7-4d86d975f6fa';
  v_email text := 'contato@vocacaodepai.com.br';
begin
  -- A migration roda como postgres, sem JWT. O trigger guard_profile_role() (0001) só deixa trocar `role` para
  -- service_role/admin; marcamos a transação como escrita de serviço (set_config local, vale só até o fim do bloco).
  perform set_config('request.jwt.claim.role', 'service_role', true);

  if not exists (select 1 from auth.users where lower(email) = v_email) then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token, is_sso_user
    ) values (
      v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email,
      extensions.crypt(gen_random_uuid()::text || gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Equipe Vocação de Pai"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '', false
    );
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'display_name', 'Equipe Vocação de Pai'),
      'email', now(), now(), now()
    );
  end if;

  -- Perfil: cria se o trigger não tiver criado e ajusta nome/papel (idempotente)
  insert into public.profiles (id, display_name, role, bio)
  select u.id, 'Equipe Vocação de Pai', 'editor',
         'Conteúdo editorial do Vocação de Pai: formação do homem como pai, marido, provedor e líder servidor.'
  from auth.users u where lower(u.email) = v_email
  on conflict (id) do update set
    display_name = excluded.display_name,
    role = excluded.role,
    bio = coalesce(public.profiles.bio, excluded.bio),
    updated_at = now();
end $seed$;

-- Aceite: select id, display_name, role from public.profiles where id = (select id from auth.users where email = 'contato@vocacaodepai.com.br');
-- → 1 linha, display_name = 'Equipe Vocação de Pai', role = 'editor'
