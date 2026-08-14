# Playbook de Engenharia — Convenções de Processo (Git / CI / Automação)

**Versão:** 1.0
**Data:** 10 de agosto de 2026
**Revisado em:** 10 de agosto de 2026 — versão inicial, extraída do PRD do Catálogo de Óleos
Essenciais (§8, v1.11).

> **Este arquivo não pertence a nenhum projeto específico.** Vive uma vez só, no seu espaço
> de templates/skills, e é referenciado (não copiado) pelo PRD de cada projeto. Se você
> aperfeiçoar uma regra aqui, todo projeto que referencia este arquivo se beneficia — ao
> contrário de copiar o texto pra dentro de cada PRD, onde a melhoria fica presa num
> projeto só.
>
> **Origem:** extraído do PRD do Catálogo de Óleos Essenciais (§8, v1.11) no momento em que
> ficou claro que essas regras eram genéricas — não específicas daquele produto — e
> mereciam viver fora dele.

> **Referenciado por (rastreabilidade reversa — atualize esta lista ao adotar o playbook em
> um novo projeto ou ao mudar uma regra que quebre compatibilidade com um projeto já
> referenciado):**
>
> | Projeto | Versão do playbook referenciada | Observação |
> | --- | --- | --- |
> | Catálogo de Óleos Essenciais | v1.0 (esta) | PRD v1.12 substitui seu antigo §8.1–§8.2 por referência a este arquivo, mantendo em `prd-catalogo-oleos-essenciais.md` §8.1.1 apenas as decisões específicas do projeto (nomes de branch, nomes dos status checks, etc.) |
>
> Se este playbook mudar de forma incompatível com um projeto listado aqui, sinalize no
> `CHANGELOG` da mudança quais projetos precisam revisar sua tabela de exceções.

---

## 1. Fluxo de Branches e Commits

| Elemento | Convenção |
| --- | --- |
| **Branch por fase** | `feature/<fase-slug>` (ex: `feature/us1-produtos`) ou `chore/<fase-slug>` para fases de infraestrutura pura (ex: `chore/setup`) |
| **Commit por task** | Um commit por task do `tasks.md`, mensagem no padrão `<tipo>(<task-id>): <resumo>` (Conventional Commits) — feito localmente, sem push a cada commit |
| **Tipo de commit para correções** | `fix(<task-id ou referência>): <resumo>` para qualquer correção de bug, dentro ou fora da fase |
| **Push da branch de fase** | Ao concluir todas as tasks da fase, `git push origin <branch-de-fase>` — só a branch de fase, nunca a branch de integração diretamente. Automático (ver §4) |
| **Abertura da PR** | `feature/<fase-slug>` → branch de integração (`dev` ou equivalente), aberta automaticamente após o push |
| **CI na PR** | Roda contra o merge hipotético da PR (evento `pull_request`). Ver §2 para como isso vira trava técnica de verdade, não só convenção |
| **Merge da PR** | Merge commit (nunca squash, preserva granularidade task-a-task) — só é *possível* se os status checks obrigatórios passaram. Automático quando o CI está verde |
| **Sincronização da branch de integração local** | Após o merge remoto confirmado, `git checkout <integração> && git pull` — o local reflete o remoto, nunca o contrário |
| **Pull Request de promoção** | Branch de integração → branch principal, aberta quando o estado é publicável. **Não é automática** — exige confirmação explícita do usuário (ver §4) |

**Diagrama genérico de branches:**

```
main (produção — protegida, só recebe PR vinda da branch de integração, aprovada explicitamente pelo usuário)
 └─ dev (staging/integração — protegida, só recebe merge de PR com CI verde)
     ├─ chore/setup           → PR: Setup, CI e branch protection (ver §2)
     ├─ feature/<fase-1>      → PR: primeira fase de produto
     ├─ feature/<fase-2>      → PR: segunda fase de produto
     └─ (promoção final)      → PR de dev para main, com confirmação explícita do usuário
```

---

## 2. Execução Automática de Commits (regra não-negociável)

> **Origem desta regra:** no primeiro projeto que usou este playbook como referência, o
> agente executou dezenas de tasks planejadas de uma só vez, em uma única working tree, sem
> nenhum commit — porque seguiu uma regra própria de "nunca commitar sem pedido explícito do
> usuário", que não havia sido explicitada como exceção no contexto do projeto. Resultado:
> histórico de git precisou ser reconstruído manualmente, por fase, depois do fato.

