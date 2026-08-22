import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Flat config for the ESLint CLI. `next lint` was removed in Next 16 and
 * `next build` no longer lints, so `npm run lint` is the only thing that runs
 * these rules — it is not wired into the build.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    settings: {
      /*
       * eslint-config-next ships `version: 'detect'`, and eslint-plugin-react's
       * detection path calls `context.getFilename()`, which ESLint 10 removed —
       * it crashes the whole run with "contextOrFilename.getFilename is not a
       * function". Naming the version skips detection entirely. Remove this once
       * eslint-plugin-react supports ESLint 10; keep it in step with the React
       * version in package.json until then.
       */
      react: { version: "19.0" },
    },
  },
  // globalIgnores REPLACES eslint-config-next's defaults rather than adding to
  // them, so the defaults have to be repeated here alongside our own.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Pulled in via the shadcn CLI from Bklit UI / React Bits. Not hand-authored,
    // re-pullable with `shadcn add`, and not linted against this project's
    // stricter hook rules upstream — fix at the source, not here.
    "components/charts/**",
    "components/Aurora.tsx",
  ]),
]);

export default eslintConfig;
