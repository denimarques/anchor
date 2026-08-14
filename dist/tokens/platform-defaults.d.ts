import type { Tokens } from "./schema";
export type Platform = "landing" | "dashboard" | "saas" | "crm" | "ecommerce" | "storefront" | "news";
export declare const platformDefaults: Record<Platform, Partial<Tokens>>;
