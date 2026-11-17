---
name: kickoff
description: "Start a brand-new project: the brief in English, a context sheet, and an agreed modular file tree, all before any code."
disable-model-invocation: true
---

A kickoff produces three artifacts in order: a **brief**, a **context sheet**, and a **file tree**. Code starts after the user approves the tree; until then every reply is prose, a table, or a tree.

## 1. Brief

Restate the project description in English, in five sentences or fewer. Where the source is in another language, translate it, and keep each domain term's original beside its translation in parentheses on first use, so the user's own vocabulary survives.

Done when the user confirms the brief says what they meant.

## 2. Context sheet

Fill every field. Find facts by looking (the directory, the remote, connected tools, the user's notes) and mark each entry **verified** (you read the source) or **inferred** (you concluded it).

| Field | Holds |
| --- | --- |
| **Goal** | The outcome, and who it is for |
| **Context** | Stack, where it runs, what is mounted or connected |
| **Constraints** | Deadlines, budget, and sensitivity: credentials, customer or trading data, an employer's IP |
| **Known vs unknown** | What is settled, what is open |
| **Output** | Format and depth; exploring or a deliverable |
| **How to proceed** | The next three steps |

Where the brief names no stack, propose the user's usual one as an inferred entry: React and TypeScript with TanStack Query and React Router on the front, C#/.NET behind it.

Sort every open choice by what it costs to reverse:

- **Cheap to reverse**: pick a sensible default and list it under an `Assumptions` heading.
- **Expensive or irreversible** (hosting, data model, auth, licence, anything touching sensitive data): ask, all of them in one batch.

Done when every field is filled, every entry is marked, and the one batch of questions is answered.

## 3. File tree

Propose a modular tree for the project. Logic, styling and components each get their own home, and each folder gets one line naming what it owns and what may import it. Give the reason for any folder a reader would not expect.

Done when the user approves the tree. Revise and re-show it until they do.

## 4. Hand over

Write the brief, the context sheet and the approved tree to `docs/kickoff.md`. Then tell the user the next step, which is theirs to type:

- `/setup-matt-pocock-skills`, once, so the engineering skills know the issue tracker.
- `/grill-with-docs` when the project fits in one session, or `/wayfinder` when the way to the destination is still foggy.
