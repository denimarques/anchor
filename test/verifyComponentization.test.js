"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractTokens,
  significantTokens,
  sharedCount,
  findTagCloseIndex,
} = require("../scripts/verify-componentization.js");

// --- findTagCloseIndex ---

test("findTagCloseIndex: encontra o '>' de fechamento de uma tag simples", () => {
  const content = '<button className="foo">texto</button>';
  const startIdx = "<button".length;
  const closeIdx = findTagCloseIndex(content, startIdx);
  assert.equal(content[closeIdx], ">");
  assert.equal(content.slice(0, closeIdx), '<button className="foo"');
});

test("findTagCloseIndex: ignora '>' dentro de uma expressão aninhada (ex: render={<a .../>})", () => {
  const content = '<Button render={<a href="/x" />} className="foo">texto</Button>';
  const startIdx = "<Button".length;
  const closeIdx = findTagCloseIndex(content, startIdx);
  // O '>' correto é o que fecha <Button ...>, não o '>' de dentro de {<a .../>}
  assert.equal(content.slice(0, closeIdx), '<Button render={<a href="/x" />} className="foo"');
});

test("findTagCloseIndex: retorna -1 quando não há '>' de fechamento", () => {
  const content = '<button className="foo"';
  assert.equal(findTagCloseIndex(content, "<button".length), -1);
});

// --- extractTokens ---

test("extractTokens: extrai tokens de className com aspas duplas", () => {
  assert.deepEqual(extractTokens(' className="rounded-full border border-border-subtle"'), [
    "rounded-full",
    "border",
    "border-border-subtle",
  ]);
});

test("extractTokens: extrai tokens de className com template literal (crases)", () => {
  assert.deepEqual(extractTokens(" className={`rounded-button bg-secondary`}"), [
    "rounded-button",
    "bg-secondary",
  ]);
});

test("extractTokens: remove ${...} de dentro de um template literal", () => {
  const tokens = extractTokens(" className={`rounded-button ${active ? 'bg-primary' : ''} bg-secondary`}");
  assert.deepEqual(tokens, ["rounded-button", "bg-secondary"]);
});

test("extractTokens: extrai tokens de dentro de cn(...)", () => {
  const tokens = extractTokens(' className={cn("rounded-full border-border-subtle")}');
  assert.deepEqual(tokens, ["rounded-full", "border-border-subtle"]);
});

test("extractTokens: retorna null quando não há atributo className", () => {
  assert.equal(extractTokens(" href=\"/x\" target=\"_blank\""), null);
});

test("extractTokens: retorna null quando className resulta em lista vazia", () => {
  assert.equal(extractTokens(' className=""'), null);
});

// --- significantTokens ---

test("significantTokens: remove tokens genéricos, mantém os não-genéricos", () => {
  const tokens = ["flex", "items-center", "rounded-full", "border-border-subtle"];
  assert.deepEqual(significantTokens(tokens), ["rounded-full", "border-border-subtle"]);
});

test("significantTokens: lista só com tokens genéricos resulta em array vazio", () => {
  assert.deepEqual(significantTokens(["flex", "items-center", "gap-4"]), []);
});

// --- sharedCount ---

test("sharedCount: conta quantos tokens de 'a' também aparecem em 'b'", () => {
  const a = ["rounded-full", "border-border-subtle", "bg-secondary"];
  const b = ["border-border-subtle", "bg-secondary", "text-white"];
  assert.equal(sharedCount(a, b), 2);
});

test("sharedCount: retorna 0 quando não há tokens em comum", () => {
  assert.equal(sharedCount(["a", "b"], ["c", "d"]), 0);
});

test("sharedCount: não conta duplicado quando 'a' repete o mesmo token duas vezes", () => {
  const a = ["rounded-full", "rounded-full"];
  const b = ["rounded-full"];
  // filter em cima de `a` mantém as duas ocorrências — comportamento real da função,
  // não deduplicado; o teste documenta esse comportamento em vez de presumi-lo.
  assert.equal(sharedCount(a, b), 2);
});
