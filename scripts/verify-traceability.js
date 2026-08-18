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
    const [projeto, documentoCliente, docVersionRegistrado, , observacao] = cells;
    const docMatch = documentoCliente.match(/`([^`]+)`/);
    const versionMatch = docVersionRegistrado.match(/`([^`]+)`/);
    if (!docMatch || !versionMatch) continue;

    const anchorRefs = new Set();
    const re = new RegExp(ANCHOR_REF_RE);
    let m;
    while ((m = re.exec(observacao || "")) !== null) anchorRefs.add(m[1]);

    rows.push({
      playbookFile,
      projeto,
      documentoCliente: docMatch[1],
      docVersionRegistrado: versionMatch[1],
      anchorRefs: Array.from(anchorRefs),
    });
  }
  return rows;
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

    const anchorsInPlaybook = collectAnchors(playbookContents[row.playbookFile]);
    const anchorsInClientDoc = collectAnchors(docContent);

    for (const anchor of row.anchorRefs) {
      const foundInPlaybook = anchorsInPlaybook.has(anchor);
      const foundInClientDoc = anchorsInClientDoc.has(anchor);
      if (foundInPlaybook || foundInClientDoc) {
        console.log(
          `[OK-ANCORA] ${row.playbookFile}: \`${anchor}\` — encontrada em ` +
            `${foundInPlaybook ? row.playbookFile : row.documentoCliente}`
        );
      } else {
        hasProblem = true;
        console.log(
          `[ANCORA-AUSENTE] ${row.playbookFile}: \`${anchor}\` citada na linha de ` +
            `${row.documentoCliente}, mas não encontrada nem em ${row.playbookFile} ` +
            `nem em ${row.documentoCliente}. A seção pode ter sido renomeada, removida, ` +
            `ou o nome foi digitado errado.`
        );
      }
    }
  }

  if (hasProblem) {
    console.log(
      "\nEncontrei divergência(s) — ver mensagens acima. Isto não presume qual lado " +
        "está desatualizado; decida manualmente (tabela do playbook, marcador de " +
        "versão, ou marcador de âncora do documento) e atualize."
    );
    process.exit(1);
  }

  console.log("\nTudo consistente.");
  process.exit(0);
}

main();
