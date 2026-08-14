import type { Tokens } from "./schema";
export type Platform = "landing" | "dashboard" | "saas" | "crm" | "ecommerce" | "storefront";
export declare const platformDefaults: Record<Platform, Partial<Tokens>>;
