import { z } from "zod";
/**
 * Núcleo mínimo de tokens — intencionalmente enxuto.
 *
 * Este schema cobre só o que é universal a QUALQUER plataforma (landing,
 * dashboard, saas, crm). Tokens específicos de um projeto (ex:
 * `colorAccentSecondary`, `spacingHeroBlock`, `gridColumnsCollection` de um
 * catálogo específico) NÃO entram aqui — eles vivem no repo do cliente,
 * estendendo este schema:
 *
 *   const ProjectTokensSchema = TokensSchema.extend({
 *     colorAccentSecondary: z.string(),
 *     spacingHeroBlock: z.string(),
 *   });
 *
 * Regra de decisão (mesma do playbook de engenharia, adaptada): se o token
 * deveria existir por padrão em TODO projeto novo de uma plataforma, ele
 * é candidato a entrar no `platformDefaults` daquela plataforma (não no
 * TokensSchema em si, que continua descrevendo só a FORMA mínima comum).
 * Se o token só faz sentido para um cliente específico, ele nunca sobe
 * pra este pacote — fica na extensão do projeto.
 */
export declare const TokensSchema: z.ZodObject<{
    colorPrimary: z.ZodString;
    colorBackground: z.ZodString;
    colorAccent: z.ZodOptional<z.ZodString>;
    radiusButton: z.ZodString;
    radiusCard: z.ZodString;
    fontHeading: z.ZodString;
    fontBody: z.ZodString;
}, z.core.$strip>;
export type Tokens = z.infer<typeof TokensSchema>;
