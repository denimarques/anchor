"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  readDocVersion,
  collectAnchors,
  extractPlaybookFileFromVersionCell,
  parseTraceabilityRows,
} = require("../scripts/verify-traceability.js");

// --- readDocVersion ---

test("readDocVersion: extrai a versão quando o marcador existe", () => {
  const content = "# Título\n\n<!-- doc-version: 1.4 -->\n\nresto do documento";
  assert.deepEqual(readDocVersion(content), { version: "1.4" });
});

test("readDocVersion: reporta erro quando content é null (arquivo não encontrado)", () => {
  const result = readDocVersion(null);
  assert.equal(result.version, undefined);
  assert.match(result.error, /não encontrado/);
});

test("readDocVersion: reporta erro quando não há marcador doc-version", () => {
  const result = readDocVersion("# Título\n\nsem marcador nenhum aqui");
  assert.equal(result.version, undefined);
  assert.match(result.error, /doc-version/);
});

// --- collectAnchors ---

test("collectAnchors: retorna Set vazio quando content é null", () => {
  assert.deepEqual(collectAnchors(null), new Set());
});

test("collectAnchors: coleta múltiplas âncoras de um documento", () => {
  const content = [
    "## 1. Primeira seção <!-- anchor: primeira-secao -->",
    "## 2. Segunda seção <!-- anchor: segunda-secao -->",
    "texto qualquer sem âncora",
  ].join("\n");
  assert.deepEqual(collectAnchors(content), new Set(["primeira-secao", "segunda-secao"]));
});

test("collectAnchors: retorna Set vazio quando não há nenhuma âncora", () => {
  assert.deepEqual(collectAnchors("# Título\n\nsem âncora nenhuma"), new Set());
});

// --- extractPlaybookFileFromVersionCell ---

test("extractPlaybookFileFromVersionCell: extrai o nome do arquivo quando presente", () => {
  assert.equal(
    extractPlaybookFileFromVersionCell("`stack-nextjs-playbook.md` v1.3"),
    "stack-nextjs-playbook.md"
  );
});

test("extractPlaybookFileFromVersionCell: retorna null quando a célula é autorreferente (sem nome de arquivo)", () => {
  assert.equal(extractPlaybookFileFromVersionCell("`v1.3`"), null);
});

// --- parseTraceabilityRows ---

test("parseTraceabilityRows: extrai uma linha de tabela válida com todos os campos", () => {
  const content = [
    "| Projeto | Documento do cliente | `doc-version` registrado | Versão deste playbook | Âncora(s) referenciada(s) |",
    "| --- | --- | --- | --- | --- |",
    "| Lente Peixe | `docs/prd.md` | `1.2` | `v1.2` | `fonte-corrente-valores-tecnicos` |",
  ].join("\n");

  const rows = parseTraceabilityRows(content, "engenharia-playbook.md");

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    playbookFile: "engenharia-playbook.md",
    targetPlaybookFile: "engenharia-playbook.md",
    projeto: "Lente Peixe",
    documentoCliente: "docs/prd.md",
    docVersionRegistrado: "1.2",
    anchorRefs: ["fonte-corrente-valores-tecnicos"],
  });
});

test("parseTraceabilityRows: ignora a linha de cabeçalho e a linha separadora", () => {
  const content = [
    "| Projeto | Documento do cliente | `doc-version` registrado | Versão deste playbook | Âncora(s) |",
    "| --- | --- | --- | --- | --- |",
  ].join("\n");
  assert.deepEqual(parseTraceabilityRows(content, "x.md"), []);
});

test("parseTraceabilityRows: extrai múltiplas âncoras da coluna de observação", () => {
  const content =
    "| Lente Peixe | `docs/tech/tech-specification.md` | `1.14` | `v1.2` | `fluxo-pr-nunca-merge-local`, `commit-automatico-task-a-task` |";
  const rows = parseTraceabilityRows(content, "engenharia-playbook.md");
  assert.deepEqual(rows[0].anchorRefs, ["fluxo-pr-nunca-merge-local", "commit-automatico-task-a-task"]);
});

test("parseTraceabilityRows: quando a célula de versão cita um arquivo, targetPlaybookFile aponta pra ele (caso README)", () => {
  const content =
    "| Lente Peixe | `docs/tech/tech-specification.md` | `1.14` | `stack-nextjs-playbook.md` v1.3 | `cache-por-entidade` |";
  const rows = parseTraceabilityRows(content, "README.md");
  assert.equal(rows[0].playbookFile, "README.md");
  assert.equal(rows[0].targetPlaybookFile, "stack-nextjs-playbook.md");
});

test("parseTraceabilityRows: ignora linha com menos de 4 colunas", () => {
  const content = "| Projeto | Documento |";
  assert.deepEqual(parseTraceabilityRows(content, "x.md"), []);
});

test("parseTraceabilityRows: ignora linha sem crases nas colunas de documento/versão", () => {
  const content = "| Lente Peixe | docs/prd.md | 1.2 | v1.0 | sem crase nenhuma |";
  assert.deepEqual(parseTraceabilityRows(content, "x.md"), []);
});

test("parseTraceabilityRows: linha dentro de blockquote (prefixo '>') também é reconhecida", () => {
  const content = "> | Lente Peixe | `docs/prd.md` | `1.2` | `v1.0` | `fonte-corrente-valores-tecnicos` |";
  const rows = parseTraceabilityRows(content, "engenharia-playbook.md");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].documentoCliente, "docs/prd.md");
});
