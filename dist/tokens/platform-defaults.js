"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformDefaults = void 0;
exports.platformDefaults = {
    landing: {
        radiusButton: "9999px",
        radiusCard: "16px",
        fontHeading: "Poppins",
        fontBody: "Inter",
    },
    dashboard: {
        radiusButton: "6px",
        radiusCard: "8px",
        colorAccent: "#185FA5",
        fontHeading: "Inter",
        fontBody: "Inter",
    },
    saas: {
        radiusButton: "8px",
        radiusCard: "10px",
        colorAccent: "#185FA5",
        fontHeading: "Inter",
        fontBody: "Inter",
    },
    crm: {
        radiusButton: "8px",
        radiusCard: "10px",
        colorAccent: "#185FA5",
        fontHeading: "Inter",
        fontBody: "Inter",
    },
    ecommerce: {
        // Mesma "cara" de admin shell dos outros arquétipos — visual de admin é
        // genuinamente compartilhável entre eles; o que muda é routes, não estilo.
        radiusButton: "8px",
        radiusCard: "10px",
        colorAccent: "#185FA5",
        fontHeading: "Inter",
        fontBody: "Inter",
    },
    storefront: {
        // Mesma família visual da landing, não da admin: é o que o cliente final
        // vê e compra, não o painel que o lojista usa.
        radiusButton: "9999px",
        radiusCard: "16px",
        fontHeading: "Poppins",
        fontBody: "Inter",
    },
};
