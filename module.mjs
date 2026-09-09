// @ts-check
import { module } from "@prisma/composer";
import ghostAiService from "./service.mjs";
import clerkAstroService from "./.agents/skills/clerk-astro-patterns/templates/astro-basic-auth/service.mjs";
import clerkNextjsService from "./.agents/skills/clerk-nextjs-patterns/templates/nextjs-basic-auth/service.mjs";
import nuxtBasicAuthService from "./.agents/skills/clerk-nuxt-patterns/templates/nuxt-basic-auth/service.mjs";
import clerkTanstackStartService from "./.agents/skills/clerk-tanstack-patterns/templates/tanstack-basic-auth/service.mjs";

export default module("ghost-ai", ({ provision }) => {
  provision(ghostAiService, { id: "ghostai" });
  provision(clerkAstroService, { id: "clerkastro" });
  provision(clerkNextjsService, { id: "clerknextjs" });
  provision(nuxtBasicAuthService, { id: "nuxtbasicauth" });
  provision(clerkTanstackStartService, { id: "clerktanstackstart" });
});
