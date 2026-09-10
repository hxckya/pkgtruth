# pkgtruth — Claude Code plugin

Installs two things at once:

- the **pkgtruth MCP server** (`check_package`, `check_dependencies`,
  `check_install_command`), so the agent can ask before it adds a dependency;
- a **PreToolUse hook** on `Bash` that denies `npm install`, `npx`, `pnpm add`,
  `yarn add`, `bun add`, `pip install`, `uv add`, `poetry add` and similar when
  a package they name is hallucinated or dangerous — whether or not the agent
  thought to ask.

```
/plugin marketplace add hxckya/pkgtruth
/plugin install pkgtruth@pkgtruth
```

Both run `npx -y pkgtruth@<version>`; Node.js 20+ is the only requirement.
Non-install commands pass through in about 0.2 s with no network call. The
plugin version tracks the npm release it pins; see the
[repository README](https://github.com/hxckya/pkgtruth#readme) for what is
checked and why.
