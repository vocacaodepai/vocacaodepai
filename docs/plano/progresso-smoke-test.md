# Smoke test SSR — consolidação das Fases 1-7 (2026-10-30)

> Rodado na branch `claude/fase-1-fundacao` com `npx vite dev --port 4180 --host 127.0.0.1`, **sem `.env`**
> (Supabase placeholder: toda consulta falha e cai em estado vazio). Esperado: 200 (página ou estado vazio),
> 404 (slug inexistente) ou redirect; **nenhum 500**. Rotas listadas a partir de `src/routeTree.gen.ts`:
> todas as públicas (fora `/admin/*` e `/api/*`), as 17 ferramentas do registry, as 10 categorias da Loja do Pai,
> mais `/admin/login` (deve dar 200) e `/api/market/refresh` sem Bearer (deve dar 401).
> Método: `curl` GET em cada rota, registrando código HTTP e `<title>`.

## Resultado

| Código | Rotas |
|---|---|
| 200 | 71 |
| 401 | 1 |
| 404 | 15 |

Nenhum 500. Nenhum redirect no SSR: as páginas privadas (`/area-do-pai/*`, `/minha-conta`) renderizam o
`RequireAuth` com 200 e só redirecionam para `/entrar?next=` no cliente, quando não há sessão.

## Corrigido durante o smoke test

| Rota | Antes | Causa | Correção |
|---|---|---|---|
| `/rss.xml` | 500 | `buildRss` lança quando o banco falha e o `catch` devolvia o feed vazio com **status 500** | Feed vazio (válido) com **200** e `cache-control: no-store` (`src/routes/rss[.]xml.ts`) |
| `/loja/categoria/<slug oficial>` (10 categorias) | 404 | `getStoreCategoryData` só confiava em `product_categories` do banco; com banco vazio/fora do ar, slug oficial virava `notFound()` | Rede de segurança com o catálogo estático `STORE_CATEGORIES` (categoria sintética `static:<slug>`, sem produtos); 404 continua só para slug que não existe em lugar nenhum (`src/lib/loja/loja.functions.ts`) |

Observação: `src/routes/sitemap[.]xml.ts` tem um `catch` de último recurso com 500, mas não disparou (as consultas
internas já degradam para vazio); ficou como está.

## Tabela completa (rota | código | título)

