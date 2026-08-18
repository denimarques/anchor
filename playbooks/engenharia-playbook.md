# Playbook de Engenharia — Processo (Git, CI, Documentação)

**Versão:** 1.0
**Data:** 18 de agosto de 2026
**Revisado em:** 18 de agosto de 2026 — reconstruído a partir das rules e skills que já
citavam este arquivo por número de seção (`commit-automatico.md`, `nunca-merge-local.md`,
`priorizar-tech-spec.md`, e as skills `bootstrap-ci-branch-protection`,
`ajuste-pos-lancamento`), cujo conteúdo canônico ainda não tinha sido consolidado aqui —
o arquivo publicado até então tinha, por engano, o mesmo conteúdo de
`stack-nextjs-playbook.md`.

> **Este arquivo não pertence a nenhum projeto específico e não é sobre uma stack
> técnica.** Diferente do `stack-nextjs-playbook.md` (que é sobre *padrões de código*
> repetíveis a uma combinação específica de tecnologias), este é sobre **processo** — git,
> CI, branch protection, disciplina de commit, e como manter os documentos de
> especificação consistentes entre si. Vale pra qualquer projeto do playbook,
> independente da stack escolhida.

> **Referenciado por (rastreabilidade reversa):**
>
> | Projeto | Versão referenciada | Observação |
> | --- | --- | --- |
> | Lente Peixe (Catálogo de Óleos Essenciais) | v1.0 (esta) | `tech-specification.md` §8 referencia §1–§4 deste playbook; `prd.md` referencia §6 para a regra de fonte corrente |
>
> Se este playbook mudar de forma incompatível com um projeto listado aqui, sinalize a
> revisão necessária.

---

## 1. Fluxo de PR e branch de integração — nunca merge local

O merge da PR de fase acontece via `gh pr merge`, condicionado a branch protection na
branch de integração — **nunca** via `git merge` local seguido de push. Um merge local
prévio ao push tornaria o CI decorativo: o código já estaria integrado antes de qualquer
check rodar contra o merge hipotético da PR.

**Fluxo correto por fase:**

1. `git push origin <branch-de-fase>` ao concluir todas as tasks da fase.
2. PR aberta automaticamente contra a branch de integração.
3. CI roda no evento `pull_request`.
4. Merge só ocorre (via `gh pr merge`) se os status checks obrigatórios passaram.
5. Sincronização local: `git checkout <integração> && git pull` — o local reflete o
   remoto, nunca o contrário.

Se o CI falhar: corrigir na própria branch de fase, novo push, aguardar novo run na
mesma PR — nunca tentar mergear com check vermelho.

A trave real é o branch protection (§3), não esta seção por si só — esta seção é a
convenção de fluxo; o branch protection é o que de fato impede o atalho.

---

## 2. Commit automático, task a task

Ao concluir cada task do `tasks.md`, commitar **imediatamente**, no padrão
`<tipo>(<task-id>): <resumo>` (Conventional Commits), sem pausar para confirmação
adicional apenas para esse passo.

Qualquer regra geral de segurança do tipo "não commitar sem pedido explícito" **não se
sobrepõe** a esta — ela é o próprio pedido explícito, dado uma única vez, quando este
projeto (ou o playbook que o referencia) é aceito como contexto.

Se não for possível commitar automaticamente por qualquer motivo, **avisar
explicitamente antes de continuar** — nunca seguir implementando tasks subsequentes em
silêncio sobre uma working tree sem commit.

**Incidente de referência (por que esta regra existe):** sem esta exceção explícita, um
agente já seguiu a regra genérica de "nunca commitar sem pedido" à risca e acumulou
dezenas de tasks numa única working tree sem nenhum histórico — tornando impossível
revisar o que mudou task a task, ou reverter uma task isolada sem reverter todas.

**Nota:** esta seção é orientação que o agente segue por instrução — a trava técnica
real (o que de fato impede merge sem CI verde) é o branch protection configurado em §3,
não a disciplina de commit em si.

