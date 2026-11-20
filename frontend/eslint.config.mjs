import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      // Netlify's adapter writes a full copy of the built client into .netlify/static;
      // linting it reports thousands of errors in minified output we do not own.
      ".netlify/**",
      // Edge functions are bundled by Netlify against its own Deno-style types.
      "netlify/**",
      ".scratch/**",
      "vibe_images/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
