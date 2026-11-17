# This fork

A fork of [mattpocock/skills](https://github.com/mattpocock/skills). Upstream is curated to one person's daily set and takes no new skills or tracker backends ([`SCOPE.md`](./SCOPE.md)); it says to keep those in a fork, and this is that fork.

`SCOPE.md`, `CONTRIBUTING.md` and `.out-of-scope/` are upstream's policy for upstream's issue tracker. They are kept unchanged so merges stay clean, and they do not govern what this fork adds.

## What differs from upstream

| Change | Where | Why |
| --- | --- | --- |
| `personal/` bucket: `kickoff`, `dotnet-backend`, `umbraco` | [`skills/personal/`](./skills/personal/README.md) | Skills for one stack and one person's habits, which upstream's bar excludes |
| Jira and Notion issue trackers | `skills/engineering/setup-matt-pocock-skills/issue-tracker-{jira,notion}.md`, plus a few lines in its `SKILL.md` and docs page | Work repos track in Jira, personal repos in Notion; upstream ships GitHub, GitLab and local markdown only ([why](./.out-of-scope/mainstream-issue-trackers-only.md)) |
| `npm run check` and the `Check` workflow | [`scripts/check-skills.mjs`](./scripts/check-skills.mjs), `.github/workflows/check.yml` | The invariants in `CLAUDE.md` were prose only; two had already drifted |
| A "Personal stack" section in the router | `skills/engineering/ask-matt/SKILL.md` | A router that omits a reachable skill lies |

Everything else is upstream's, unmodified.

## Installing from the fork

The install commands in [`README.md`](./README.md) fetch upstream, which has none of the above. Use one of these, and only one per agent, or every skill arrives twice:

```bash
# Claude Code: the fork's own marketplace (it keeps upstream's names)
claude plugin marketplace add scottlinddk/skills
claude plugin install mattpocock-skills@mattpocock

# Any agent, as editable copies
npx skills@latest add scottlinddk/skills

# A clone of this repo, symlinked into ~/.claude/skills and ~/.agents/skills
scripts/link-skills.sh
```

The marketplace is still named `mattpocock` and the plugin `mattpocock-skills`, so the fork cannot be installed beside upstream's plugin. Renaming them would touch the manifests, the version script and the release workflow on every merge; uninstall the upstream plugin instead.

## Pulling upstream changes

```bash
git remote add upstream https://github.com/mattpocock/skills.git   # once
git fetch upstream
git merge upstream/main
npm run check
```

Expect conflicts only where the fork edits upstream's files: `README.md`, `CLAUDE.md`, `.claude-plugin/plugin.json`, `package.json`, `skills/engineering/ask-matt/SKILL.md`, and `setup-matt-pocock-skills` (its `SKILL.md` and docs page). In each, keep both sides. `npm run check` then reports anything the merge left inconsistent, including a new upstream skill that collides with a `personal/` name.

## Known gaps

- **Changelog links.** `.changeset/config.json` still names `mattpocock/skills`, so a release cut from this fork links its entries to upstream's pull request numbers. Point it at the fork before using the release workflow here.
- **`claude plugin validate . --strict`** fails on a missing plugin icon. That is upstream's state too; it needs a square PNG at `.claude-plugin/icon.png`.
- **Docs pages** publish to upstream's site, so `personal/` skills have none. Their `SKILL.md` is the documentation.
