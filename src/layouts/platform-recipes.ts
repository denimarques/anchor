import type { SectionName } from "../sections/registry";

// Cada recipe abaixo passa pelo mesmo teste antes de entrar: "sem isso não é
// [arquétipo], é outra coisa" — não "todo cliente desse tipo vai pedir
// exatamente isso". Conteúdo que varia por negócio (produtos de um catálogo
// específico, artigos de um blog específico) nunca entra aqui — é extensão
// de projeto, composta por cima do tipo restrito exportado no fim do
// arquivo. Ver `sections/registry.ts` para o vocabulário reutilizável que
// não é default de nenhuma recipe, mas está disponível pra compor.
export const platformRecipes = {
  landing: {
    type: "scroll" as const,
    // Header/Footer são quase universais; Hero é a própria definição (sem
    // proposta de valor acima da dobra, não é landing); ContactForm entra
    // porque toda landing comercial precisa de algum jeito de capturar
    // contato — mesmo que na prática vire só um botão de CTA (WhatsApp,
    // calendário, mailto) em vez de formulário completo, o conceito
    // "capturar contato" é estrutural.
    sections: [
      "Header",
      "Hero",
      "ContactForm",
      "Footer",
    ] as const satisfies readonly SectionName[],
  },
  dashboard: {
    type: "shell" as const,
    shell: ["Sidebar", "Topbar"] as const satisfies readonly SectionName[],
    // "Dashboard" (overview ao abrir o painel) e "Settings" (config do
    // site/produto) são universais a qualquer shell autenticado, seja o
    // negócio um catálogo, um blog, um portal de notícias ou uma agência.
    // Conteúdo gerenciável (produtos, artigos, depoimentos, contatos...)
    // nunca entra aqui — varia por cliente, então é extensão de projeto.
    routes: ["Dashboard", "Settings"] as const satisfies readonly SectionName[],
  },
  saas: {
    type: "shell" as const,
    // Base genérica — todo SaaS de assinatura tem tela inicial, configuração
    // e cobrança. Rotas de domínio específicas do cliente se somam a esta
    // lista quando o PRD real existir; não substituem.
    shell: ["Sidebar", "Topbar"] as const satisfies readonly SectionName[],
    routes: ["Dashboard", "Settings", "Billing"] as const satisfies readonly SectionName[],
  },
  crm: {
    type: "shell" as const,
    // Contacts, Deals e Activities são a própria definição do que é um CRM,
    // não decisão de cliente.
    shell: ["Sidebar", "Topbar"] as const satisfies readonly SectionName[],
    routes: ["Contacts", "Deals", "Activities"] as const satisfies readonly SectionName[],
  },
  ecommerce: {
    type: "shell" as const,
    // Products (catálogo), Orders (pedidos) e Customers (clientes) são a
    // própria definição do que é um e-commerce, não decisão de um cliente
    // específico.
    //
    // Isto é o ADMIN da loja (o lojista gerencia catálogo/pedidos/clientes
    // aqui) — a loja pública que o cliente final compra é `storefront`,
    // abaixo. Um projeto de e-commerce normalmente consome as duas recipes:
    // `ecommerce` pras rotas de admin, `storefront` pro site público.
    shell: ["Sidebar", "Topbar"] as const satisfies readonly SectionName[],
    routes: ["Products", "Orders", "Customers"] as const satisfies readonly SectionName[],
  },
  storefront: {
    // Terceiro `type`, nem "scroll" (landing é 1 página) nem "shell" (admin
    // autenticado com sidebar). Loja pública: multi-página, chrome de
    // Header+Footer (não Sidebar+Topbar de admin).
    //
    // Home/Products/ProductDetail/Cart/Checkout são o mínimo estrutural de
    // qualquer storefront, físico ou digital: navegar → ver produto →
    // reunir itens → fechar compra. Incrementos específicos de cliente
    // (Wishlist, Reviews, checkout em N etapas) nunca viram default aqui —
    // ficam locais até validar contra mais de um cliente de loja.
    type: "shop" as const,
    shell: ["Header", "Footer"] as const satisfies readonly SectionName[],
    routes: [
      "Home",
      "Products",
      "ProductDetail",
      "Cart",
      "Checkout",
    ] as const satisfies readonly SectionName[],
  },
};

// "as const satisfies" preserva os literais exatos de cada recipe (não
// alarga pra SectionName inteiro) e ainda valida que cada um é um nome
// válido do registry.
export type LandingSectionName = (typeof platformRecipes)["landing"]["sections"][number];
export type DashboardRouteName = (typeof platformRecipes)["dashboard"]["routes"][number];
export type SaasRouteName = (typeof platformRecipes)["saas"]["routes"][number];
export type CrmRouteName = (typeof platformRecipes)["crm"]["routes"][number];
export type EcommerceRouteName = (typeof platformRecipes)["ecommerce"]["routes"][number];
export type StorefrontRouteName = (typeof platformRecipes)["storefront"]["routes"][number];
