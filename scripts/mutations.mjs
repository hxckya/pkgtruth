/**
 * The ways a model garbles a package name, each grounded in a real incident:
 * types-node, socket-io, crossenv, unused-imports.
 *
 * `known` is the set of famous names; a mutation that lands on one of them is
 * dropped, because the point is to find impostors, not to flag the original.
 */
export function mutations(name, known = new Set()) {
  const out = new Set();
  const core = name.replace(/^@[^/]+\//, '');
  if (name.startsWith('@')) {
    const scope = name.slice(1, name.indexOf('/'));
    out.add(`${scope}-${core}`);          // @types/node   -> types-node
    out.add(`${scope}${core}`);           // @types/node   -> typesnode
    out.add(core);                        // @babel/core   -> core  (filtered if famous)
    out.add(`${core}-${scope}`);          // @types/node   -> node-types
  } else {
    if (name.includes('.')) {
      out.add(name.replace(/\./g, '-'));  // socket.io     -> socket-io
      out.add(name.replace(/\./g, ''));   // socket.io     -> socketio
    }
    if (name.includes('-')) {
      out.add(name.replace(/-/g, ''));    // cross-env     -> crossenv
      out.add(name.replace(/-/g, '.'));   // cross-env     -> cross.env
      out.add(name.replace(/-/g, '_'));   // cross-env     -> cross_env
    }
    const m = name.match(/^(eslint-plugin|babel-plugin|eslint-config)-(.+)$/);
    if (m) {
      out.add(m[2]);                      // eslint-plugin-unused-imports -> unused-imports
      out.add(`${m[1].split('-')[0]}-${m[2]}`); // -> eslint-unused-imports
    }
    if (!/[-.]/.test(name)) {
      out.add(`${name}js`);               // react -> reactjs
      out.add(`${name}-js`);              // react -> react-js
      out.add(`node-${name}`);            // fetch -> node-fetch (filtered if famous)
    }
  }
  out.delete(name);
  for (const k of known) out.delete(k);
  return [...out].filter((n) => /^[a-z0-9][a-z0-9._-]*$/.test(n) && n.length > 2);
}
