import { z } from "zod";
import { type Tokens } from "./schema";
import { type Platform } from "./platform-defaults";
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
export declare function resolveTokens<T extends Tokens = Tokens>(platform: Platform, clientTokens: Partial<T>, schema?: z.ZodType<T>): T;
