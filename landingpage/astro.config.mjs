import { defineConfig } from "astro/config";
import icon from "astro-icon";
import compress from "astro-compress";

import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), compress({
    html: {
      removeComments: true
    }
  }), preact({ compat: true })],
  compressHTML: true,
});