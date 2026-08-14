"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformRecipes = void 0;
// Cada recipe abaixo passa pelo mesmo teste antes de entrar: "sem isso não é
// [arquétipo], é outra coisa" — não "todo cliente desse tipo vai pedir
// exatamente isso". Conteúdo que varia por negócio (produtos de um catálogo
// específico, artigos de um blog específico) nunca entra aqui — é extensão
// de projeto, composta por cima do tipo restrito exportado no fim do
// arquivo. Ver `sections/registry.ts` para o vocabulário reutilizável que
// não é default de nenhuma recipe, mas está disponível pra compor.
exports.platformRecipes = {
    landing: {
        type: "scroll",
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
        ],
    },
    dashboard: {
        type: "shell",
        shell: ["Sidebar", "Topbar"],
        // "Dashboard" (overview ao abrir o painel) e "Settings" (config do
        // site/produto) são universais a qualquer shell autenticado, seja o
        // negócio um catálogo, um blog, um portal de notícias ou uma agência.
        // Conteúdo gerenciável (produtos, artigos, depoimentos, contatos...)
        // nunca entra aqui — varia por cliente, então é extensão de projeto.
        routes: ["Dashboard", "Settings"],
    },
    saas: {
        type: "shell",
        // Base genérica — todo SaaS de assinatura tem tela inicial, configuração
        // e cobrança. Rotas de domínio específicas do cliente se somam a esta
        // lista quando o PRD real existir; não substituem.
        shell: ["Sidebar", "Topbar"],
        routes: ["Dashboard", "Settings", "Billing"],
    },
    crm: {
        type: "shell",
        // Contacts, Deals e Activities são a própria definição do que é um CRM,
        // não decisão de cliente.
        shell: ["Sidebar", "Topbar"],
        routes: ["Contacts", "Deals", "Activities"],
    },
    ecommerce: {
        type: "shell",
        // Products (catálogo), Orders (pedidos) e Customers (clientes) são a
        // própria definição do que é um e-commerce, não decisão de um cliente
        // específico.
        //
        // Isto é o ADMIN da loja (o lojista gerencia catálogo/pedidos/clientes
        // aqui) — a loja pública que o cliente final compra é `storefront`,
        // abaixo. Um projeto de e-commerce normalmente consome as duas recipes:
        // `ecommerce` pras rotas de admin, `storefront` pro site público.
        shell: ["Sidebar", "Topbar"],
        routes: ["Products", "Orders", "Customers"],
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
        type: "shop",
        shell: ["Header", "Footer"],
        routes: [
            "Home",
            "Products",
            "ProductDetail",
            "Cart",
            "Checkout",
        ],
    },
};