| Rota | Código | Título |
|---|---|---|
| `/` | 200 | Vocação de Pai — Para o homem que segura a casa |
| `/blog` | 200 | Blog do Vocação de Pai |
| `/busca` | 200 | Busca |
| `/busca?q=pai` | 200 | Busca |
| `/categoria/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/post/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/pai-indica` | 200 | Pai Indica: reviews e comparativos com nota de 0 a 10 |
| `/pai-indica/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/loja` | 200 | Loja do Pai |
| `/loja/categoria/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/loja/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/ferramentas` | 200 | Caixa de Ferramentas do pai: calculadoras e guias práticos |
| `/ferramentas/slug-inexistente` | 404 | Ferramenta não encontrada |
| `/area-do-pai` | 200 | Área do Pai |
| `/area-do-pai/filhos` | 200 | Seus filhos — Área do Pai |
| `/area-do-pai/onboarding` | 200 | Bem-vindo à Área do Pai |
| `/area-do-pai/plano` | 200 | Seu plano — Área do Pai |
| `/area-do-pai/salvos` | 200 | Salvos — Área do Pai |
| `/minha-conta` | 200 | Minha conta |
| `/entrar` | 200 | Entrar na Área do Pai |
| `/cadastro` | 200 | Crie sua conta grátis |
| `/recuperar-senha` | 200 | Recuperar senha |
| `/auth/callback` | 200 | Entrando… |
| `/pai-indica-pai` | 200 | Pai Indica Pai |
| `/pai-indica-pai/vagas` | 200 | Vagas indicadas por pais |
| `/pai-indica-pai/vagas/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/pai-indica-pai/vagas/nova` | 200 | Publicar vaga |
| `/pai-indica-pai/vagas/rss.xml` | 200 | Vagas — Pai Indica Pai |
| `/pai-indica-pai/indicacoes` | 200 | Indicações de confiança |
| `/pai-indica-pai/indicacoes/nova` | 200 | Indicar profissional, serviço ou empresa |
| `/pai-indica-pai/mentoria` | 200 | Mentoria de pai para pai |
| `/pai-indica-pai/profissionais` | 200 | Pai Profissional — diretório de pais que fazem bem o que fazem |
| `/pai-indica-pai/profissionais/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/pai-indica-pai/profissionais/novo` | 200 | Meu perfil de Pai Profissional |
| `/irmandade` | 200 | Irmandade |
| `/historias` | 200 | Histórias de pai |
| `/historias/00000000-0000-0000-0000-000000000000` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/historias/id-invalido` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/historias/nova` | 200 | Conte sua história |
| `/perguntas` | 200 | Perguntas da Irmandade |
| `/perguntas/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/perguntas/nova` | 200 | Faça uma pergunta |
| `/eventos` | 200 | Encontros da Irmandade |
| `/eventos/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/formacao` | 200 | Formação |
| `/formacao/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/desafios` | 200 | Desafios do Pai |
| `/desafios/slug-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/sobre` | 200 | Sobre o Vocação de Pai |
| `/contato` | 200 | Contato |
| `/politica-de-privacidade` | 200 | Política de privacidade |
| `/termos-de-uso` | 200 | Termos de uso |
| `/politica-de-afiliados` | 200 | Política de afiliados |
| `/rss.xml` | 200 | Vocação de Pai |
| `/sitemap.xml` | 200 | <?xml version="1.0" encoding="UTF-8"?> <urlset xmlns="http://www.sitemaps.org/sc |
| `/sitemap-vagas.xml` | 200 | <?xml version="1.0" encoding="UTF-8"?> <urlset xmlns="http://www.sitemaps.org/sc |
| `/robots.txt` | 200 | User-agent: * Allow: / Disallow: /admin  Sitemap: https://vocacaodepai.com.br/si |
| `/rota-inexistente` | 404 | Vocação de Pai — Para o homem que segura a casa |
| `/ferramentas/conversor-de-moedas` | 200 | Conversor de moedas: dólar, euro e 30+ moedas em reais hoje |
| `/ferramentas/mercado-financeiro` | 200 | Mercado financeiro hoje: dólar, bitcoin, Selic e IPCA |
| `/ferramentas/custo-do-filho` | 200 | Quanto custa um filho por mês e até os 18 anos |
| `/ferramentas/licenca-paternidade` | 200 | Licença-paternidade: quantos dias você tem e quando volta |
| `/ferramentas/calculadora-de-churrasco` | 200 | Calculadora de churrasco: carne, carvão e bebida por pessoa |
| `/ferramentas/cortes-de-carne` | 200 | Cortes de carne bovina: guia do boi com preparo e ponto |
| `/ferramentas/orcamento-familiar` | 200 | Orçamento familiar: planilha simples para o pai de família |
| `/ferramentas/juros-compostos` | 200 | Juros compostos: simule aportes mensais e veja o resultado |
| `/ferramentas/reserva-de-emergencia` | 200 | Reserva de emergência: quanto guardar e em quanto tempo |
| `/ferramentas/pensao-alimenticia` | 200 | Pensão alimentícia: faixa estimada por renda e filhos |
| `/ferramentas/conversor-de-unidades` | 200 | Conversor de unidades: polegada, libra, psi, xícara e mais |
| `/ferramentas/kit-de-ferramentas` | 200 | Kit de ferramentas: o que todo pai precisa ter em casa |
| `/ferramentas/nomes-de-filhos` | 200 | Nomes de filhos: significado, origem e nomes de santos |
| `/ferramentas/calendario-de-vacinacao` | 200 | Calendário de vacinação infantil: próximas doses por idade |
| `/ferramentas/marcos-do-desenvolvimento` | 200 | Marcos do desenvolvimento do filho: o que esperar por idade |
| `/ferramentas/imc-e-gasto-calorico` | 200 | Calculadora de IMC e gasto calórico para homens |
| `/ferramentas/checklist-da-maternidade` | 200 | Mala da maternidade: o checklist do pai para o dia do parto |
| `/loja/categoria/churrasco-e-cozinha` | 200 | Churrasco e Cozinha |
| `/loja/categoria/ferramentas` | 200 | Ferramentas |
| `/loja/categoria/carro-e-moto` | 200 | Carro e Moto |
| `/loja/categoria/tecnologia` | 200 | Tecnologia |
| `/loja/categoria/esporte-e-outdoor` | 200 | Esporte e Outdoor |
| `/loja/categoria/bebe-e-crianca` | 200 | Bebê e Criança |
| `/loja/categoria/casa-e-jardim` | 200 | Casa e Jardim |
| `/loja/categoria/saude-do-homem` | 200 | Saúde do Homem |
| `/loja/categoria/estilo-e-barba` | 200 | Estilo e Barba |
| `/loja/categoria/livros-e-formacao` | 200 | Livros e Formação |
| `/admin/login` | 200 | Login administrativo |
| `/api/market/refresh` | 401 | unauthorized |

## Como repetir

```bash
npx vite dev --port 4180 --host 127.0.0.1 &   # sem .env
for r in / /blog /post/slug-inexistente /loja/categoria/ferramentas /rss.xml /admin/login; do
  curl -s -o /dev/null -w "$r %{http_code}\n" "http://127.0.0.1:4180$r"; done
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4180/api/market/refresh   # 401 sem Bearer
```
