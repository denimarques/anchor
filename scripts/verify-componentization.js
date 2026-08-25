#!/usr/bin/env node
"use strict";

/**
 * verify-componentization.js
 *
 * Detecta o padrão de drift que motivou este script: uma classe Tailwind visual
 * (forma + cor — ex: `rounded-full border border-border-subtle`, `rounded-button
 * bg-secondary text-white`) sendo copiada à mão numa tag nativa (`<button>`, `<a>`) em
 * vez de reaproveitar o componente que já existe para aquele padrão (`<Button>`,
 * `<IconButton>` ou o que vier a existir em components/ui/).
 *
 * Duas checagens, heurísticas (não presumem, só apontam para revisão — mesmo espírito
 * de verify-traceability.js):
 *
 *   A) RAW-VS-COMPONENTE: uma tag nativa fora de components/ui/ compartilha N+ classes
 *      não-genéricas com um uso real de um componente de ui/ (ex: <Button
 *      className="rounded-button bg-secondary text-white"> em outro arquivo) — sinal de
 *      que deveria ter usado o componente em vez de reescrever o estilo.
 *
 *   B) RAW-VS-RAW: duas tags nativas, em arquivos DIFERENTES, ambas fora de
 *      components/ui/, compartilham N+ classes não-genéricas entre si — sinal de padrão
 *      visual repetido sem componente compartilhado nenhum (nem via ui/).
 *
 * Uso:
 *   node node_modules/@denimarques/anchor/scripts/verify-componentization.js [raiz]
 *
 * Saída: 0 se nada suspeito; lista cada achado e sai com código 1 caso contrário.
 */

const fs = require("fs");
const path = require("path");

const MIN_SHARED_TOKENS = 3;

// Classes de layout/espaçamento/tipografia genéricas demais para indicar duplicação de
// COMPONENTE — aparecem em qualquer elemento, não são a "assinatura visual" de um botão
// ou chip específico. Ajuste esta lista conforme o projeto crescer.
const GENERIC_TOKENS = new Set([
  "flex", "inline-flex", "grid", "hidden", "block", "relative", "absolute",
  "items-center", "items-start", "items-end", "justify-center", "justify-between",
  "justify-start", "text-center", "text-left", "text-sm", "text-xs", "text-base",
  "font-bold", "font-semibold", "font-medium", "uppercase", "tracking-wide",
  "whitespace-nowrap", "select-none", "outline-none", "shrink-0", "self-start",
  "self-center", "overflow-hidden", "overflow-y-auto", "w-full", "h-full",
  "gap-1", "gap-2", "gap-3", "gap-4", "gap-6", "gap-8",
  "mt-2", "mt-4", "mt-6", "mt-8", "mb-2", "mb-4",
  "px-2", "px-4", "py-2", "py-4", "p-2", "p-4",
  "transition-all", "transition-colors", "disabled:opacity-40", "disabled:pointer-events-none",
]);

const TAG_OPEN_RE = /<([A-Za-z][A-Za-z0-9]*)\b/g;
const CLASSNAME_RE = /className=(\{`([^`]*)`\}|"([^"]*)"|\{cn\(([\s\S]*?)\)\})/;

/**
 * A partir do índice logo após "<TagName", encontra o '>' real que fecha a tag —
 * ignorando qualquer '>' que apareça dentro de uma expressão { ... } de prop (ex: uma
 * tag aninhada em `render={<a .../>}`, cujo '>' de fechamento fica em profundidade > 0).
 * Sem isso, uma regex não-gulosa simples pega o primeiro '>' que encontrar, que pode ser
 * o de uma tag aninhada, cortando a tag externa antes do className de verdade.
 */
function findTagCloseIndex(content, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return i;
  }
  return -1;
}

function walk(dir, skipDirs, onFile) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, skipDirs, onFile);
    else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) onFile(fullPath);
  }
}

function extractTokens(classNameAttr) {
  const m = classNameAttr.match(CLASSNAME_RE);
  if (!m) return null;
  const raw = m[2] ?? m[3] ?? m[4] ?? "";
  // Remove ${...} (template literal) e strings dentro de cn(...) que sejam expressões —
  // fica só com os literais estáticos, que é o que importa para detectar cópia.
  const cleaned = raw
    .replace(/\$\{[^}]*\}/g, " ")
    .replace(/[`'"]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens.length > 0 ? tokens : null;
}

