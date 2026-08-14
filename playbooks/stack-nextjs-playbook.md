# Playbook de Stack — Next.js (App Router) + TypeScript + Tailwind + Prisma + shadcn/ui

**Versão:** 1.0
**Data:** 10 de agosto de 2026
**Revisado em:** 10 de agosto de 2026 — versão inicial, extraída de um projeto de cliente
que combinava esta stack, no momento em que ficou claro que os padrões técnicos
encontrados eram genéricos à combinação de tecnologias, não ao produto específico.

> **Este arquivo não pertence a nenhum projeto específico.** Diferente do
> `engenharia-playbook.md` (que é sobre *processo*, vale pra qualquer stack), este é sobre
> *padrões técnicos repetíveis* — vale toda vez que você montar um projeto com essa
> combinação específica de tecnologias. Se um dia você trocar de stack, este arquivo não
> se aplica mais (mas o `engenharia-playbook.md` continua valendo).
>
> **Origem:** extraído do PRD de um projeto de cliente que usava esta stack.

> **Referenciado por (rastreabilidade reversa):**
>
> | Projeto | Versão do playbook referenciada | Observação |
> | --- | --- | --- |
> | Catálogo de Óleos Essenciais | v1.0 (esta) | PRD v1.12 substitui seu antigo §8.3–§8.4 por referência a este arquivo, mantendo os valores concretos do projeto (revalidate por entidade, versão do `lucide-react`) em `tech-specification.md` §2.4 e §7.1 |
>
> Se este playbook mudar de forma incompatível com um projeto listado aqui, sinalize a
> revisão necessária.

---

## 1. Arquitetura de Componentes

Convenção para evitar que qualquer fase/feature reimplemente botão, card, input e
formulário do zero.

```
components/
 ├─ ui/                    ← componentes genéricos, sem conhecimento de domínio
 │   ├─ button.tsx
 │   ├─ card.tsx
 │   ├─ input.tsx
 │   ├─ form.tsx
 │   └─ badge.tsx
 └─ sections/              ← componentes específicos do domínio do produto
     ├─ [nome-da-seção].tsx  ← compõe elementos de ui/, nunca duplica estilo
     └─ ...
```

| Elemento | Convenção |
| --- | --- |
| **Origem dos componentes** | `shadcn/ui` via `npx shadcn@latest add <componente>` — código copiado para o projeto, não é dependência de pacote |
| **Estilização** | Somente via classes Tailwind referenciando tokens do `tailwind.config` (ex: `bg-primary`) — nunca hex direto no JSX |
| **Composição** | Componentes de `sections/` **não duplicam estilo**: sempre compõem os elementos de `ui/` |
| **Origem dos tokens** | Vêm do design-tokens do projeto (arquivo específico de cada produto) — nunca inventados ad-hoc num componente |
| **Acessibilidade** | Herdada do `shadcn/ui` (labels, foco por teclado, ARIA) — não elimina a necessidade de verificar WCAG no projeto, só reduz a superfície de erro |

---

## 2. Cinco Padrões Técnicos Obrigatórios

Gotchas reais desta stack, cada um motivado por um erro que já aconteceu ou que é fácil de
cometer sem essa lembrança explícita.

| # | Padrão | Regra |
| --- | --- | --- |
| 1 | **Botão com `render`/`asChild`** | Se o alvo de renderização de um `Button` não for um `<button>` nativo (ex: um `<a>`, para um link estilizado como botão), **sempre** passar a prop que desativa a renderização de botão nativo (ex: `nativeButton={false}`, dependendo da versão do componente) — omitir isso gera HTML inválido (`<button>` aninhado em `<a>` ou vice-versa) |
| 2 | **Client vs. Server Component** | Todo componente que usa hooks (`useState`, `useEffect`, `onClick`) precisa de `"use client"` no topo. Decidir isso **antes** de escrever o componente, não como correção depois de um erro de build |
| 3 | **Revalidação de dados (ISR)** | Toda query do Prisma usada por uma página precisa de estratégia de cache explícita. Em páginas que combinam múltiplas fontes com sensibilidade de atualização diferente (ex: uma entidade muda todo dia, outra raramente), decidir o `revalidate` **por query** (via `unstable_cache`), não por página inteira — evita que a fonte mais volátil force revalidação desnecessária das outras. Valores concretos de cada query ficam no tech-spec do projeto, não aqui |
| 4 | **Ícones de biblioteca (ex: lucide-react)** | Confirmar contra a versão real instalada do pacote antes de assumir que um ícone existe — nomes de ícone mudam entre versões. Para ícones ausentes, usar SVG inline com os tokens de cor do projeto, não travar a implementação esperando um ícone específico |
| 5 | **Testes e2e que mutam dados via Prisma** | Executar via script separado, invocado como processo isolado (ex: `node node_modules/tsx/dist/cli.cjs --env-file=.env <script>`), **nunca** importando o client do Prisma diretamente no arquivo de spec do test runner — evita conflito de connection pool entre o runner de testes e o processo de mutação |

---

## Como usar este arquivo

No PRD ou tech-spec de cada projeto que usar esta stack, a seção correspondente deve
conter só uma referência a este playbook + os valores concretos daquele projeto (nomes de
componentes específicos, valores de `revalidate` por entidade, versão exata do
`lucide-react` instalada). Não copie a tabela de padrões inteira para dentro do documento
do projeto — se você descobrir um sexto gotcha da stack no meio de um projeto futuro,
adicione aqui, e todo projeto que referencia este arquivo herda o aprendizado.
