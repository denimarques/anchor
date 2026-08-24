#!/usr/bin/env node
"use strict";

/**
 * verify-traceability.js
 *
 * Este script confere DUAS coisas que as tabelas "Referenciado por" dos playbooks
 * citam e que envelhecem de formas diferentes:
 *
 *   1) DOC-VERSION — a versão de um documento do cliente no momento em que a
 *      referência foi registrada. Diverge com o tempo (o documento evolui, a tabela
 *      não se atualiza sozinha). Foi assim que uma tabela citou "PRD v1.12" quando o
 *      `prd.md` real estava em `1.1`.
 *
 *   2) ÂNCORA — o nome fixo de uma seção específica sendo citada (ex: "fonte corrente
 *      para valores técnicos concretos"). Se a tabela citasse só o número ("§6"), uma
 *      reorganização que insira uma seção nova no meio do documento muda o que "§6"
 *      significa, e a referência aponta pro lugar errado sem que nada acuse — o mesmo
 *      tipo de silêncio do problema de versão, só que em posição em vez de número.
 *
 * Mecanismo:
 *
 *   - Todo documento citável carrega, logo abaixo do título, um marcador de versão:
 *       <!-- doc-version: 1.1 -->
 *
 *   - Toda seção citável carrega, junto ao título, um marcador de âncora:
 *       ## 6. Fonte corrente para valores técnicos concretos <!-- anchor: fonte-corrente-valores-tecnicos -->
 *
 *   - As tabelas de rastreabilidade guardam a versão citada na sua própria coluna
 *     (nunca embutida em prosa), e citam âncoras entre crases na coluna de Observação
 *     (ex: `` `fonte-corrente-valores-tecnicos` (§6 atualmente) ``) — o número entre
 *     parênteses é só apoio de leitura, quem manda é o nome.
 *
 * Uso (a partir da raiz do repositório do projeto cliente, com o pacote instalado):
 *
 *   node node_modules/@denimarques/anchor/scripts/verify-traceability.js
 *
 * Ou, rodando de dentro do próprio pacote, passando a raiz do projeto cliente:
 *
 *   node scripts/verify-traceability.js /caminho/para/o/projeto-cliente
 *
 * Saída: 0 e "Tudo consistente" se doc-version e todas as âncoras citadas baterem;
 * lista cada divergência/âncora ausente e sai com código 1 caso contrário. Não decide
 * sozinho qual lado está desatualizado — só aponta para revisão manual.
 */

const fs = require("fs");
const path = require("path");

const DOC_VERSION_RE = /<!--\s*doc-version:\s*([^\s>]+)\s*-->/;
const ANCHOR_DEF_RE = /<!--\s*anchor:\s*([a-z0-9-]+)\s*-->/g;
// Exige pelo menos um hífen para reduzir falso-positivo de crases que não são âncora
// (ex: `prd.md`, `1.1`, nomes de pacote sem hífen).
const ANCHOR_REF_RE = /`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`/g;

function findPlaybooksDir() {
  const candidate = path.resolve(__dirname, "..", "playbooks");
  if (fs.existsSync(candidate)) return candidate;
  throw new Error(
    `Não encontrei a pasta "playbooks" em ${candidate}. Este script espera rodar de ` +
      `dentro do pacote @denimarques/anchor (scripts/ ao lado de playbooks/).`
  );
}

function findPackageRoot() {
  return path.resolve(__dirname, "..");
}

/**
 * O `README.md` na raiz do pacote mantém sua própria tabela "Referenciado por"
 * (documentada como espelho de leitura humana das tabelas de cada playbook). Antes
 * desta correção, `findPlaybooksDir()` só olhava para `playbooks/`, então o README nunca
 * era varrido — uma tabela desatualizada ali (`doc-version` errado) não gerava nenhum
 * erro, mesmo com o script rodando normalmente. Ver incidente: README chegou a registrar
 * `1.5` para um documento que os dois playbooks (fonte real) já registravam como `1.12`.
 */
function findRootReadme() {
  const candidate = path.join(findPackageRoot(), "README.md");
  return fs.existsSync(candidate) ? candidate : null;
}

function readFileSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function readDocVersion(content) {
  if (content === null) return { error: "arquivo não encontrado" };
  const match = content.match(DOC_VERSION_RE);
  if (!match) return { error: "sem marcador <!-- doc-version --> " };
  return { version: match[1] };
}

function collectAnchors(content) {
  if (content === null) return new Set();
  const anchors = new Set();
  let m;
  const re = new RegExp(ANCHOR_DEF_RE);
  while ((m = re.exec(content)) !== null) anchors.add(m[1]);
  return anchors;
}

