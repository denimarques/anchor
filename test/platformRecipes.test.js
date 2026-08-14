"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { platformRecipes, sectionNames } = require("../dist");

test("dashboard.routes contém só o que é universal a qualquer negócio (Dashboard, Settings) — não conteúdo de domínio", () => {
  assert.deepEqual([...platformRecipes.dashboard.routes], [
    "Dashboard",
    "Settings",
  ]);
});

test("saas.routes e crm.routes são a própria definição do arquétipo", () => {
  assert.deepEqual([...platformRecipes.saas.routes], [
    "Dashboard",
    "Settings",
    "Billing",
  ]);
  assert.deepEqual([...platformRecipes.crm.routes], [
    "Contacts",
    "Deals",
    "Activities",
  ]);
});

test("ecommerce.routes é a própria definição do arquétipo (Products, Orders, Customers), não conteúdo de um cliente", () => {
  assert.deepEqual([...platformRecipes.ecommerce.routes], [
    "Products",
    "Orders",
    "Customers",
  ]);
});

test("storefront: type próprio ('shop'), shell público (Header/Footer, não Sidebar/Topbar de admin), e rotas mínimas de qualquer loja", () => {
  assert.equal(platformRecipes.storefront.type, "shop");
  assert.deepEqual([...platformRecipes.storefront.shell], ["Header", "Footer"]);
  assert.deepEqual([...platformRecipes.storefront.routes], [
    "Home",
    "Products",
    "ProductDetail",
    "Cart",
    "Checkout",
  ]);
});

test("vocabulário reutilizável (About, ProductGrid, Products, Testimonials, Promotions, Contacts, Deals, Activities) está disponível no registry, mesmo sem ser default de nenhuma recipe", () => {
  const reusableVocabulary = [
    "About",
    "ProductGrid",
    "Products",
    "Testimonials",
    "Promotions",
    "Contacts",
    "Deals",
    "Activities",
  ];
  for (const name of reusableVocabulary) {
    assert.ok(
      sectionNames.includes(name),
      `esperava "${name}" no sectionNames como vocabulário reutilizável`
    );
  }
});

test("landing.sections contém só o que é universal a qualquer landing page (Header, Hero, ContactForm, Footer) — não conteúdo de domínio", () => {
  assert.deepEqual([...platformRecipes.landing.sections], [
    "Header",
    "Hero",
    "ContactForm",
    "Footer",
  ]);
});