1. Ao concluir cada task, o agente **deve commitar imediatamente**, seguindo o padrão
   `<tipo>(<task-id>): <resumo>`, sem pausar para aguardar confirmação adicional apenas
   para esse passo.
2. Qualquer regra geral de segurança do tipo "não commitar sem pedido explícito" **não se
   sobrepõe** a esta convenção — ela é o próprio pedido explícito, dado uma única vez, no
   momento em que este playbook é aceito como contexto do projeto.
3. Se o agente não conseguir commitar automaticamente por qualquer motivo, ele deve
   **avisar explicitamente antes de continuar**, em vez de seguir implementando tasks
   subsequentes em silêncio sobre uma working tree sem commit.
4. Esta regra **deve ser referenciada (ou copiada)** no `constitution.md` gerado por
   `/speckit.constitution` em todo novo projeto — não é suficiente que ela exista só aqui.

---

## 3. Bootstrap de CI e Branch Protection (NON-NEGOTIABLE)

> **Por que esta seção existe:** o fluxo do §1 assume que a PR é o mecanismo real de merge
> — mas isso só é verdade se (a) existe um workflow de CI configurado para rodar nos
> eventos de `pull_request`, e (b) a branch de integração tem *required status checks*
> configurados, de forma que o botão de merge fique tecnicamente indisponível se o CI não
> passou. Sem isso, "a PR não é mergeada se falhar" é só uma instrução de comportamento que
> o agente segue por convenção — não uma trava real.

A primeira fase (Setup) inclui, como tasks obrigatórias:

1. **Criar a branch de integração a partir da principal**, como primeira ação da fase,
   antes de qualquer outra configuração.
2. **Criar o workflow de CI**, rodando no evento `pull_request`, executando os checks
   relevantes ao projeto (build, testes, verificações de qualidade específicas — definir
   no PRD do projeto quais).
3. **Configurar branch protection** na branch de integração e na principal, exigindo que
   os status checks passem antes de permitir merge, e desabilitando push direto.
4. **Exceção de bootstrap:** como a proteção ainda não existe nos passos 1-3, o primeiro
   commit/push desta fase é feito **diretamente na branch de integração** (sem PR), pois é
   o próprio código que instala a proteção. A partir daí, toda fase subsequente segue o
   fluxo normal de PR.
5. Se o agente não conseguir configurar branch protection (permissão insuficiente), ele
   **deve avisar explicitamente** e perguntar como proceder, em vez de seguir o projeto
   assumindo uma trava que não existe de fato.

---

## 4. Publicação no Remoto — O Que é Automático e O Que Pausa

| Ação | Automática? | Justificativa |
| --- | --- | --- |
| Commit de task | ✅ Sim | Sempre, ver §2 |
| Push de branch de fase + abertura de PR para a branch de integração | ✅ Sim | Branch isolada, pré-requisito do CI gate |
| Merge da PR na branch de integração (CI verde) | ✅ Sim, condicionado | Só ocorre se os checks passaram (branch protection) |
| Configuração de branch protection (só na fase de Setup) | ✅ Sim, com aviso | Necessária pro CI gate funcionar; se faltar permissão, avisa e pergunta |
| Abertura de PR da branch de integração → principal | ❌ Não | Inicia promoção para produção — deve ser deliberado |
| Merge para a branch principal / deploy de produção | ❌ Não | Alto impacto — exige confirmação explícita antes |
| Criação de recursos em nuvem (banco, e-mail, hospedagem, etc.) | ❌ Não | Pode gerar custo ou expor dados |
| Vinculação inicial de projeto a um provedor de deploy (primeira vez) | ❌ Não | Ação permanente |

**Regra geral:** autenticação bem-sucedida prova identidade, não intenção. Publicar na
branch de integração é passo de CI (baixo risco, reversível, protegido pelo gate). Publicar
em produção é ato de entrega (alto impacto) que deve ser deliberado.

---

## 5. Registro Externo de Fechamento de Fase

Convenção de onde e como registrar a entrega de cada fase, depois que sua PR é mergeada —
inspirada no mecanismo de arquivamento do OpenSpec (`changes/archive/<data>-<change-id>/`).

**Regra:** o registro vive **fora** de `specs/`, em pasta própria na raiz do projeto:

