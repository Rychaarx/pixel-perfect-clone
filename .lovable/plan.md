

## Diagnóstico: Upload travando

O problema principal está na lógica de retomada do TUS upload. O método `resumeFrom` está sendo chamado via cast `(upload as any).resumeFrom(prev[0])`, o que pode falhar silenciosamente no tus-js-client v4, fazendo o upload nunca resolver a Promise e travando todo o fluxo sequencial.

Além disso, os uploads são sequenciais (um por vez com `await`), então se um travar, todos os seguintes ficam bloqueados indefinidamente.

## Correções planejadas em `AdminSeasons.tsx`

1. **Corrigir lógica de resume do TUS** -- Remover o `resumeFrom` problemático e usar apenas `upload.start()`. O TUS já tem `retryDelays` configurado para reconexão automática.

2. **Adicionar timeout por upload** -- Envolver cada upload em um `Promise.race` com timeout de 5 minutos, evitando travamento infinito.

3. **Paralelizar uploads** -- Processar uploads em paralelo (com limite de 3 simultâneos) para maior velocidade, usando uma fila concorrente simples.

4. **Usar `useRef` para estado dos episódios durante upload** -- Manter uma ref com o array atualizado de episódios para evitar closures com estado obsoleto durante uploads assíncronos.

## Detalhes técnicos

- Substituir o loop `for...await` sequencial por `Promise.allSettled` com pool de concorrência
- Cada upload terá um wrapper com `setTimeout` de 5 min que rejeita a Promise
- Remover o bloco `findPreviousUploads/resumeFrom` inteiro (causa do travamento)
- Adicionar `abort()` no upload em caso de timeout