---

## 3. Bootstrap de CI e Branch Protection (fase de Setup)

Procedimento de 4 passos, executado **uma única vez**, na fase de Setup — antes dele, o
fluxo normal de PR (§1) não é uma trava real, é só convenção.

1. **Criar a branch de integração a partir da principal**, como primeira ação da fase,
   antes de qualquer outra configuração.
2. **Criar o workflow de CI**, rodando no evento `pull_request`, executando os checks
   relevantes ao projeto (build, testes, verificações de qualidade específicas —
   confirmar no PRD/tech-spec do projeto quais, e os **nomes exatos dos job ids** se o
   projeto já os tiver travado em algum documento — ver nota abaixo).
3. **Configurar branch protection** na branch de integração e na principal, exigindo que
   os status checks passem antes de permitir merge, e desabilitando push direto.
4. **Exceção de bootstrap:** como a proteção ainda não existe nos passos 1–3, o primeiro
   commit/push desta fase é feito **diretamente na branch de integração** (sem PR), pois
   é o próprio código que instala a proteção. A partir daí, toda fase subsequente segue o
   fluxo normal de PR (§1).

**Nota sobre job ids:** se o projeto já travou os nomes exatos dos job ids em algum
documento (PRD ou tech-spec), esses nomes são obrigatórios e não podem divergir — um nome
diferente (ex: `accessibility-check` em vez de `accessibility`) faz a branch protection
exigir um status check que nunca é postado, bloqueando a PR indefinidamente sem erro
óbvio de causa. Confirmar contra o documento do projeto antes de escrever o workflow.

**Se algo falhar:** se não for possível configurar branch protection (permissão
insuficiente), avisar explicitamente e perguntar como proceder — nunca seguir o projeto
assumindo uma trava que não existe de fato.

---

## 4. O que é automático vs. o que exige confirmação explícita

| Automático (sem pausar) | Exige confirmação explícita do usuário |
| --- | --- |
| Commit ao final de cada task (§2) | Promoção da branch de integração para a branch principal/produção (deploy real) |
| Push da branch de fase + abertura de PR (§1) | Qualquer comando que afete a branch de produção/deploy diretamente |
| Merge da PR, condicionado ao CI verde (§1) | Ajuste pós-lançamento que envolva PR contra produção (§7) |
| Correção e novo push numa PR com CI vermelho | Configurar branch protection sem permissão de admin confirmada (§3) |

Este é o único ponto de decisão humana em todo o fluxo — tudo antes disso é automático.

---

## 5. Fechamento de fase (registro externo de entrega)

Ao final de cada fase mergeada, gerar um registro de fechamento **fora** de
`specs/<feature>/` — numa pasta irmã `docs/<DDMMAAAA>-<fase-slug>/`, nunca dentro da
pasta viva da feature (`spec.md`, `plan.md`, `tasks.md` nunca são movidos ou
sobrescritos por esse registro).

- **`verification.md`** (obrigatório): checklist de entrega, PR, commits, critérios de
  aceitação extraídos do PRD/spec da fase, e passo a passo de como reproduzir/validar
  localmente.
- **`contract.yaml`** (condicional): só gerado se a fase envolver comunicação FE↔BE via
  API (ex: fase de formulário de contato). Fases puramente front-end/estáticas não geram
  este arquivo.

Nunca gerar `spec.md`, `task.md` ou `test.md` como arquivos separados dentro do registro
de fechamento — esse conteúdo recortado hoje vive dentro de `verification.md`.

Procedimento completo (passo a passo de coleta de informação, templates e checklist):
skill `fechar-fase-speckit`.

---

## 6. Fonte corrente para valores técnicos concretos

Se um valor técnico concreto (comando, config, versão, nome de job de CI, valor de
`revalidate`) aparecer diferente entre o PRD e o `tech-specification.md` de um projeto,
**o tech-spec vale** — é ele quem se atualiza com mais frequência conforme decisões
técnicas são fechadas. O PRD fixa a decisão de produto; o tech-spec fixa o
comando/valor concreto que a implementa.

