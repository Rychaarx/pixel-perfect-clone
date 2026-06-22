## Objetivo

Cada usuário cadastra URLs de addons estilo Stremio (manifest.json). Ao clicar "Assistir" num título, o app consulta todos os addons habilitados do usuário, agrega os streams retornados e mostra uma lista de fontes para o usuário escolher qual abrir.

## O que será construído

### 1. Banco de dados
Nova tabela `user_addons`:
- `user_id` (dono)
- `name`, `description`, `logo_url` (do manifest)
- `manifest_url` (URL completa do manifest.json)
- `transport_url` (URL base sem `/manifest.json`)
- `types` (array: movie, series, anime)
- `resources` (array: stream, catalog, meta)
- `enabled` (boolean)
- `sort_order` (int)

RLS: cada usuário só vê/edita os próprios addons.

Adicionar coluna `imdb_id` (text, nullable) em `catalog_items` — necessário porque addons Stremio buscam por ID IMDB (`tt1234567`). Será preenchida via TMDB (a API TMDB já retorna o IMDB ID).

### 2. Edge Function `stremio-streams`
- Recebe: `imdbId`, `type` (movie/series), `season?`, `episode?`
- Lê os addons habilitados do usuário autenticado
- Faz fetch paralelo em cada `{transport_url}/stream/{type}/{id}.json`
- Agrega resultados, deduplica, retorna lista com `{addonName, title, name, url, behaviorHints}`
- Tratamento de timeout (5s por addon) e erros silenciosos por addon
- Resolve problema de CORS (addons não permitem chamadas do browser direto)

Outra Edge Function `stremio-manifest` para validar e buscar metadados do manifest ao adicionar (também resolve CORS).

### 3. UI nova: página "Addons" (`/addons`)
Acessível pelo menu hamburguer. Mostra:
- Lista dos addons cadastrados com toggle ligar/desligar, reordenar, excluir
- Botão "Adicionar addon" → input com URL do manifest → valida via edge function → mostra preview (nome, logo, tipos suportados) → confirma
- Atalhos para addons populares (Torrentio, etc) — só uma lista de URLs sugeridas, usuário cola manualmente
- Aviso de que streams de torrent precisam de um debrid configurado no próprio addon

### 4. UI: modal "Fontes" em TitleDetails
Substitui o atual fluxo direto de Assistir quando o item tem `imdb_id` e o usuário tem addons habilitados:
- Botão "Assistir Agora" abre modal `SourcesDialog`
- Loading com skeletons enquanto chama `stremio-streams`
- Lista agrupada por addon, cada fonte mostra: qualidade/título, tamanho (se disponível), tag do addon
- Clicar numa fonte: se for URL HTTP direta (.mp4/.m3u8) toca no player nativo; senão redireciona/abre em nova aba
- Fallback: se não houver addons ou nenhuma fonte, mantém o comportamento atual (videoUrl/redirectUrl)
- Se item não tem `imdb_id`, mostrar botão pequeno "buscar IMDB ID" no admin

### 5. Hook `useAddons`
CRUD dos addons + função `fetchStreams(imdbId, type, season?, episode?)` que chama a edge function.

## Detalhes técnicos

- Edge functions com `verify_jwt = false` mas validando JWT no código (padrão das outras funções do projeto).
- Validação de URL com Zod nas edge functions.
- Manifest spec: GET `{url}` retorna `{id, name, version, description, logo, types, resources, idPrefixes}`.
- Stream endpoint: GET `{transport}/stream/{type}/{id}.json` retorna `{streams: [{name, title, url, ytId, infoHash, fileIdx, behaviorHints}]}`. Para séries o id é `tt1234567:1:1` (imdb:season:episode).
- IMDB ID via TMDB: endpoint `/movie/{id}/external_ids` ou `/tv/{id}/external_ids` — adicionar campo no fluxo de busca/import existente (`useTmdbSearch` / `tmdb-search` function).
- Migração `user_addons` segue padrão GRANT + RLS já usado no projeto.
- Sem mudanças no `BottomNav` (continua removido).

## Arquivos

Novos:
- `supabase/functions/stremio-manifest/index.ts`
- `supabase/functions/stremio-streams/index.ts`
- `src/hooks/useAddons.ts`
- `src/pages/Addons.tsx`
- `src/components/SourcesDialog.tsx`
- Migração SQL: `user_addons` + `imdb_id` em `catalog_items`

Editados:
- `src/App.tsx` (rota `/addons`)
- `src/components/Navbar.tsx` (item "Addons" no menu)
- `src/pages/TitleDetails.tsx` (integrar SourcesDialog)
- `supabase/functions/tmdb-search/index.ts` (incluir `imdb_id` nos resultados)
- `src/components/admin/MissingVideosPanel.tsx` (botão para buscar IMDB ID)

## Fora do escopo
- Catálogos dos addons (só streams). Sua catalogação continua sendo manual/TMDB.
- Cache de resultados de stream (cada Assistir refaz a consulta para pegar fontes frescas).
- Proxy de streams (links retornados são abertos direto pelo cliente).