```
docs/
 └─ <DDMMAAAA>-<fase-slug>/
     ├─ verification.md   # checklist de entrega, PR, commits, como reproduzir (único arquivo obrigatório)
     └─ [contract.yaml]   # apenas se a fase envolver contrato de API
```

- **`DDMMAAAA`** = data do **merge remoto** da PR (não da criação da branch, nem de um
  merge local).
- Execução via skill `fechar-fase-speckit`.

### 5.1 Execução Automática do Registro (regra não-negociável)

1. Ao confirmar o **merge remoto** da PR de fase (`gh pr view --json state` retornando
   `MERGED`), o agente **deve invocar a skill de fechamento de fase imediatamente**,
   antes de iniciar qualquer task da próxima fase.
2. O gatilho é o **merge remoto confirmado**, nunca um merge local — um merge local prévio
   ao push tornaria o CI decorativo, e o registro não deve documentar um estado que ainda
   pode ser rejeitado pelo CI.
3. Se o agente não conseguir gerar o registro, deve **avisar explicitamente** antes de
   continuar para a próxima fase.

---

## 6. Regra de Desempate entre Documentos

Se um valor técnico concreto (comando, config, versão) aparecer diferente entre o PRD de um
projeto e seu tech-spec, **o tech-spec é a fonte corrente** — é ele quem se atualiza com
mais frequência conforme decisões técnicas são fechadas. O PRD fixa as decisões; o tech-spec
fixa os comandos e valores concretos que as implementam. Aplique o mesmo princípio a
qualquer outro par de documentos que descreva a mesma regra em dois lugares: declare
explicitamente qual é a fonte corrente, em vez de deixar implícito.

---

## 7. Ajustes Pós-Lançamento (pedido de cliente após o projeto no ar)

> **Por que esta seção existe:** o fluxo das seções 1-5 descreve o caminho de uma fase
> planejada no `tasks.md`. Depois que o projeto está em produção, pedidos do cliente
> chegam fora desse roadmap — mas o rigor de processo (classificar antes de mexer, CI
> obrigatório, confirmação antes de produção) continua valendo. Sem isso, "é só um
> ajustinho" vira a desculpa mais comum pra pular o gate de qualidade.

### 7.1 Classifique antes de tocar em código

| O cliente pediu... | Onde a mudança entra |
| --- | --- |
| Cor, espaçamento, timing de transição | Design tokens do projeto |
| Comportamento/estrutura de uma seção (ex: virar carrossel, mudar ordem) — sem alterar o requisito de produto por trás dela | Documento de layout/estrutura do projeto |
| Requisito de produto (o que a seção precisa comunicar/fazer) | PRD do projeto — sobe de versão, não edita silenciosamente |

Registre a mudança no documento certo (com data e motivo, como qualquer outra decisão)
**antes ou junto** da implementação — não depois, por memória.

### 7.2 Tipo de commit

| Tipo | Quando usar |
| --- | --- |
| `fix` | Correção de bug **ou** ajuste de comportamento/visual já existente — inclui pedidos de cliente que mudam algo que já está no ar, mesmo sem ser erro |
| `feat` | Capacidade nova que não existia antes (ex: um crossfade que não existia, na primeira vez que é implementado) |

Depois que uma capacidade existe, ajustá-la (mudar timing, trocar de 2 pra 3 imagens no
crossfade, etc.) volta a ser `fix` — `feat` é só o commit que introduz a capacidade pela
primeira vez.

### 7.3 Fluxo de git — mesmo padrão, escala menor

1. Branch pequena a partir da branch de integração (`fix/<descrição-curta>` ou
   `chore/<descrição-curta>`), mesmo pra ajuste de uma linha de CSS.
2. Commit por etapa lógica, PR pra branch de integração — **CI passa, sem atalho** só
   porque o pedido é pequeno.
3. Promoção pra produção continua exigindo confirmação explícita (§4) — tamanho do pedido
   não muda o nível de risco de publicar em produção.

---

## Como usar este arquivo

No PRD de cada projeto, a seção de "Convenções de Processo" deve conter só uma referência a
este playbook, mais uma tabela de exceções (se o projeto precisar divergir de alguma regra
padrão). Não copie o conteúdo inteiro para dentro do PRD — isso reintroduziria a mesma
duplicação que motivou a extração deste arquivo. Se este playbook mudar, os projetos que o
referenciam recebem a atualização automaticamente, sem precisar de edição manual em cada um.