Mesmo princípio se aplica a qualquer outro par de documentos que descreva a mesma regra
em dois lugares (ex: `design-tokens.md` de um projeto vs. um valor citado solto em outro
arquivo) — declare explicitamente qual é a fonte corrente, nunca deixe implícito.

---

## 7. Ajuste pós-lançamento (pedido de cliente fora do roadmap)

Pedidos de cliente fora do roadmap planejado continuam exigindo o mesmo rigor de
processo — "é só um ajustinho" não é motivo para pular o gate de qualidade.

1. **Classificar antes de tocar em código:** cor/espaçamento/timing → design tokens do
   projeto; comportamento/estrutura de uma seção sem mudar o requisito de produto por
   trás dela → documento de layout/estrutura do projeto; requisito de produto novo →
   PRD do projeto, que sobe de versão, não é editado silenciosamente.
2. **Escolher o tipo de commit:** `fix` para correção de bug ou ajuste de
   comportamento/visual já existente (inclui pedido de cliente que muda algo já no ar);
   `feat` só para capacidade nova que não existia antes. Depois que a capacidade existe,
   ajustá-la volta a ser `fix`.
3. **Fluxo de git em escala menor:** branch pequena a partir da integração
   (`fix/<descrição>` ou `chore/<descrição>`), commit por etapa lógica, PR com CI
   passando sem atalho — e promoção para produção continua exigindo confirmação
   explícita (§4), independente do tamanho do pedido.

Procedimento completo: skill `ajuste-pos-lancamento`.

---

## 8. Auditoria de consistência entre documentos

Depois que uma decisão muda em um documento de especificação (PRD, tech-spec,
design-tokens, discovery, MVP, seed de conteúdo, constitution), os demais documentos que
a citam ficam desatualizados **em silêncio** — nenhum build quebra, nenhum lint acusa, o
projeto só passa a ter duas versões da verdade convivendo.

**Hierarquia de autoridade** (quem manda, quando dois documentos de um mesmo projeto
divergem sobre o mesmo fato):

| Tipo de decisão | Quem manda |
| --- | --- |
| Valor técnico concreto (comando, versão, job id, `revalidate`, env var) | `tech-specification.md` do projeto (§6 acima) |
| Decisão de produto/escopo/responsabilidade | `prd.md` do projeto |
| Token de design (cor, tipografia, espaçamento) | `design-tokens.md` do projeto — o `.json` é espelho, nunca a fonte |
| Estrutura/comportamento de seção de UI já aprovada | O documento de layout do projeto, **autodeclarado congelado** uma vez que o PRD existe — mudança de escopo entra pelo PRD primeiro |
| Narrativa de pitch/histórico (Discovery, MVP) | Nenhum — uma vez que o PRD existe, ficam congelados como registro histórico (tipicamente movidos para uma pasta de arquivo); só recebem nota de changelog, nunca reescrita de escopo |

**Quando auditar:** sob pedido explícito ("audite os documentos", "os documentos estão
alinhados?") **e** automaticamente, sem esperar ser pedido, logo depois de editar
qualquer documento de decisão do projeto.

**Procedimento resumido** (mapear estrutura real → identificar o que mudou → varrer os
demais documentos por termo/valor, não só pelo nome do arquivo → classificar cada achado
como corrigir / só changelog / sinalizar como intencional → aplicar respeitando o tipo de
documento → reportar o que mudou e o que foi deixado de propósito): skill
`auditor-consistencia-documentos`.

---

## Como usar este arquivo

No PRD ou tech-spec de cada projeto, referencie a seção específica (ex: "ver
`engenharia-playbook.md` §3") em vez de copiar a regra inteira para dentro do documento
do projeto. Se você descobrir um novo gotcha de processo no meio de um projeto futuro,
adicione uma seção nova aqui — todo projeto que referencia este arquivo herda o
aprendizado.
