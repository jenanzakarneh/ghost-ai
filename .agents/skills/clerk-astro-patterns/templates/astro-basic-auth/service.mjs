// @ts-check
import node from "@prisma/composer/node";
import { compute } from "@prisma/composer-prisma-cloud";

export default compute({
  name: "clerk-astro",
  deps: {},
  build: node({ module: import.meta.url, dir: "dist", entry: "server/entry.mjs" }),
});
