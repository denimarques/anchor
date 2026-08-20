# Playbook de Stack — [NOME DA STACK E TECNOLOGIAS PRINCIPAIS]
<!-- Example: Playbook de Stack — Laravel + Livewire + Tailwind + MySQL -->
<!-- Example: Playbook de Stack — Angular (standalone components) + RxJS + Tailwind -->

<!-- doc-version: [X.Y] -->
<!-- Só existe de verdade a partir do primeiro projeto real nesta stack. Não escreva
"1.0" aqui até ter conteúdo extraído de fricção real (ver aviso abaixo) — até lá, este
arquivo é rascunho de estrutura, não playbook citável por nenhum projeto. -->

**Versão:** [X.Y]
**Data:** [DATA]
**Revisado em:** [DATA] — extraído de [nome do projeto de cliente], no momento em que
ficou claro que os padrões técnicos encontrados eram genéricos à combinação de
tecnologias, não ao produto específico.
<!-- Exemplo real (ver stack-nextjs-playbook.md): "extraído do PRD de um projeto de
cliente que usava esta stack." -->

> **Este arquivo não pertence a nenhum projeto específico.** Diferente do
> `engenharia-playbook.md` (que é sobre *processo*, vale pra qualquer stack), este é sobre
> *padrões técnicos repetíveis* — vale toda vez que você montar um projeto com essa
> combinação específica de tecnologias. Se um dia você trocar de stack, este arquivo não
> se aplica mais (mas o `engenharia-playbook.md` continua valendo).
>
> **Origem:** [extraído do PRD/tech-spec de qual projeto de cliente]

> **⚠️ Antes de preencher a seção 2 deste template:** os "padrões obrigatórios" só valem a
> pena registrar se vieram de fricção real — um erro que já aconteceu, uma decisão já
> tomada do mesmo jeito duas vezes, uma ambiguidade que já confundiu alguém. Não preencha
> com boas práticas genéricas copiadas de documentação oficial só para "deixar pronto" —
> isso cria aparência de conhecimento testado sem ser, o oposto do que faz este mecanismo
> valer a pena. Construa este playbook **depois** de um projeto real nesta stack, nunca
> antes, do mesmo jeito que `stack-nextjs-playbook.md` nasceu.

> **Referenciado por (rastreabilidade reversa):**
>
> Formato parseável por `scripts/verify-traceability.js` (ver `engenharia-playbook.md`
> §9) — a versão do documento do cliente vai na sua própria coluna, nunca embutida em
> texto livre.
>
> | Projeto | Documento do cliente | `doc-version` registrado | Versão deste playbook | Âncora(s) referenciada(s) |
> | --- | --- | --- | --- | --- |
> | _(nenhum projeto ainda — preencher ao adotar este playbook pela primeira vez)_ | | | | |
>
> Se este playbook mudar de forma incompatível com um projeto listado aqui, sinalize a
> revisão necessária.

---

## 1. Arquitetura de Componentes <!-- anchor: arquitetura-de-componentes -->

[Convenção de pastas/organização de código desta stack — o que evita que cada
feature/fase reimplemente botão, card, input, formulário do zero. Ver
`stack-nextjs-playbook.md` §1 como exemplo de **forma** (árvore de pastas + tabela de
convenções), não de conteúdo — a árvore de pastas de Laravel/Angular é outra.]

---

## 2. Padrões Técnicos Obrigatórios <!-- anchor: padroes-tecnicos-obrigatorios -->

[Tabela de gotchas reais desta stack, cada um motivado por um erro que já aconteceu ou
que é fácil de cometer sem essa lembrança explícita. Vazio até o primeiro projeto real
revelar os primeiros — ver aviso acima. Formato (`stack-nextjs-playbook.md` §2):]

| # | Padrão | Regra |
| --- | --- | --- |
| _(vazio — preencher só com gotcha real)_ | | |

---

## Como usar este arquivo

No PRD ou tech-spec de cada projeto que usar esta stack, a seção correspondente deve
conter só uma referência a este playbook + os valores concretos daquele projeto (nomes
específicos, versões exatas de dependência). Não copie a tabela de padrões inteira para
dentro do documento do projeto — se descobrir um gotcha novo no meio de um projeto
futuro, adicione aqui, e todo projeto que referencia este arquivo herda o aprendizado.
