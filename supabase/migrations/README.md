# Migrations do Vocação de Pai

| Arquivo | Conteúdo | Aplicada em |
|---|---|---|
| `0001_core.sql` … `0007_ferramentas.sql` | Schema completo (39 tabelas, RLS, funções, buckets), cópia literal do doc 02 §4.1–§4.7 | Fase 1 (todas de uma vez) |
| `0008_seed_autor.sql` | Usuário/perfil "Equipe Vocação de Pai" (`e8bb17c5-ce46-4d2c-bda7-4d86d975f6fa`) | Fase 1 |
| `0009_seed_posts_a.sql`, `0010_seed_posts_b.sql` | 10 artigos Padrão A do Pai (`status='published'`) | Fase 1 |

Ordem de aplicação: 0001 → 0010, via `mcp__Supabase__apply_migration` (DDL) ou `execute_sql` (dados) no projeto `<SUPABASE_PROJECT_REF>`.
Todas são idempotentes (`create table if not exists`, `drop policy if exists` antes de `create policy`, seeds com `on conflict`).
Validadas num Postgres 16 local com o stub do Supabase (auth/storage/vault) em 30/10/2026: 7/7 sem erro em duas passagens.
As fases 2 a 8 só acrescentam dados e funções próprias em `00NN_<descricao>.sql`.
