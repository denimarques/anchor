export declare const platformRecipes: {
    landing: {
        type: "scroll";
        sections: readonly ["Header", "Hero", "ContactForm", "Footer"];
    };
    dashboard: {
        type: "shell";
        shell: readonly ["Sidebar", "Topbar"];
        routes: readonly ["Dashboard", "Settings"];
    };
    saas: {
        type: "shell";
        shell: readonly ["Sidebar", "Topbar"];
        routes: readonly ["Dashboard", "Settings", "Billing"];
    };
    crm: {
        type: "shell";
        shell: readonly ["Sidebar", "Topbar"];
        routes: readonly ["Contacts", "Deals", "Activities"];
    };
    ecommerce: {
        type: "shell";
        shell: readonly ["Sidebar", "Topbar"];
        routes: readonly ["Products", "Orders", "Customers"];
    };
    storefront: {
        type: "shop";
        shell: readonly ["Header", "Footer"];
        routes: readonly ["Home", "Products", "ProductDetail", "Cart", "Checkout"];
    };
};
export type LandingSectionName = (typeof platformRecipes)["landing"]["sections"][number];
export type DashboardRouteName = (typeof platformRecipes)["dashboard"]["routes"][number];
export type SaasRouteName = (typeof platformRecipes)["saas"]["routes"][number];
export type CrmRouteName = (typeof platformRecipes)["crm"]["routes"][number];
export type EcommerceRouteName = (typeof platformRecipes)["ecommerce"]["routes"][number];
export type StorefrontRouteName = (typeof platformRecipes)["storefront"]["routes"][number];
