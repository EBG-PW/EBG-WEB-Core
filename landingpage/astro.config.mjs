import { defineConfig } from "astro/config";

import icon from "astro-icon";
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
   integrations: [icon(),
   compress({
      html: {
         removeComments: true
      }
   })
   ],
   compressHTML: true
});