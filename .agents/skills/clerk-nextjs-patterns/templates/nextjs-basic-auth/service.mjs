// @ts-check
import nextjs from "@prisma/composer/nextjs";
import { compute } from "@prisma/composer-prisma-cloud";

export default compute({
  name: "clerk-nextjs",
  deps: {},
  build: nextjs({ module: import.meta.url, appDir: "." }),
});