/**
 * Extrai linhas de tabela "Referenciado por" no formato de 5 colunas:
 * | Projeto | Documento do cliente | `doc-version` registrado | Versão deste playbook | Âncora(s)/Observação |
 * Ignora cabeçalho e separador.
 */
function parseTraceabilityRows(playbookContent, playbookFile) {
  const rows = [];
  const lines = playbookContent.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith(">") && !line.startsWith("|")) continue;
    const cleaned = line.replace(/^>\s*/, "");
    if (!cleaned.startsWith("|")) continue;
    const cells = cleaned
      .split("|")
      .map((c) => c.trim())
      .filter((c, idx, arr) => !(idx === 0 && c === "") && !(idx === arr.length - 1 && c === ""));
    if (cells.length < 4) continue;
    if (/^projeto$/i.test(cells[0])) continue;
    if (/^-+$/.test(cells[0].replace(/\s/g, ""))) continue;
    const [projeto, documentoCliente, docVersionRegistrado, versaoPlaybookCell, observacao] = cells;
    const docMatch = documentoCliente.match(/`([^`]+)`/);
    const versionMatch = docVersionRegistrado.match(/`([^`]+)`/);
    if (!docMatch || !versionMatch) continue;

    // A coluna "Versão deste playbook" às vezes inclui o nome do arquivo (ex: tabelas do
    // README, que resumem linhas de vários playbooks: "`stack-nextjs-playbook.md` v1.0")
    // e às vezes não (ex: tabelas dentro do próprio playbook, autorreferentes: "`v1.0`").
    // Quando o nome aparece, as âncoras citadas nesta linha devem ser buscadas NAQUELE
    // arquivo, não no arquivo onde a linha da tabela fisicamente está (playbookFile) —
    // sem isso, uma linha do README citando âncoras do stack-nextjs-playbook.md as
    // procurava dentro do próprio README, onde elas nunca existiram.
    const playbookFileMatch = versaoPlaybookCell.match(/([a-z0-9-]+\.md)/i);
    const targetPlaybookFile = playbookFileMatch ? playbookFileMatch[1] : playbookFile;

    const anchorRefs = new Set();
    const re = new RegExp(ANCHOR_REF_RE);
    let m;
    while ((m = re.exec(observacao || "")) !== null) anchorRefs.add(m[1]);

    rows.push({
      playbookFile,
      targetPlaybookFile,
      projeto,
      documentoCliente: docMatch[1],
      docVersionRegistrado: versionMatch[1],
      anchorRefs: Array.from(anchorRefs),
    });
  }
  return rows;
}

// Nome de cada playbook sem a extensão .md, para casar citações tipo `engenharia-playbook`
// §2` mesmo quando o texto usa o nome lógico (sem `.md`) em vez do nome de arquivo.
function playbookBaseNames(playbookFiles) {
  return playbookFiles.map((f) => f.replace(/\.md$/, ""));
}

/**
 * §9 do engenharia-playbook proíbe citar playbook por número de seção em qualquer
 * referência cruzada solta (fora de tabela de rastreabilidade) — só por âncora. Antes
 * desta correção, nada verificava isso: o `CLAUDE.md` de um projeto cliente citou
 * `engenharia-playbook` §2, §1/§3, §5 e §4 em quatro lugares diferentes (violando a
 * própria convenção que o playbook define) sem que o script acusasse nada, porque ele só
 * fazia parsing de tabelas formais. Esta função varre todo `.md` do repositório cliente
 * (exceto `node_modules/`) atrás do padrão `` `nome-do-playbook` §N `` e reporta cada
 * ocorrência como violação de convenção.
 */
function scanForBareSectionReferences(clientRoot, playbookNames) {
  const violations = [];
  const skipDirs = new Set(["node_modules", ".git", ".specify"]);

  const namePattern = playbookNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  if (!namePattern) return violations;
  // Casa: `engenharia-playbook` §2   |   `engenharia-playbook` §1/§3   |   `stack-nextjs-playbook` §4
  const bareRefRe = new RegExp("`(" + namePattern + ")`\\s*§\\s*[0-9]+(?:\\s*/\\s*§?\\s*[0-9]+)*", "g");

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skipDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = fs.readFileSync(fullPath, "utf8");
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          let m;
          const re = new RegExp(bareRefRe);
          while ((m = re.exec(line)) !== null) {
            violations.push({
              file: path.relative(clientRoot, fullPath),
              line: idx + 1,
              playbook: m[1],
              text: line.trim(),
            });
          }
        });
      }
    }
  }

  walk(clientRoot);
  return violations;
}

