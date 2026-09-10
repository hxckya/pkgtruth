/**
 * The ways a model garbles a PyPI project name, each grounded in a real
 * confusable: sklearn/scikit-learn, pytorch/torch, beautifulsoup/beautifulsoup4,
 * python-dateutils/python-dateutil, requestss/requests.
 *
 * Names are PEP 503-normalised before comparison so `typing_extensions` is
 * never proposed as a garbling of `typing-extensions` — they are the same
 * project. `known` is the set of famous names; a mutation that lands on one
 * of them is dropped, because the point is to find impostors.
 */

const norm = (s) => String(s).trim().toLowerCase().replace(/[-_.]+/g, '-');

export function mutations(name, known = new Set()) {
  const n = norm(name);
  const knownNorm = new Set([...known].map(norm));
  const out = new Set();

  // decoration models add or drop
  if (!n.startsWith('python-') && !n.startsWith('py')) { out.add(`python-${n}`); out.add(`py${n}`); out.add(`py-${n}`); }
  if (n.startsWith('python-')) out.add(n.slice(7));                   // python-dateutil -> dateutil
  if (n.startsWith('py') && n.length > 4 && !n.startsWith('py-')) out.add(n.slice(2)); // pyyaml -> yaml
  out.add(`${n}-python`); out.add(`${n}-py`);

  // the "2/3/4" suffix confusion and its inverse
  if (/\d$/.test(n)) out.add(n.replace(/\d+$/, ''));               // beautifulsoup4 -> beautifulsoup
  else { out.add(`${n}2`); out.add(`${n}3`); }

  // pluralisation and the doubled last letter
  if (!n.endsWith('s')) out.add(`${n}s`);                            // requests -> requestss? (inverse below)
  if (n.endsWith('s')) out.add(n.slice(0, -1));                      // requests -> request
  out.add(n + n.slice(-1));                                          // requests -> requestss

  // hyphen dropped / import name instead of dist name
  if (n.includes('-')) { out.add(n.replace(/-/g, '')); }             // scikit-learn -> scikitlearn
  const IMPORT_NAMES = { 'scikit-learn': 'sklearn', 'beautifulsoup4': 'bs4', 'pillow': 'pil', 'opencv-python': 'cv2', 'pyyaml': 'yaml', 'python-dateutil': 'dateutil', 'torch': 'pytorch', 'tensorflow': 'tf' };
  if (IMPORT_NAMES[n]) out.add(IMPORT_NAMES[n]);

  out.delete(n);
  for (const k of knownNorm) out.delete(k);
  return [...out].filter((c) => /^[a-z0-9][a-z0-9-]*$/.test(c) && c.length > 2);
}
