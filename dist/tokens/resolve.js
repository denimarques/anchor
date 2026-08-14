"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTokens = resolveTokens;
const schema_1 = require("./schema");
const platform_defaults_1 = require("./platform-defaults");
const coreDefaults = {
    colorPrimary: "#000000",
    colorBackground: "#FFFFFF",
    radiusButton: "4px",
    radiusCard: "4px",
    fontHeading: "Inter",
    fontBody: "Inter",
};
const CORE_KEYS = new Set(Object.keys(schema_1.TokensSchema.shape));
/**
 * Merge: coreDefaults -> platformDefaults[platform] -> clientTokens,
 * validado no final contra um schema (por padrão, o TokensSchema core).
 *
 * Zod, por padrão, descarta silenciosamente chaves que não conhece — o que
 * significa que um typo em `clientTokens` (ex: "colorPrimay") simplesmente
 * some sem erro. Como este schema é intencionalmente mínimo e projetos
 * legitimamente estendem `Tokens` com campos próprios (ver comentário em
 * schema.ts), não dá pra usar `.strict()` aqui sem quebrar esse uso válido.
 *
 * Se o projeto estende o schema, passe o schema estendido no 3º argumento —
 * sem isso, o `.parse()` final validaria contra o TokensSchema core e
 * descartaria silenciosamente os campos extras, mesmo que o aviso abaixo
 * diga pra "ignorar" (o aviso é sobre a CHAVE ser desconhecida, não uma
 * garantia de que ela sobrevive ao parse — passar o schema certo é o que
 * garante isso):
 *
 *   const ProjectTokensSchema = TokensSchema.extend({ colorAccentSecondary: z.string() });
 *   const tokens = resolveTokens("landing", clientTokens, ProjectTokensSchema);
 *   // tokens.colorAccentSecondary existe e está tipado
 *
 * O aviso de chave desconhecida continua comparando contra o núcleo (não
 * contra o schema estendido passado), porque o objetivo dele é só pegar
 * typo antes de qualquer schema saber lidar com a chave.
 */
function resolveTokens(platform, clientTokens, schema) {
    if (process.env.NODE_ENV !== "production") {
        const unknownKeys = Object.keys(clientTokens).filter((key) => !CORE_KEYS.has(key));
        if (unknownKeys.length > 0 && !schema) {
            console.warn(`[@denimarques/anchor] resolveTokens recebeu chave(s) fora do TokensSchema core, sem um schema estendido no 3º argumento: ${unknownKeys.join(", ")}. Essas chaves serão descartadas do resultado. Se são tokens de extensão do projeto, passe o schema estendido (TokensSchema.extend({...})) como 3º argumento — se não, confira se não é erro de digitação.`);
        }
    }
    const merged = {
        ...coreDefaults,
        ...platform_defaults_1.platformDefaults[platform],
        ...clientTokens,
    };
    const effectiveSchema = schema !== null && schema !== void 0 ? schema : schema_1.TokensSchema;
    return effectiveSchema.parse(merged);
}
