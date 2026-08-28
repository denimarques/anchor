# Playbook de Stack — Next.js (App Router) + TypeScript + Tailwind + Prisma + shadcn/ui

<!-- doc-version: 1.3 -->

**Versão:** 1.3
**Data:** 10 de agosto de 2026
**Revisado em:** 26 de agosto de 2026 — corrige o padrão #8: o arquivo/função se chamam
`proxy.ts`/`proxy` desde o Next.js 16 (`middleware.ts`/`middleware` foi deprecado
oficialmente — `nextjs.org/blog/next-16` — a maioria das fontes confirma que o nome
antigo ainda funciona hoje com aviso de depreciação, mas pelo menos uma fonte reporta
build silenciosamente ignorando o arquivo em certas versões; migração de custo trivial,
sem motivo para arriscar). Revisão anterior (v1.2, mesma data): adiciona os padrões #9
(teste automatizado no gate do CI) e #10 (tradução Next.js da regra agnóstica "sem
acoplamento entre domínios", `engenharia-playbook.md` §12). Revisão v1.1 (25/08/2026):
diagrama de §1 corrigido para bater com a estrutura real usada em produção (sem pasta
`sections/` intermediária); adicionado o padrão #6 (reaproveitar componentes de `ui/`).
Versão original (1.0): extraído de um projeto de cliente que combinava esta stack, no
momento em que ficou claro que os padrões técnicos encontrados eram genéricos à
combinação de tecnologias, não ao produto específico.

> **Este arquivo não pertence a nenhum projeto específico.** Diferente do
> `engenharia-playbook.md` (que é sobre *processo*, vale pra qualquer stack), este é sobre
> *padrões técnicos repetíveis* — vale toda vez que você montar um projeto com essa
> combinação específica de tecnologias. Se um dia você trocar de stack, este arquivo não
> se aplica mais (mas o `engenharia-playbook.md` continua valendo).
>
> **Origem:** extraído do PRD de um projeto de cliente que usava esta stack.

> **Referenciado por (rastreabilidade reversa):**
>
> Formato parseável por `scripts/verify-traceability.js` (ver `engenharia-playbook.md`
> §9) — a versão do documento do cliente vai na sua própria coluna, nunca embutida em
> texto livre (foi assim que uma revisão anterior desta tabela citou "PRD v1.12" quando
> o `prd.md` real estava em `1.1`).
>
> | Projeto | Documento do cliente | `doc-version` registrado | Versão deste playbook | Âncora(s) referenciada(s) |
> | --- | --- | --- | --- | --- |
> | Lente Peixe | `docs/prd.md` | `1.7` | `v1.3` | Referencia este arquivo inteiro em vez de manter a tabela de padrões inline (sem âncora específica) |
> | Lente Peixe | `docs/tech/tech-specification.md` | `1.20` | `v1.3` | Valores concretos do projeto: `cache-por-entidade` e `icones-lucide-react` |
>
> Se este playbook mudar de forma incompatível com um projeto listado aqui, sinalize a
> revisão necessária. Mecanismo de âncora nomeada (por que a coluna acima cita nomes em
> vez de só "§N"): `engenharia-playbook.md` §9.

---

## 1. Arquitetura de Componentes <!-- anchor: arquitetura-de-componentes -->

Convenção para evitar que qualquer fase/feature reimplemente botão, card, input e
formulário do zero.

```
components/
 ├─ ui/                    ← componentes genéricos, sem conhecimento de domínio
 │   ├─ button.tsx
 │   ├─ icon-button.tsx
 │   ├─ card.tsx
 │   ├─ input.tsx
 │   ├─ form.tsx
 │   └─ badge.tsx
 └─ [nome-da-seção]/       ← componente específico do domínio do produto, direto na raiz
     ├─ index.tsx            de components/ (sem pasta `sections/` intermediária) —
     └─ ...                  compõe elementos de ui/, nunca duplica estilo
```

