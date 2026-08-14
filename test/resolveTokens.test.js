"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { z } = require("zod");
const { resolveTokens, platformDefaults, TokensSchema } = require("../dist");

test("precedência: clientTokens sobrescreve platformDefaults, que sobrescreve coreDefaults", () => {
  const result = resolveTokens("landing", { colorPrimary: "#E6007A" });

  // vem do clientTokens
  assert.equal(result.colorPrimary, "#E6007A");
  // vem do platformDefaults.landing (não foi sobrescrito pelo cliente)
  assert.equal(result.radiusButton, "9999px");
  assert.equal(result.fontHeading, "Poppins");
  // vem do coreDefaults (nem client nem platform definiram)
  assert.equal(result.colorBackground, "#FFFFFF");
});

test("cada plataforma aplica seu próprio platformDefaults", () => {
  const landing = resolveTokens("landing", {});
  const dashboard = resolveTokens("dashboard", {});
  const saas = resolveTokens("saas", {});
  const crm = resolveTokens("crm", {});

  assert.equal(landing.radiusCard, "16px");
  assert.equal(dashboard.radiusCard, "8px");
  assert.equal(dashboard.colorAccent, "#185FA5");
  assert.equal(saas.radiusButton, "8px");
  assert.equal(crm.radiusButton, "8px");
});

test("clientTokens pode sobrescrever até token definido pela plataforma", () => {
  const result = resolveTokens("dashboard", { colorAccent: "#000FFF" });
  assert.equal(result.colorAccent, "#000FFF");
});

test("chave desconhecida em clientTokens SEM schema estendido é descartada pelo Zod (não quebra, mas o dado some)", () => {
  assert.doesNotThrow(() => {
    // @ts-ignore -- de propósito: simulando typo/token de extensão sem passar schema
    const result = resolveTokens("landing", { colorPrimayTypo: "#FFFFFF" });
    assert.ok(!("colorPrimayTypo" in result));
  });
});

test("chave de extensão de projeto COM schema estendido sobrevive ao parse", () => {
  const ProjectTokensSchema = TokensSchema.extend({
    colorAccentSecondary: z.string(),
  });

  const result = resolveTokens(
    "landing",
    { colorPrimary: "#E6007A", colorAccentSecondary: "#1D9E75" },
    ProjectTokensSchema
  );

  assert.equal(result.colorAccentSecondary, "#1D9E75");
  assert.equal(result.colorPrimary, "#E6007A");
  // ainda herda defaults de platform/core normalmente
  assert.equal(result.radiusButton, "9999px");
});

test("resultado final sempre bate com o shape do TokensSchema (sem campos extras)", () => {
  const result = resolveTokens("crm", {});
  const expectedKeys = [
    "colorPrimary",
    "colorBackground",
    "radiusButton",
    "radiusCard",
    "fontHeading",
    "fontBody",
    "colorAccent",
  ].sort();
  assert.deepEqual(Object.keys(result).sort(), expectedKeys);
});

test("platformDefaults expõe as 6 plataformas esperadas", () => {
  assert.deepEqual(Object.keys(platformDefaults).sort(), [
    "crm",
    "dashboard",
    "ecommerce",
    "landing",
    "saas",
    "storefront",
  ]);
});
