"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sectionNames = void 0;
// Só os NOMES ficam no pacote — o componente React de cada seção é implementado
// dentro do repo do cliente (components/sections/*.tsx), porque visual muda mais
// rápido que regra, e você não quer publicar uma versão nova do core-kit toda
// vez que ajusta o CSS de um botão.
//
// Todo identificador é em inglês, mesmo em rotas de admin cujo conteúdo
// final é em português — o nome de registro é identificador técnico, não
// copy.
//
// Duas categorias de nome nesta lista, não confundir:
//
//   1) ESTRUTURAIS (universais ao arquétipo, viram default de recipe):
//      Header, Hero, ContactForm, Footer, Sidebar, Topbar, Dashboard,
//      Settings, Billing, Contacts, Deals, Activities, Orders, Customers,
//      Home, ProductDetail, Cart, Checkout, Article, Category. Testados
//      contra "é a própria definição do arquétipo, ou é conteúdo que varia
//      por negócio?".
//      "Products" está nesta categoria E na 2: é estrutural pro admin de
//      ecommerce e pro storefront público (catálogo é a própria definição
//      de loja), mas continua vocabulário opcional pro dashboard genérico.
//      "Home" está estrutural pro storefront E pro news — página inicial é
//      a própria definição de site multi-página público, seja loja ou
//      portal.
//
//   2) VOCABULÁRIO REUTILIZÁVEL (útil a VÁRIOS clientes de um mesmo tipo de
//      negócio — catálogo, e-commerce, portfólio, portal de notícia — mas
//      não a QUALQUER landing/dashboard/publication, então não é default de
//      nenhuma recipe): About, ProductGrid, Products, Promotions,
//      Testimonials, Search, Author, Newsletter, Comments.
//      Ficam aqui pra dar nome padronizado quando mais de um cliente
//      precisar do mesmo conceito — mas cada projeto escolhe/compõe as que
//      usa, a recipe do arquétipo não impõe nenhuma delas:
//
//        type ClientLandingSection = LandingSectionName | "About" | "ProductGrid" | "Promotions" | "Testimonials";
//        type ClientDashboardRoute = DashboardRouteName | "Products" | "Testimonials" | "Promotions";
//        type ClientNewsRoute = NewsRouteName | "Search" | "Author" | "Newsletter" | "Comments";
//
//      Nem todo portal de notícia libera comentários, por exemplo — daí
//      "Comments" ser vocabulário opcional, não estrutural: um portal sem
//      comentários continua sendo, inequivocamente, um portal de notícia.
//
//      Se uma seção/rota é conceito novo que não existe ainda aqui nem serve
//      a mais de um cliente, ela nem entra neste arquivo — fica só local, no
//      repo do cliente (regra de ouro do README: se serve só a um cliente,
//      não sobe pro anchor).
exports.sectionNames = [
    "Header",
    "Hero",
    "About",
    "ProductGrid",
    "Promotions",
    "Testimonials",
    "ContactForm",
    "Footer",
    "Sidebar",
    "Topbar",
    "Products",
    "Dashboard",
    "Settings",
    "Billing",
    "Contacts",
    "Deals",
    "Activities",
    "Orders",
    "Customers",
    "Home",
    "ProductDetail",
    "Cart",
    "Checkout",
    "Article",
    "Category",
    "Search",
    "Author",
    "Newsletter",
    "Comments",
];
