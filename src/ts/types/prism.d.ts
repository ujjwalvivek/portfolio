// The part of Prism (prismjs 1.30.0, vendored at /vendor/prism@1.30.0-esm-1/ by scripts/vendor.mjs and wrapped as ES modules) that
// src/ts/features/navigator-highlight.ts calls. Hand-written from Prism's own docs, trimmed to tokenize.

export type Grammar = Record<string, unknown>;

export interface Token {
  type: string;
  content: TokenStream;
  alias?: string | string[];
  length: number;
}

export type TokenStream = string | Token | (string | Token)[];

export interface Prism {
  languages: Record<string, Grammar | undefined>;
  tokenize(text: string, grammar: Grammar): (string | Token)[];
  manual?: boolean;
}

// /vendor/prism@1.30.0-esm-1/core.js
export type PrismCore = { default: Prism };
// /vendor/prism@1.30.0-esm-1/<lang>.js: installs the grammar into the Prism it is given
export type PrismGrammar = { default: (prism: Prism) => void };
