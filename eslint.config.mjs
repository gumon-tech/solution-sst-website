import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

// eslint-config-next still ships eslintrc-style configs only (no flat entry as
// of 15.5), so FlatCompat translates them.
const eslintConfig = [
  {
    // `next lint` skipped these implicitly. Flat config has no such default,
    // so linting would otherwise walk the build output.
    ignores: [".claude/**", "node_modules/**", ".next/**", ".next-*/**", "out/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