function main() {
  const clientRoot = path.resolve(process.argv[2] || process.cwd());
  const playbooksDir = findPlaybooksDir();
  const playbookFiles = fs.readdirSync(playbooksDir).filter((f) => f.endsWith(".md"));

  const allRows = [];
  const playbookContents = {};
  for (const file of playbookFiles) {
    const content = fs.readFileSync(path.join(playbooksDir, file), "utf8");
    playbookContents[file] = content;
    allRows.push(...parseTraceabilityRows(content, file));
  }

  // README.md da raiz do pacote guarda sua própria tabela "Referenciado por" — varrer
  // junto, não só playbooks/*.md (ver findRootReadme()).
  const rootReadmePath = findRootReadme();
  if (rootReadmePath) {
    const readmeLabel = "README.md";
    const content = fs.readFileSync(rootReadmePath, "utf8");
    playbookContents[readmeLabel] = content;
    allRows.push(...parseTraceabilityRows(content, readmeLabel));
  }

  if (allRows.length === 0) {
    console.log("Nenhuma linha de tabela de rastreabilidade encontrada. Nada para verificar.");
    process.exit(0);
  }

  let hasProblem = false;
  console.log(`Verificando ${allRows.length} referência(s) contra ${clientRoot}...\n`);

  for (const row of allRows) {
    const docPath = path.join(clientRoot, row.documentoCliente);
    const docContent = readFileSafe(docPath);
    const versionResult = readDocVersion(docContent);

    // --- doc-version ---
    if (versionResult.error) {
      hasProblem = true;
      console.log(
        `[AVISO] ${row.playbookFile}: ${row.projeto} → ${row.documentoCliente} ` +
          `— ${versionResult.error} (esperava <!-- doc-version: ${row.docVersionRegistrado} -->)`
      );
    } else if (versionResult.version !== row.docVersionRegistrado) {
      hasProblem = true;
      console.log(
        `[DIVERGE-VERSAO] ${row.playbookFile}: ${row.documentoCliente} — ` +
          `tabela registra "${row.docVersionRegistrado}", arquivo real está em ` +
          `"${versionResult.version}".`
      );
    } else {
      console.log(`[OK-VERSAO] ${row.playbookFile}: ${row.documentoCliente} — ${versionResult.version}`);
    }

    // --- âncoras citadas na Observação desta linha ---
    if (row.anchorRefs.length === 0) continue;

    const targetContent = playbookContents[row.targetPlaybookFile];
    if (targetContent === undefined) {
      hasProblem = true;
      console.log(
        `[PLAYBOOK-ALVO-NAO-CARREGADO] ${row.playbookFile}: linha cita ` +
          `"${row.targetPlaybookFile}" na coluna "Versão deste playbook", mas esse ` +
          `arquivo não foi encontrado em playbooks/ nem é o README.md — confirme o nome.`
      );
      continue;
    }

    const anchorsInPlaybook = collectAnchors(targetContent);
    const anchorsInClientDoc = collectAnchors(docContent);

    for (const anchor of row.anchorRefs) {
      const foundInPlaybook = anchorsInPlaybook.has(anchor);
      const foundInClientDoc = anchorsInClientDoc.has(anchor);
      if (foundInPlaybook || foundInClientDoc) {
        console.log(
          `[OK-ANCORA] ${row.playbookFile}: \`${anchor}\` — encontrada em ` +
            `${foundInPlaybook ? row.targetPlaybookFile : row.documentoCliente}`
        );
      } else {
        hasProblem = true;
        console.log(
          `[ANCORA-AUSENTE] ${row.playbookFile}: \`${anchor}\` citada na linha de ` +
            `${row.documentoCliente}, mas não encontrada nem em ${row.targetPlaybookFile} ` +
            `nem em ${row.documentoCliente}. A seção pode ter sido renomeada, removida, ` +
            `ou o nome foi digitado errado.`
        );
      }
    }
  }

  // --- citações soltas por número de seção (fora de tabela), em todo .md do cliente ---
  console.log("\nVerificando citações soltas por número de seção (convenção §9)...\n");
  const violations = scanForBareSectionReferences(clientRoot, playbookBaseNames(playbookFiles));
  if (violations.length > 0) {
    hasProblem = true;
    for (const v of violations) {
      console.log(
        `[CONVENCAO-VIOLADA] ${v.file}:${v.line} — cita \`${v.playbook}\` por número de ` +
          `seção em vez de âncora: "${v.text}"`
      );
    }
  } else {
    console.log("[OK-CONVENCAO] nenhuma citação solta por número de seção encontrada.");
  }

  if (hasProblem) {
    console.log(
      "\nEncontrei divergência(s) — ver mensagens acima. Isto não presume qual lado " +
        "está desatualizado; decida manualmente (tabela do playbook, marcador de " +
        "versão, ou marcador de âncora do documento) e atualize. Para violações de " +
        "convenção (§9), troque o número de seção pelo nome da âncora entre crases."
    );
    process.exit(1);
  }

  console.log("\nTudo consistente.");
  process.exit(0);
}

main();
