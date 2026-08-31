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
    rules: {
      /*
       * An underscore prefix marks a parameter that exists to document the
       * call signature rather than to be used — several of PixelBot's
       * context helpers take arguments that document the call site
       * without the provider itself needing them.
       */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  /*
   * PixelBot's module boundary.
   *
   * The mascot, the InScreen annotations, the InChat sidebar, the prompt and
   * the API route are one feature, and everything outside it imports from
   * `@/components/pixel` — never from a file inside. Deep imports are how a
   * module quietly grows a second, undocumented public surface, and this
   * feature is specifically meant to have exactly one.
   *
   * `ignores` lists the module's own directories: inside it, the files import
   * from each other normally.
   *
   * See `components/pixel/AGENTS.md`.
   */
  {
    files: ["**/*.{ts,tsx,mjs}"],
    ignores: ["components/pixel/**", "lib/pixel/**", "app/api/pixel/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              /*
               * Everything under the module except its two entry points:
               * `@/components/pixel` (client-safe) and
               * `@/components/pixel/server`. A `group` glob can't express the
               * exception — a leading `!` is read as another pattern to match,
               * not as a carve-out — so this is a regex with a lookahead.
               */
              regex: "^@/(components|lib)/pixel/(?!server$).+",
              message:
                "PixelBot has one public surface: import from '@/components/pixel' (or '@/components/pixel/server' in a server component). If it doesn't export what you need, that's a request in docs/PIXELBOT_BUILD.md — not a deep import. See components/pixel/AGENTS.md.",
            },
          ],
        },
      ],
    },
  },
  // globalIgnores REPLACES eslint-config-next's defaults rather than adding to
  // them, so the defaults have to be repeated here alongside our own.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Pulled in via the shadcn CLI from the Bklit UI registry (see
    // `components.json`). Not hand-authored, re-pullable with `shadcn add`, and
    // not linted against this project's stricter hook rules upstream — fix at
    // the source, not here.
    "components/charts/**",
  ]),
]);

export default eslintConfig;