> **Nota (25/08/2026):** versões anteriores deste diagrama mostravam uma pasta
> `sections/` entre `components/` e o nome de cada seção. A implementação real (Lente
> Peixe, confirmado via `tsconfig.json` — `"@/*": ["./*"]`, sem alias especial) nunca
> teve essa pasta; seções sempre viveram direto em `components/<nome>/`. A distinção que
> importa (genérico vs. específico de domínio) continua garantida só pela existência de
> `ui/` — a pasta `sections/` não carregava nenhuma regra própria, então mantê-la no
> diagrama só criava divergência entre documentação e código sem nenhum ganho.

| Elemento | Convenção |
| --- | --- |
| **Origem dos componentes** | `shadcn/ui` via `npx shadcn@latest add <componente>` — código copiado para o projeto, não é dependência de pacote |
| **Estilização** | Somente via classes Tailwind referenciando tokens do `tailwind.config` (ex: `bg-primary`) — nunca hex direto no JSX |
| **Composição** | Componentes específicos de domínio **não duplicam estilo**: sempre compõem os elementos de `ui/` |
| **Origem dos tokens** | Vêm do design-tokens do projeto (arquivo específico de cada produto) — nunca inventados ad-hoc num componente |
| **Acessibilidade** | Herdada do `shadcn/ui` (labels, foco por teclado, ARIA) — não elimina a necessidade de verificar WCAG no projeto, só reduz a superfície de erro |

---

## 2. Dez Padrões Técnicos Obrigatórios <!-- anchor: cinco-padroes-tecnicos-obrigatorios -->

Gotchas reais desta stack, cada um motivado por um erro que já aconteceu ou que é fácil de
cometer sem essa lembrança explícita.

