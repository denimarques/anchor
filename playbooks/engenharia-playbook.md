# Playbook de Engenharia — Processo (Git, CI, Documentação)

<!-- doc-version: 1.2 -->

**Versão:** 1.0
**Data:** 18 de agosto de 2026
**Revisado em:** 18 de agosto de 2026 — reconstruído a partir das rules e skills que já
citavam este arquivo por número de seção (`commit-automatico.md`, `nunca-merge-local.md`,
`priorizar-tech-spec.md`, e as skills `bootstrap-ci-branch-protection`,
`ajuste-pos-lancamento`), cujo conteúdo canônico ainda não tinha sido consolidado aqui —
o arquivo publicado até então tinha, por engano, o mesmo conteúdo de
`stack-nextjs-playbook.md`.

**Versão:** 1.1 — data: 26 de agosto de 2026 — resultado de uma auditoria de segurança
externa e de um garimpo em um projeto irmão (ProSuas/linkT). Adiciona três seções
inteiramente novas: §10 (Checklist de Segurança — baseline + 6 condicionais por
capacidade do projeto), §11 (Disciplina de Testes — teste automatizado como parte da
definição de "implementado", não opcional) e §12 (Arquitetura — Sem Acoplamento Entre
Domínios). Nenhuma seção anterior (§1–§9) foi alterada. Todas as três novas seções são
agnósticas de stack por design — a tradução técnica concreta de cada uma vive no
playbook de stack correspondente (ex: `stack-nextjs-playbook.md`, padrões #7–#10).

**Versão:** 1.2 — mesma data — duas correções: (1) três itens do checklist §10 (A4, E1,
E2) citavam `middleware.ts` diretamente — nome de arquivo específico do Next.js dentro
do playbook que deveria valer pra qualquer stack; reescritos para linguagem agnóstica
("mecanismo de rate-limit centralizado"); (2) achado que o Next.js 16 renomeou
`middleware.ts` para `proxy.ts` (função exportada também renomeada de `middleware` para
`proxy`) — o exemplo concreto no `stack-nextjs-playbook.md` (padrão #8) foi atualizado
para bater com a convenção real da versão instalada.

> **Este arquivo não pertence a nenhum projeto específico e não é sobre uma stack
> técnica.** Diferente do `stack-nextjs-playbook.md` (que é sobre *padrões de código*
> repetíveis a uma combinação específica de tecnologias), este é sobre **processo** — git,
> CI, branch protection, disciplina de commit, segurança, testes, e como manter os
> documentos de especificação consistentes entre si. Vale pra qualquer projeto do
> playbook, independente da stack escolhida.

> **Referenciado por (rastreabilidade reversa):**
>
> Formato de tabela **parseável por `scripts/verify-traceability.js`** (ver §9) — cada
> linha é um par (documento do cliente, versão registrada no momento em que ele passou a
> referenciar esta seção). Duas regras fixas: (1) a versão do documento do cliente nunca
> vai misturada em texto livre — sempre na sua própria coluna; (2) a coluna de
> Âncora(s)/Observação **nunca cita número de seção** ("§6", "§2.4") — só o nome da
> âncora entre crases. Documentos de projeto (PRD, tech-spec) nascem de template e a
> numeração varia entre projetos; um número aqui criaria um mapeamento que parece
> estável e não é.
>
> | Projeto | Documento do cliente | `doc-version` registrado | Versão deste playbook | Âncora(s) referenciada(s) |
> | --- | --- | --- | --- | --- |
> | Lente Peixe | `docs/prd.md` | `1.8` | `v1.2` | `fonte-corrente-valores-tecnicos` |
> | Lente Peixe | `docs/tech/tech-specification.md` | `1.20` | `v1.2` | `fluxo-pr-nunca-merge-local`, `commit-automatico-task-a-task`, `bootstrap-ci-branch-protection`, `automatico-vs-confirmacao-explicita` (git/CI) e `auditoria-consistencia-documentos` |
>
> Se este playbook mudar de forma incompatível com um projeto listado aqui, sinalize a
> revisão necessária. `scripts/verify-traceability.js` só aponta **que** o `doc-version`
> real diverge do registrado aqui — não presume qual lado está certo (pode ser tabela
> desatualizada, mas também pode ser um valor que nunca bateu, como aconteceu antes com
> "PRD v1.12" no `stack-nextjs-playbook.md`). Revisão manual decide o que fazer.

---

## 1. Fluxo de PR e branch de integração — nunca merge local <!-- anchor: fluxo-pr-nunca-merge-local -->

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

## 2. Commit automático, task a task <!-- anchor: commit-automatico-task-a-task -->

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

## 3. Bootstrap de CI e Branch Protection (fase de Setup) <!-- anchor: bootstrap-ci-branch-protection -->

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

## 4. O que é automático vs. o que exige confirmação explícita <!-- anchor: automatico-vs-confirmacao-explicita -->

| Automático (sem pausar) | Exige confirmação explícita do usuário |
| --- | --- |
| Commit ao final de cada task (§2) | Promoção da branch de integração para a branch principal/produção (deploy real) |
| Push da branch de fase + abertura de PR (§1) | Qualquer comando que afete a branch de produção/deploy diretamente |
| Merge da PR, condicionado ao CI verde (§1) | Ajuste pós-lançamento que envolva PR contra produção (§7) |
| Correção e novo push numa PR com CI vermelho | Configurar branch protection sem permissão de admin confirmada (§3) |

Este é o único ponto de decisão humana em todo o fluxo — tudo antes disso é automático.

---

## 5. Fechamento de fase (registro externo de entrega) <!-- anchor: fechamento-de-fase -->

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
de fechamento — esse conteúdo recortado hoje vive dentro de `verification.md`. Ver §11.3
para uma exceção específica e deliberada envolvendo `test.md` como planejamento
*prévio* de teste, distinta deste recorte pós-fato.

Procedimento completo (passo a passo de coleta de informação, templates e checklist):
skill `fechar-fase-speckit`.

---

## 6. Fonte corrente para valores técnicos concretos <!-- anchor: fonte-corrente-valores-tecnicos -->

Se um valor técnico concreto (comando, config, versão, nome de job de CI, valor de
`revalidate`) aparecer diferente entre o PRD e o `tech-specification.md` de um projeto,
**o tech-spec vale** — é ele quem se atualiza com mais frequência conforme decisões
técnicas são fechadas. O PRD fixa a decisão de produto; o tech-spec fixa o
comando/valor concreto que a implementa.

Mesmo princípio se aplica a qualquer outro par de documentos que descreva a mesma regra
em dois lugares (ex: `design-tokens.md` de um projeto vs. um valor citado solto em outro
arquivo) — declare explicitamente qual é a fonte corrente, nunca deixe implícito.

---

## 7. Ajuste pós-lançamento (pedido de cliente fora do roadmap) <!-- anchor: ajuste-pos-lancamento -->

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

## 8. Auditoria de consistência entre documentos <!-- anchor: auditoria-consistencia-documentos -->

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

## 9. Verificação automática de rastreabilidade e âncoras (`scripts/verify-traceability.js`) <!-- anchor: verificacao-automatica-rastreabilidade -->

As tabelas "Referenciado por" (§1–§8 acima, e o equivalente no `README.md` do pacote)
citam **duas coisas que envelhecem de formas diferentes**: a versão de um documento do
cliente, e a seção específica dentro de um playbook/documento que está sendo
referenciada. As duas divergem em silêncio se só forem escritas como número — foi assim
que uma tabela citou "PRD v1.12" quando o `prd.md` real estava em `1.1`, e é o mesmo
risco se um dia este playbook ganhar uma seção nova no meio e "§6" passar a apontar pra
outra coisa (numa reorganização, o item que hoje é §6 pode virar §7 — quem cita "§6" de
fora não é avisado).

**Mecanismo — duas partes:**

**Parte 1 — versão do documento (`doc-version`):**

1. Todo documento que pode aparecer numa tabela de rastreabilidade carrega, logo abaixo
   do título, um marcador único e grep-ável:

   ```
   <!-- doc-version: 1.1 -->
   ```

   Comentário HTML — invisível na leitura normal, sem ambiguidade pra uma ferramenta ler.
   Não confundir com o "Versão:"/"Revisão N" narrativo que o documento já possa ter —
   este marcador é *só* pra máquina, o outro é pra humano; os dois convivem.

2. As tabelas de rastreabilidade guardam a versão referenciada na **sua própria coluna**
   (`doc-version` registrado), nunca embutida em texto livre de Observação.

**Parte 2 — âncora da seção (independente do número):**

3. Toda seção que pode ser citada de fora carrega um nome fixo, junto ao título:

   ```
   ## 6. Fonte corrente para valores técnicos concretos <!-- anchor: fonte-corrente-valores-tecnicos -->
   ```

   O número (`6`) é só a ordem de leitura *daquele documento específico* — **quem manda
   de verdade, em qualquer referência de fora, é o nome da âncora**. Se a seção virar
   `§7` numa reorganização futura (ou se outro projeto gerado do mesmo template tiver
   uma seção extra antes dela e por isso numerar diferente), a âncora continua igual e
   a referência de fora não quebra.

4. Toda citação a uma seção específica de outro documento — nas tabelas de
   rastreabilidade, ou em qualquer referência cruzada tipo "ver X §Y" — cita **só** o
   nome da âncora entre crases: `` `fonte-corrente-valores-tecnicos` ``. **Nunca inclua
   o número da seção na referência, nem como apoio de leitura.** Documentos como o PRD
   nascem de um template (`/speckit.specify` etc.) e a numeração de seção varia de
   projeto pra projeto — e pode até mudar dentro do mesmo projeto se uma seção nova
   entrar no meio. Um número escrito na referência cria a falsa impressão de que existe
   um mapeamento estável entre projetos, que não existe. O número continua aparecendo
   no título da própria seção (é só a ordem de leitura natural daquele documento
   específico); ele nunca aparece em quem cita essa seção de fora.

**A verificação:**

5. `node node_modules/@denimarques/anchor/scripts/verify-traceability.js` (rodado a
   partir da raiz do repositório do projeto cliente) confere **as duas partes**: o
   `doc-version` de cada documento citado contra o valor registrado, **e** se cada âncora
   citada ainda existe — seja no próprio playbook, seja no documento do cliente
   referenciado na mesma linha. Também varre todo `.md` do projeto atrás de citação
   solta por número de seção (fora do formato de tabela) e sinaliza como violação de
   convenção. Divergência ou âncora ausente → imprime o problema e sai com código de
   erro diferente de zero.

6. Rodar este script faz parte do procedimento da skill `auditor-consistencia-documentos`
   (§8) — não é uma ferramenta à parte, é o passo que substitui "conferir a versão e a
   seção à mão" por "deixar o script conferir".

Ver `scripts/verify-traceability.js` (fonte, comentado) e a seção "Como usar" do
`README.md` do pacote para o comando exato e como interpretar a saída.

---

## 10. Checklist de Segurança <!-- anchor: checklist-de-seguranca -->

Baseado em auditoria real do Lente Peixe (achou e corrigiu: XSS via JSON-LD sem escape,
ausência total de headers de segurança, rate-limit duplicável entre rotas, dependências
sem escaneamento automático). Estruturado em **baseline** (todo projeto, qualquer
arquétipo do `anchor` — `landing`, `dashboard`, `saas`, `crm`, `ecommerce`, `storefront`,
`news`) e **condicionais** (disparam conforme o projeto ganha a capacidade
correspondente — não implementar antecipadamente, mesmo princípio de
`stack-playbook-template.md`: só registrar o que resolve fricção real).

**Nota de cobertura:** as subseções 10.6 e 10.7 não se aplicam a nenhum projeto do
`anchor` até hoje (nenhum projeto ativo busca URL fornecida por usuário no servidor, nem
desserializa payload externo em estrutura polimórfica) — documentadas aqui mesmo assim,
porque a lista de 39 itens revisada na auditoria de segurança cobria essas duas
categorias, e um arquétipo `saas`/`crm`/`dashboard` futuro tem chance real de precisar
delas (webhook, integração configurável, preview de link). Ficam inertes até disparar.

### 10.1 Baseline — todo projeto, desde o dia 1

| # | Item | Verificação |
| --- | --- | --- |
| B1 | Headers de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`) | Configurados via `headers()` do `next.config.ts` (padrão técnico #7, `stack-nextjs-playbook.md`) |
| B2 | CSP em modo `Report-Only` antes de enforcing | Nunca subir `Content-Security-Policy` direto sem antes rodar `-Report-Only` em produção e confirmar que nada legítimo quebra |
| B3 | Segredos nunca commitados | `.env`/`.env.local` no `.gitignore` desde o primeiro commit — checar com `git log --all --full-history -- .env` antes de assumir que está limpo |
| B4 | Dependências com vulnerabilidade conhecida | `npm audit --audit-level=high` no CI (job `build`) + Dependabot do GitHub ativo (`.github/dependabot.yml`) |
| B5 | Stack trace nunca exposto ao cliente em produção | Padrão do Next.js em produção — confirmar que nenhum `catch` devolve `error.stack`/`error.message` bruto numa resposta de API |
| B6 | SQL/ORM sem concatenação manual | Prisma (ou equivalente) com queries parametrizadas — nunca template string montando SQL |
| B7 | IDs não-sequenciais em recurso público (URL, resposta de API) | `cuid()`/`uuid()` no schema, não `autoincrement()`, para qualquer entidade referenciável de fora |
| B8 | Log de ação crítica (não confundir com log de erro genérico) | Toda escrita relevante (formulário enviado, registro criado/alterado, rate-limit/origem rejeitados) gera uma linha de log estruturado identificável — sem isso, um incidente vira "não temos como saber o que aconteceu" |

### 10.2 Condicional — projeto com autenticação de usuário
<!-- Dispara para: dashboard, saas, crm, ou qualquer landing/storefront que ganhe painel
     admin (ex: Lente Peixe, painel admin previsto). NÃO implementar antes de a decisão
     de mecanismo de auth (NextAuth/Clerk/Lucia/custom) estar fechada. -->

| # | Item | Verificação |
| --- | --- | --- |
| A1 | Senha nunca em texto puro | Hash com `bcrypt`/`argon2` (nunca MD5/SHA sem salt) — ou delegar para provedor (OAuth/passkeys/WebAuthn), preferível quando viável |
| A2 | Sessão via cookie `httpOnly` + `Secure` + `SameSite=Lax` (mínimo) | Nunca token de sessão em `localStorage` (acessível via XSS) |
| A3 | Autorização checada no servidor, sempre | Toda rota/Server Action sensível confere permissão no backend — checagem só no client (esconder botão) não é controle de acesso |
| A4 | Rate-limit em tentativa de login | Sem isso, força bruta de senha é trivial — reaproveitar o mesmo mecanismo de rate-limit centralizado já usado nos endpoints públicos (padrão técnico #8 do playbook de stack) |
| A5 | CSRF real (diferente da validação de Origin do B-baseline) | Se usar cookie de sessão, token anti-CSRF ou `SameSite=Strict` — o cenário de "sessão ativa + aba maliciosa" só existe a partir daqui, não antes |

### 10.3 Condicional — projeto com endpoint público de escrita
<!-- Dispara para: qualquer formulário público (contato, newsletter, comentário, lead) —
     já se aplica ao Lente Peixe hoje, mesmo sem autenticação nenhuma. -->

| # | Item | Verificação |
| --- | --- | --- |
| E1 | Rate-limit por IP+rota | Camada de intercepção de requisição centralizada, padrão técnico #8 do playbook de stack |
| E2 | Validação de `Origin`/`Referer` | Mesma camada centralizada — anti-bot, não anti-CSRF (ver nota em A5) |
| E3 | Validação de schema antes de persistir | `zod` (já em uso) — nunca confiar em payload sem validar forma e tipo |
| E4 | CAPTCHA se abuso for observado na prática | reCAPTCHA v3 (invisível) é a opção padrão quando necessário — não implementar preventivamente sem sinal real de abuso |

### 10.4 Condicional — projeto com upload de arquivo
<!-- Dispara para: crm (anexos), ecommerce/storefront (produto por usuário), qualquer
     admin panel com upload de imagem/documento. -->

| # | Item | Verificação |
| --- | --- | --- |
| U1 | Validar por conteúdo (magic bytes), nunca só extensão | `.png` renomeado de um `.php`/`.jsp` passa em qualquer checagem de extensão |
| U2 | Limite de tamanho explícito | Sem isso, upload vira vetor de negação de serviço |
| U3 | Armazenamento fora do diretório servido publicamente, ou com controle de acesso | Nunca `public/uploads/` sem camada de autorização na frente |

### 10.5 Condicional — projeto multi-tenant (saas, crm)

| # | Item | Verificação |
| --- | --- | --- |
| M1 | Isolamento de dados por tenant checado em toda query | No nível de banco/ORM, não só filtro de UI — um `where` esquecido vaza dado entre clientes |
| M2 | `tenant_id` nunca aceito só do payload do cliente | Sempre derivado da sessão/token autenticado no servidor, nunca de um campo que o cliente envia |

### 10.6 Condicional — projeto que busca URL fornecida pelo usuário no servidor (SSRF)
<!-- Dispara para: preview de link (og:image, embed), webhook configurável, integração
     externa apontada pelo usuário ("conecte sua API"), "importar imagem/arquivo de uma
     URL" — típico de saas/crm/dashboard com integrações, nunca visto ainda em nenhum
     projeto do anchor, mas plausível no primeiro saas/crm real. Nenhum projeto ativo
     dispara esta seção hoje. -->

| # | Item | Verificação |
| --- | --- | --- |
| S1 | Allowlist de domínio, nunca blocklist | Definir explicitamente quais domínios o servidor pode buscar — blocklist é sempre incompleta |
| S2 | Bloquear IP privado/loopback/metadata cloud | `127.0.0.1`, `169.254.169.254` (metadata da AWS/GCP/Azure), `10.0.0.0/8`, `192.168.0.0/16` — um SSRF que alcança o endpoint de metadata da nuvem costuma virar vazamento de credencial de infraestrutura, não só leitura de página interna |
| S3 | Nunca seguir redirect automaticamente sem revalidar | Uma URL da allowlist pode redirecionar pra fora dela — revalidar o destino final, não só a URL de entrada |
| S4 | Timeout curto e limite de tamanho de resposta | Evita a rota virar vetor de negação de serviço contra o próprio servidor |

### 10.7 Condicional — projeto que desserializa payload externo em estrutura interna
<!-- Dispara para: qualquer merge/extend de JSON externo (não validado por schema
     explícito) em objeto de configuração interno; parsing de payload de webhook de
     terceiro em objeto polimórfico; qualquer uso de eval/vm/new Function() sobre string
     vinda de fora. Nenhum projeto ativo dispara esta seção hoje -- Next.js/JSON.parse
     não tem o mesmo vetor histórico do ObjectInputStream de Java, mas prototype
     pollution via merge de objeto não validado é o equivalente real em Node.js. -->

| # | Item | Verificação |
| --- | --- | --- |
| D1 | Nunca `JSON.parse` + merge direto em objeto interno sem allowlist de chaves | `Object.assign(config, JSON.parse(payloadExterno))` é o padrão clássico de prototype pollution (`__proto__`, `constructor.prototype`) — validar shape explícito (zod) antes de qualquer merge |
| D2 | Nunca `eval`/`new Function()`/`vm` sobre string vinda de fora | Sem exceção, mesmo em ferramenta interna "só pra admin" |
| D3 | Biblioteca de parsing com tipagem estrita conhecida | Preferir `zod.parse()` (rejeita, não filtra silenciosamente) a `JSON.parse` cru sempre que o payload vem de fora do processo |

**Como usar esta seção:** ao iniciar um projeto novo, aplicar 10.1 sempre. Reavaliar
10.2–10.7 a cada nova capacidade adicionada (ex: "este projeto agora busca URL externa" →
aplicar 10.6) — não implementar um bloco condicional antes da capacidade existir de
verdade, mesmo princípio dos gotchas de stack: registrar o que resolve fricção real, não
antecipação especulativa.

---

## 11. Disciplina de Testes <!-- anchor: disciplina-de-testes -->

Adaptado de um projeto irmão (ProSuas/linkT, Angular), que já trata isso como regra
não-negociável, não como boa prática opcional.

### 11.1 Teste automatizado é parte da definição de "implementado"

**Regra:** todo componente/função nova, ou alteração de comportamento existente, inclui
o teste automatizado correspondente **no mesmo PR** — nunca depois, nunca como débito
técnico registrado para "fazer quando sobrar tempo". Cobertura mínima esperada:

- Renderização correta (o componente/função produz a saída esperada para as entradas
  relevantes, incluindo casos de borda óbvios).
- Interação, quando houver (clique, submit, navegação, mudança de estado).
- Emissão de efeito colateral relevante (evento, chamada de API mockada, log).

**Por que existe:** achado numa auditoria real — o Lente Peixe tinha `test:unit`
configurado no `package.json`, testes escritos e passando localmente, mas **nenhum job
de CI obrigatório os executava**. Ou seja: nada impedia um merge que quebrasse esses
testes, porque a proteção de branch nunca chegava a rodá-los. Ferramenta presente sem
gate é o mesmo padrão de risco que já apareceu antes com rate-limit "existente mas não
aplicado" — a lição se repete: se não está no caminho obrigatório, não protege nada.

### 11.2 Onde o teste roda (evitar o erro do Lente Peixe)

O framework de CI de cada projeto trava um número fixo de job ids (`ci-job-ids.md`) —
**não adicionar um job novo só para rodar teste unitário**; encaixar dentro do job
`build` já existente, do mesmo jeito que `docs:check` (auditoria de documentação) e
`npm audit` (dependências, §10.1 B4) já entram lá. Ver padrão técnico correspondente no
playbook de stack (ex: `stack-nextjs-playbook.md`, padrão #9) para o comando exato.

### 11.3 Planejamento de teste antes de implementar (opcional, avaliar por projeto)

O projeto de referência mantém um artefato `test.md` na pasta de planejamento de cada
feature (`docs/<DDMMAAAA>-<verbo-feature>/`), escrito **antes** da implementação —
especifica que cenários serão cobertos e por que, funcionando como um contrato de teste
que a implementação depois precisa satisfazer.

Isso diverge do formato atual do `anchor` (`fechar-fase-speckit`), que descontinuou
`spec.md`/`task.md`/`test.md` como arquivos separados por duplicarem, em forma de
recorte, conteúdo que já vive em `specs/<feature>/spec.md`/`tasks.md`. Essa
descontinuação continua válida para `spec.md`/`task.md` — mas `test.md`, se usado como
planejamento **prévio** (não recorte pós-implementação), tem uma função diferente:
força pensar no critério de aceitação testável antes de escrever código, não só depois.

**Não decidido de forma geral** — avaliar por projeto se o ganho de disciplina TDD
compensa o artefato extra. Se adotado, `test.md` nasce e é aprovado **antes** da task
começar, nunca depois — senão vira só mais um recorte pós-fato, o problema original que
motivou a descontinuação.

---

## 12. Arquitetura — Sem Acoplamento Entre Domínios <!-- anchor: sem-acoplamento-entre-dominios -->

Adaptado do mesmo projeto de referência (regra "Facade/Service nunca injeta
Facade/Service de outro domínio").

**Regra (agnóstica de stack):** o módulo responsável por acessar/mutar dados de um
domínio nunca invoca o módulo equivalente de outro domínio. Se uma tela ou componente
precisa de dado de dois domínios, ela consome os dois módulos diretamente, cada um no
seu próprio escopo — a composição acontece na camada de apresentação (componente/tela),
nunca dentro de um módulo de domínio chamando outro.

Cada stack traduz isso pro seu próprio vocabulário — ver o padrão técnico
correspondente no playbook de stack (ex: `stack-nextjs-playbook.md`, padrão #10, para a
convenção concreta de pasta/arquivo do Next.js).

**Por que importa mais em `saas`/`crm` do que numa `landing`:** com poucos domínios (o
caso do Lente Peixe hoje — Produtos, Depoimentos, Necessidades, Perfil), o risco de
acoplamento acidental é baixo. Num `saas`/`crm` com dezenas de entidades relacionadas,
um módulo de domínio importando outro "só dessa vez, é rápido" é exatamente como nasce
uma dependência circular ou um domínio que ninguém consegue extrair/testar isolado
depois. Registrar a regra agora, mesmo com baixo risco atual, evita reaprender isso sob
pressão num projeto maior.

---

## Como usar este arquivo

No PRD ou tech-spec de cada projeto, referencie a seção específica (ex: "ver
`engenharia-playbook.md`, âncora `bootstrap-ci-branch-protection`") em vez de copiar a
regra inteira para dentro do documento do projeto. Se você descobrir um novo gotcha de
processo no meio de um projeto futuro, adicione uma seção nova aqui — todo projeto que
referencia este arquivo herda o aprendizado.
