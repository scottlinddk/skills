#!/usr/bin/env node
// Checks the repo invariants that CLAUDE.md states in prose, so a broken one
// fails CI instead of waiting for a reader to notice. Exits 1 on any failure.
//
//   node scripts/check-skills.mjs
//
// What it checks, per skill (a folder holding a SKILL.md under skills/<bucket>/):
//   - frontmatter has a `name` equal to the folder name, and a `description`
//   - agents/openai.yaml exists, and agrees with the frontmatter on invocation
//   - the bucket README links the skill's SKILL.md
//   - shipped buckets: listed in plugin.json and linked from the top-level README
//   - promoted buckets: a docs page exists at docs/<bucket>/<name>.md
//   - unshipped buckets: absent from plugin.json and the top-level README
// And repo-wide: plugin.json lists no missing skill, no skill name is used
// twice, and no tracked prose file contains an em-dash.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

// Promoted: shipped in the plugin, in the top-level README, with a docs page.
const PROMOTED = ["engineering", "productivity"];
// Shipped but undocumented: the fork owner's own bucket (see FORK.md).
const SHIPPED_ONLY = ["personal"];
const UNSHIPPED = ["misc", "in-progress", "deprecated"];
const SHIPPED = [...PROMOTED, ...SHIPPED_ONLY];

const EM_DASH = "—";
const PROSE = /\.(md|mjs|js|cjs|sh|ya?ml|json)$/;
// Text this repo does not author, plus CHANGELOG.md: its older entries predate
// the rule and are upstream history, so rewriting them would make every
// upstream merge conflict. New entries come from changesets, which are checked.
const EM_DASH_EXEMPT = new Set(["package-lock.json", "LICENSE", "CHANGELOG.md"]);

const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);
const read = (...parts) => readFileSync(join(repo, ...parts), "utf8");

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const pair = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (pair) fields[pair[1]] = pair[2].replace(/^["']|["']$/g, "");
  }
  return fields;
}

const plugin = JSON.parse(read(".claude-plugin", "plugin.json"));
const pluginSkills = new Set(plugin.skills);
const topReadme = read("README.md");
const seenNames = new Map();

const buckets = readdirSync(join(repo, "skills")).filter((entry) =>
  statSync(join(repo, "skills", entry)).isDirectory(),
);

for (const bucket of buckets) {
  if (![...SHIPPED, ...UNSHIPPED].includes(bucket)) {
    fail(`skills/${bucket}`, "unknown bucket; add it to scripts/check-skills.mjs and CLAUDE.md");
    continue;
  }

  const bucketReadmePath = join("skills", bucket, "README.md");
  const bucketReadme = existsSync(join(repo, bucketReadmePath)) ? read(bucketReadmePath) : null;
  if (bucketReadme === null) fail(bucketReadmePath, "missing bucket README");

  const skills = readdirSync(join(repo, "skills", bucket)).filter((entry) =>
    existsSync(join(repo, "skills", bucket, entry, "SKILL.md")),
  );

  for (const name of skills) {
    const dir = join("skills", bucket, name);
    const fields = frontmatter(read(dir, "SKILL.md"));

    if (!fields) {
      fail(`${dir}/SKILL.md`, "no frontmatter block");
      continue;
    }
    if (fields.name !== name) fail(`${dir}/SKILL.md`, `frontmatter name "${fields.name}" is not the folder name`);
    if (!fields.description) fail(`${dir}/SKILL.md`, "frontmatter has no description");

    if (seenNames.has(name)) fail(dir, `skill name also used by ${seenNames.get(name)}`);
    seenNames.set(name, dir);

    const userInvoked = fields["disable-model-invocation"] === "true";
    const yamlPath = join(dir, "agents", "openai.yaml");
    if (!existsSync(join(repo, yamlPath))) {
      fail(yamlPath, "missing (every skill carries one, see .agents/invocation.md)");
    } else {
      const implicitOff = /allow_implicit_invocation:\s*false/.test(read(yamlPath));
      if (userInvoked && !implicitOff) fail(yamlPath, "skill is user-invoked but allow_implicit_invocation is not false");
      if (!userInvoked && implicitOff) fail(yamlPath, "skill is model-invoked but allow_implicit_invocation is false");
    }

    if (bucketReadme !== null && !bucketReadme.includes(`(./${name}/SKILL.md)`)) {
      fail(bucketReadmePath, `no link to ./${name}/SKILL.md`);
    }

    const pluginEntry = `./skills/${bucket}/${name}`;
    const readmeLink = `(./skills/${bucket}/${name}/SKILL.md)`;
    const docsPage = join("docs", bucket, `${name}.md`);

    if (SHIPPED.includes(bucket)) {
      if (!pluginSkills.has(pluginEntry)) fail(".claude-plugin/plugin.json", `missing ${pluginEntry}`);
      if (!topReadme.includes(readmeLink)) fail("README.md", `no link to ${readmeLink}`);
    } else {
      if (pluginSkills.has(pluginEntry)) fail(".claude-plugin/plugin.json", `${pluginEntry} is in an unshipped bucket`);
      if (topReadme.includes(readmeLink)) fail("README.md", `links ${readmeLink}, which is in an unshipped bucket`);
    }

    if (PROMOTED.includes(bucket)) {
      if (!existsSync(join(repo, docsPage))) fail(docsPage, "missing docs page for a promoted skill");
    } else if (existsSync(join(repo, docsPage))) {
      fail(docsPage, "docs page for a skill outside the promoted buckets");
    }
  }
}

for (const entry of pluginSkills) {
  if (!existsSync(join(repo, entry, "SKILL.md"))) fail(".claude-plugin/plugin.json", `${entry} has no SKILL.md`);
}

const tracked = execFileSync("git", ["ls-files"], { cwd: repo, encoding: "utf8" }).split("\n").filter(Boolean);
for (const file of tracked) {
  if (!PROSE.test(file) || EM_DASH_EXEMPT.has(file) || !existsSync(join(repo, file))) continue;
  read(file)
    .split("\n")
    .forEach((line, index) => {
      if (line.includes(EM_DASH)) fail(`${file}:${index + 1}`, "em-dash (rewrite the sentence, see CLAUDE.md)");
    });
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`\n${failures.length} problem(s).`);
  process.exit(1);
}

console.log(`${seenNames.size} skills checked, no problems.`);