| # | Padrão | Regra |
| --- | --- | --- |
| 1 | **Botão com `render`/`asChild`** | Se o alvo de renderização de um `Button` não for um `<button>` nativo (ex: um `<a>`, para um link estilizado como botão), **sempre** passar a prop que desativa a renderização de botão nativo (ex: `nativeButton={false}`, dependendo da versão do componente) — omitir isso gera HTML inválido (`<button>` aninhado em `<a>` ou vice-versa) |
| 2 | **Client vs. Server Component** | Todo componente que usa hooks (`useState`, `useEffect`, `onClick`) precisa de `"use client"` no topo. Decidir isso **antes** de escrever o componente, não como correção depois de um erro de build |
| 3 | **Revalidação de dados (ISR)** | Toda query do Prisma usada por uma página precisa de estratégia de cache explícita. Em páginas que combinam múltiplas fontes com sensibilidade de atualização diferente (ex: uma entidade muda todo dia, outra raramente), decidir o `revalidate` **por query** (via `unstable_cache`), não por página inteira — evita que a fonte mais volátil force revalidação desnecessária das outras. Valores concretos de cada query ficam no tech-spec do projeto, não aqui |
| 4 | **Ícones de biblioteca (ex: lucide-react)** | Confirmar contra a versão real instalada do pacote antes de assumir que um ícone existe — nomes de ícone mudam entre versões. Para ícones ausentes, usar SVG inline com os tokens de cor do projeto, não travar a implementação esperando um ícone específico |
| 5 | **Testes e2e que mutam dados via Prisma** | Executar via script separado, invocado como processo isolado (ex: `node node_modules/tsx/dist/cli.cjs --env-file=.env <script>`), **nunca** importando o client do Prisma diretamente no arquivo de spec do test runner — evita conflito de connection pool entre o runner de testes e o processo de mutação |
| 6 | **Reaproveitar componentes de `ui/`, nunca duplicar estilo** | Antes de estilizar um `<button>`/`<a>` nativo com uma classe visual (forma + cor) que já existe em outro componente do projeto (via `<Button>`, `<IconButton>` ou qualquer outro de `ui/`), pare e reaproveite o componente — não copie a classe. Se o mesmo padrão visual aparecer pela 2ª vez em arquivos diferentes sem nenhum componente compartilhado por trás, extraia um componente novo em `ui/` antes de continuar; não deixe chegar numa 3ª cópia. Verificação automatizada (heurística, não substitui revisão): `scripts/verify-componentization.js` |
| 7 | **Headers de segurança via `next.config.ts`** | Todo projeto configura `headers()` no `next.config.ts` com `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restritiva, e `Strict-Transport-Security`. CSP entra em modo `Content-Security-Policy-Report-Only` primeiro — nunca enforcing sem confirmar em produção que nada legítimo (imagens, analytics, fontes) quebra. Checklist completo: `engenharia-playbook.md` §10.1 |
| 8 | **Rate-limit e validação de origem via `proxy.ts`, nunca duplicado por rota** | Qualquer rota `/api/**` que aceite escrita pública (`POST`) passa por rate-limit (`@upstash/ratelimit` + `@upstash/redis`, `slidingWindow`) e validação de `Origin` centralizados em `proxy.ts` — nunca implementado individualmente em cada `route.ts` (mesma lógica de "não duplicar", agora aplicada a segurança em vez de estilo visual — ver padrão #6). Quando o projeto ganhar autenticação, o guard de rotas protegidas (`/admin/**` ou equivalente) também vive aqui. Checklist completo: `engenharia-playbook.md` §10.2/§10.3. **Nomenclatura (Next.js 16+):** o arquivo se chama `proxy.ts`, com a função exportada `proxy` — não `middleware.ts`/`middleware`, convenção anterior ao Next.js 16, deprecada oficialmente (`nextjs.org/blog/next-16`) |
| 9 | **`test:unit` roda dentro do job `build`, nunca como job separado** | O job `build` do CI (`ci-job-ids.md` trava os 3 nomes: `build`/`accessibility`/`responsive` — não criar um 4º) passa a rodar `npm run test:unit` (Vitest) junto com `next build` e `docs:check`. Se qualquer teste falhar, o job falha, e a branch protection bloqueia o merge — fecha o gap de "teste existe mas não é gate" (`engenharia-playbook.md` §11.1/§11.2). Comando do job `build` atualizado: `npx prisma generate && npm run build && npm run test:unit && npm run docs:check` |
| 10 | **Tradução Next.js da regra "sem acoplamento entre domínios"** (`engenharia-playbook.md` §12, agnóstica de stack) | Módulo de `lib/queries/<domínio>.ts` nunca importa outro módulo de `lib/queries/`. Se uma tela/componente precisa de dado de dois domínios, importa e chama os dois módulos diretamente — a composição acontece no componente, nunca dentro de um módulo de domínio chamando outro. Este é o único lugar onde o caminho `lib/queries/` aparece — a regra em si vive no playbook agnóstico |

**Incidente de referência do padrão #6:** descoberto numa auditoria manual do Lente Peixe
— o CTA "Saiba mais" da seção Sobre Nós duplicava à mão a classe `rounded-button
bg-secondary text-white` que já existia em 4 outros lugares via `<Button>`, e as setas de
paginação do carrossel de Depoimentos e do Grid de produtos duplicavam a mesma classe
`rounded-full border border-border-subtle` uma na outra, sem nenhum componente de `ui/`
por trás de nenhuma das duas. Nenhum erro de build, nenhum teste quebrado — só estilo
divergindo silenciosamente da primeira mudança em diante.

**Incidente de referência dos padrões #7/#8:** descoberta numa auditoria de segurança do
Lente Peixe — o projeto não tinha nenhum header de segurança configurado (`next.config.ts`
só continha `images`/`allowedDevOrigins`), e o rate-limit já estava nas dependências
(`@upstash/ratelimit`) mas sem confirmação de que estava de fato aplicado a alguma rota —
exatamente o tipo de "infraestrutura presente, wiring ausente" que passa despercebido
até virar incidente.

**Incidente de referência do padrão #9:** `test:unit` existia no `package.json`, testes
passavam localmente, mas nenhum job obrigatório de CI os executava — nada impedia um
merge que os quebrasse.

---

## Como usar este arquivo

No PRD ou tech-spec de cada projeto que usar esta stack, a seção correspondente deve
conter só uma referência a este playbook + os valores concretos daquele projeto (nomes de
componentes específicos, valores de `revalidate` por entidade, versão exata do
`lucide-react` instalada). Não copie a tabela de padrões inteira para dentro do documento
do projeto — se você descobrir um 11º gotcha da stack no meio de um projeto futuro,
adicione aqui, e todo projeto que referencia este arquivo herda o aprendizado.
