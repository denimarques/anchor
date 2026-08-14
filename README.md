# anchor

Tokens, defaults por plataforma e receitas de layout compartilhados entre
todos os projetos de cliente. Nunca sabe o nome de nenhum cliente — só
define regra e tipo.

## O que tem aqui

- `src/tokens/` — schema (`Tokens`), defaults por plataforma (`landing`,
  `dashboard`, `saas`, `crm`, `ecommerce`, `storefront`) e a função de merge
  (`resolveTokens`)
- `src/layouts/` — as receitas de layout por plataforma (`platformRecipes`),
  e os tipos restritos derivados delas (`LandingSectionName`,
  `DashboardRouteName`, `SaasRouteName`, `CrmRouteName`,
  `EcommerceRouteName`, `StorefrontRouteName`)
- `src/sections/` — só os **nomes** de seção/rota válidos (`sectionNames`);
  o componente React de cada seção fica no repo do cliente, não aqui
- `playbooks/` — convenções de git/CI/stack, em markdown, referenciadas
  (não copiadas) pelos projetos de cliente

## O teste por trás de cada recipe

Toda seção/rota que aparece como default de uma recipe passou por uma
pergunta: **"sem isso não é [arquétipo], é outra coisa" — ou é conteúdo que
varia por negócio?**

Contacts/Deals/Activities são a própria definição de CRM. Products/Orders/
Customers são a própria definição de e-commerce. Header/Hero/ContactForm/
Footer são o mínimo sem o qual algo não é uma landing page. Nenhuma dessas
listas tenta prever tudo que um cliente vai pedir — só o que é estrutural
ao tipo de produto, independente de quem for o cliente.

Conteúdo que varia por negócio (quais produtos, quais artigos, qual
depoimento) nunca entra numa recipe compartilhada — é extensão de projeto,
composta por cima do tipo restrito que a recipe exporta.

## `TokensSchema` é intencionalmente mínimo

Cobre só o que é universal a qualquer plataforma (7 campos). Tokens
específicos de um projeto (ex: uma cor de destaque secundária, um
espaçamento de bloco do hero) não entram aqui — o projeto estende
localmente:

```ts
const ProjectTokensSchema = TokensSchema.extend({
  colorAccentSecondary: z.string(),
  spacingHeroBlock: z.string(),
});
```

Se um token deveria existir por padrão em todo projeto novo de uma
plataforma (não só um cliente), ele é candidato a `platformDefaults` da
plataforma — não ao `TokensSchema` em si, que continua descrevendo só a
forma mínima comum. Ver comentário em `src/tokens/schema.ts`.

`resolveTokens` não usa `.strict()` no merge final (isso quebraria projetos
que legitimamente estendem `Tokens`), mas avisa no console (fora de
produção) quando `clientTokens` traz uma chave fora do núcleo — para não
engolir um typo em silêncio.

**Importante:** se o projeto estende `Tokens`, passe o schema estendido
como 3º argumento de `resolveTokens` — sem isso, os campos extras são
descartados do resultado final (o `.parse()` valida contra o schema, e o
schema padrão só conhece os 7 campos do núcleo):

```ts
const ProjectTokensSchema = TokensSchema.extend({ colorAccentSecondary: z.string() });
const tokens = resolveTokens("landing", clientTokens, ProjectTokensSchema);
// tokens.colorAccentSecondary existe e está tipado
```

## Vocabulário reutilizável vs. rota estrutural

`sectionNames` tem duas categorias, documentadas em
`src/sections/registry.ts`:

1. **Estruturais** — universais ao arquétipo, viram default de recipe
   (`Header`, `Contacts`, `Products` no admin de e-commerce, etc.)
2. **Vocabulário reutilizável** — útil a vários clientes de um mesmo tipo de
   negócio, mas não a qualquer plataforma do arquétipo (`About`,
   `ProductGrid`, `Promotions`, `Testimonials`). Nenhuma recipe as inclui
   por padrão; cada projeto compõe explicitamente por cima do tipo restrito:

```ts
import { type LandingSectionName } from "@voce/anchor";

type ClientLandingSection = LandingSectionName | "Products" | "Testimonials" | "Promotions";
```

Se uma seção/rota é conceito novo, que não existe ainda no registry nem
serve a mais de um cliente, ela nem entra no `@voce/anchor` — fica local,
no repo do cliente, até um segundo cliente pedir o mesmo conceito.

## Ecommerce: duas recipes irmãs

Um projeto de e-commerce completo consome duas recipes do mesmo pacote:
`ecommerce` (admin — o lojista gerencia catálogo/pedidos/clientes,
`type: "shell"`, Sidebar+Topbar) e `storefront` (loja pública — o cliente
final navega/compra, `type: "shop"`, Header+Footer). Não são alternativas,
são metades complementares do mesmo produto.

## Build e publicação

```bash
npm install
npm test        # compila + roda os testes (node:test, sem dependência nova)
npm run build   # compila src/ -> dist/
npm pack        # gera o .tgz local, pra testar antes de publicar
```

`prepack` já roda `build` automaticamente antes de `npm pack`/`npm publish`,
então `dist/` nunca vai parar desatualizado em relação a `src/` por
esquecimento.

Pra publicar de verdade — **`X.X.X` abaixo é placeholder: troque pelo
número de versão real (ex: `1.0.0`, `1.1.0`) antes de rodar, nunca copie o
comando com `X.X.X` literal:**

```bash
git add .
git commit -m "anchor v1.0.0"   # ajuste o número pra versão real que está publicando
git tag v1.0.0                  # idem — precisa bater com o número acima
git push
git push --tags
```

> **Nota:** `git push && git push --tags` (com `&&`) funciona em bash/zsh e no
> PowerShell 7+, mas **não** no Windows PowerShell 5.x padrão (`&&` não é
> separador de comando nessa versão). No PowerShell 5.x, rode os dois `git
> push` em linhas separadas, como acima.

Depois de publicar, confirme que a tag correta chegou ao remoto antes de
referenciá-la em qualquer projeto de cliente:

```bash
git ls-remote --tags origin
```

Deve aparecer `refs/tags/v1.0.0` (ou a versão que você publicou) — não
`refs/tags/X.X.X`.

## Como um cliente consome isto

No `package.json` do repo do cliente, a chave da dependência precisa ser
**exatamente** `@voce/anchor` (é o `name` deste pacote — se a chave for
diferente, o `node_modules` cria a pasta com o nome da chave, não com o
`name` do pacote, e todo `import ... from "@voce/anchor"` quebra):

```json
"@voce/anchor": "github:denimarques/anchor#v1.0.0"
```

(Troque `v1.0.0` pela tag que você de fato publicou, se for outra.)

## Regra de ouro

Se a mudança serve **só** pra um cliente, ela não entra aqui — vai pro
`client-tokens.ts`/`page-config.ts` daquele cliente. Só sobe versão neste
repo quando o valor deveria ser o padrão pra **todo** cliente novo daquela
plataforma.

## Referenciado por (rastreabilidade reversa)

Atualize esta tabela ao adotar uma versão do anchor num projeto de cliente,
ou ao mudar algo aqui que quebre compatibilidade com um projeto já listado.

| Projeto | Versão do anchor referenciada | Observação |
| --- | --- | --- |
| — | — | Nenhum projeto fixou uma versão publicada ainda |