function significantTokens(tokens) {
  return tokens.filter((t) => !GENERIC_TOKENS.has(t));
}

function sharedCount(a, b) {
  const setB = new Set(b);
  return a.filter((t) => setB.has(t)).length;
}

function collectTags(clientRoot) {
  const rawTags = []; // <button>/<a> fora de components/ui/
  const componentTags = []; // uso de <Button>, <IconButton>, etc — qualquer componente capitalizado

  walk(clientRoot, new Set(["node_modules", ".git", ".next", ".specify"]), (filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(clientRoot, filePath);
    const insideUi = /(^|[\\/])components[\\/]ui[\\/]/.test(relPath);

    const openRe = new RegExp(TAG_OPEN_RE);
    let m;
    while ((m = openRe.exec(content)) !== null) {
      const tagName = m[1];
      const isNative = tagName === "button" || tagName === "a";
      const isComponent = /^[A-Z]/.test(tagName);
      if (!isNative && !isComponent) continue;

      const closeIdx = findTagCloseIndex(content, openRe.lastIndex);
      if (closeIdx === -1) continue;
      const attrsSpan = content.slice(openRe.lastIndex, closeIdx);
      const tokens = extractTokens(attrsSpan);
      if (!tokens) continue;
      const lineNumber = content.slice(0, m.index).split("\n").length;

      if (isNative && !insideUi) {
        rawTags.push({ file: relPath, line: lineNumber, tag: tagName, tokens, significant: significantTokens(tokens) });
      } else if (isComponent) {
        componentTags.push({ file: relPath, line: lineNumber, component: tagName, tokens, significant: significantTokens(tokens) });
      }
    }
  });

  return { rawTags, componentTags };
}

function main() {
  const clientRoot = path.resolve(process.argv[2] || process.cwd());
  const { rawTags, componentTags } = collectTags(clientRoot);

  let hasProblem = false;

  console.log(`Verificando ${rawTags.length} tag(s) nativa(s) fora de components/ui/ contra ${clientRoot}...\n`);

  // --- Checagem A: raw vs. uso real de componente ---
  for (const raw of rawTags) {
    if (raw.significant.length < MIN_SHARED_TOKENS) continue;
    for (const comp of componentTags) {
      if (comp.file === raw.file && comp.line === raw.line) continue;
      const shared = sharedCount(raw.significant, comp.significant);
      if (shared >= MIN_SHARED_TOKENS) {
        hasProblem = true;
        console.log(
          `[RAW-VS-COMPONENTE] ${raw.file}:${raw.line} — <${raw.tag}> compartilha ${shared} ` +
            `classe(s) com um uso de <${comp.component}> em ${comp.file}:${comp.line}. ` +
            `Considere usar <${comp.component}> em vez de estilizar à mão.`
        );
      }
    }
  }

  // --- Checagem B: raw vs. raw, em arquivos diferentes ---
  for (let i = 0; i < rawTags.length; i++) {
    for (let j = i + 1; j < rawTags.length; j++) {
      const a = rawTags[i];
      const b = rawTags[j];
      if (a.file === b.file) continue;
      if (a.significant.length < MIN_SHARED_TOKENS || b.significant.length < MIN_SHARED_TOKENS) continue;
      const shared = sharedCount(a.significant, b.significant);
      if (shared >= MIN_SHARED_TOKENS) {
        hasProblem = true;
        console.log(
          `[RAW-VS-RAW] ${a.file}:${a.line} e ${b.file}:${b.line} — <${a.tag}>/<${b.tag}> ` +
            `compartilham ${shared} classe(s) sem nenhum componente de ui/ por trás. ` +
            `Considere extrair um componente compartilhado.`
        );
      }
    }
  }

  if (hasProblem) {
    console.log(
      "\nEncontrei duplicação(ões) de estilo em potencial — ver mensagens acima. Isto é " +
        "heurístico (contagem de classes em comum), não prova definitiva; revise cada " +
        "achado antes de decidir extrair ou não um componente."
    );
    process.exit(1);
  }

  console.log("\nNenhuma duplicação de estilo detectada.");
  process.exit(0);
}

main();
