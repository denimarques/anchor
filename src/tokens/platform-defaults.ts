import type { Tokens } from "./schema";

export type Platform = "landing" | "dashboard" | "saas" | "crm" | "ecommerce" | "storefront";

export const platformDefaults: Record<Platform, Partial<Tokens>> = {
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
