"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensSchema = void 0;
const zod_1 = require("zod");
/**
 * Núcleo mínimo de tokens — intencionalmente enxuto.
 *
 * Este schema cobre só o que é universal a QUALQUER plataforma (landing,
 * dashboard, saas, crm). Tokens específicos de um projeto (ex: `colorWhatsapp`,
 * `spacingSection`, `gridColumnsProdutos` do Catálogo de Óleos) NÃO entram
 * aqui — eles vivem no repo do cliente, estendendo este schema:
 *
 *   const ProjectTokensSchema = TokensSchema.extend({
 *     colorWhatsapp: z.string(),
 *     spacingSection: z.string(),
 *   });
 *
 * Regra de decisão (mesma do playbook de engenharia, adaptada): se o token
 * deveria existir por padrão em TODO projeto novo de uma plataforma, ele
 * é candidato a entrar no `platformDefaults` daquela plataforma (não no
 * TokensSchema em si, que continua descrevendo só a FORMA mínima comum).
 * Se o token só faz sentido para um cliente específico, ele nunca sobe
 * pra este pacote — fica na extensão do projeto.
 */
exports.TokensSchema = zod_1.z.object({
    colorPrimary: zod_1.z.string(),
    colorBackground: zod_1.z.string(),
    colorAccent: zod_1.z.string().optional(),
    radiusButton: zod_1.z.string(),
    radiusCard: zod_1.z.string(),
    fontHeading: zod_1.z.string(),
    fontBody: zod_1.z.string(),
});
