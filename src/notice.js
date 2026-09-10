/**
 * Reading deprecation notices.
 *
 * Maintainers phrase "this is not the package you want" in a small number of
 * ways, and the name they point at is the strongest evidence a gate can have
 * that installs of this name belong elsewhere. Parsing is deliberately
 * generous: a wrong guess is harmless downstream, because every consumer
 * requires the parsed name to equal a known popular package before acting.
 */

// A package name — never a pronoun or determiner ("use that package instead").
const NAME = String.raw`(?!(?:that|this|it|the|them|these|those|one|a|an)\b)(@?[A-Za-z0-9][A-Za-z0-9_.\/-]*)`;
const Q = String.raw`[\x60'"]?`;

const PATTERNS = [
  // use `X` instead · use X or Y instead · use the X package instead · please use 'X'
  new RegExp(String.raw`\b(?:use|install|switch to|migrate to|see|try)\s+(?:the\s+)?${Q}${NAME}${Q}(?:\s+or\s+${Q}[A-Za-z0-9@_.\/-]+${Q})?(?:\s+package)?\s+instead\b`, 'i'),
  new RegExp(String.raw`\b(?:please\s+)?use\s+${Q}${NAME}${Q}\s*[.!]?\s*$`, 'im'),
  new RegExp(String.raw`\bin\s+favou?r\s+of\s+${Q}${NAME}${Q}`, 'i'),
  new RegExp(String.raw`\b(?:has\s+been\s+)?(?:renamed|moved)\s+to\s+${Q}${NAME}${Q}`, 'i'),
  new RegExp(String.raw`\b(?:replaced|superseded)\s+by\s+${Q}${NAME}${Q}`, 'i'),
  new RegExp(String.raw`\btyposquat(?:ting)?\s+(?:on|of)\s+(?:the\s+)?(?:popular\s+)?${Q}${NAME}${Q}(?:\s+package)?`, 'i'),
  new RegExp(String.raw`\b(?:named\s+for|package\s+(?:you\s+want|you\s+are\s+looking\s+for|is\s+called)|is\s+now)\s+[^.\n]{0,40}?${Q}${NAME}${Q}\s*[.!]?\s*$`, 'im'),
];

/** The package a notice tells you to use instead, if it names one. */
export function pointsToFrom(text) {
  if (!text) return null;
  const t = String(text);
  for (const re of PATTERNS) {
    const m = t.match(re);
    if (m && m[1]) return m[1].replace(/[.,;:]+$/, '');
  }
  return null;
}

/**
 * Does prose read as a deprecation of the *package*? Used where the registry
 * has no deprecation flag (PyPI). Bare "renamed to" and "replaced by" are not
 * enough on their own — libraries rename classes all the time.
 */
export const DEPRECATION_CUE = /\b(?:deprecated|no longer (?:maintained|supported)|unmaintained|use\s+[\x60'"]?[A-Za-z0-9@_.\/-]+[\x60'"]?(?:\s+or\s+[\x60'"]?[A-Za-z0-9@_.\/-]+[\x60'"]?)?(?:\s+package)?\s+instead|you tried to install|the package (?:named|you (?:want|are looking for))|this package is a (?:placeholder|stub|dummy)|package (?:has been |was )?(?:renamed|moved)|typosquat|in favou?r of)/i;
