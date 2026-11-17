# Issue tracker: Notion

Issues and specs for this repo live as pages in one Notion database, reached through the Notion MCP server. Tool names below are the server's own (`notion-fetch`, `notion-create-pages` and so on); your harness may prefix them.

- **Database**: `<database URL>`
- **Data source**: `<collection://... URL>` (fetch the database once with `notion-fetch` to read it, then record it here)

## Database schema

Setup creates or confirms these properties. Fetch the data source before the first write of a session and use the property names and option values it reports.

| Property | Type | Holds |
| --- | --- | --- |
| `Name` | title | The issue title |
| `ID` | unique ID | The issue's number (`<PREFIX>-12`), which is how skills and commits refer to it |
| `Status` | status | `Not started`, `In progress`, `Done` |
| `Labels` | multi-select | Triage roles and `wayfinder:*` labels |
| `Blocked by` | relation to this database | The issues that must close first |
| `Parent` | relation to this database | The parent issue, for sub-issues |
| `Assignee` | person | Who has claimed it |

## Conventions

- **Create an issue**: `notion-create-pages` with the data source as parent, `Name` and `Status: Not started` as properties, and the body as the page content. Notion renders Markdown bodies.
- **Read an issue**: `notion-fetch` on the page with discussions included, then `notion-get-comments` for the full threads.
- **Find an issue by its ID**: `notion-query-data-sources` on the data source, filtering `ID`.
- **List issues**: `notion-query-data-sources`, filtering `Status` is not `Done` plus whichever `Labels` the skill asks for.
- **Make an issue a sub-issue of a parent**: set the child's `Parent` relation.
- **Blocking**: set the child's `Blocked by` relation to each blocker. A ticket is unblocked when every related blocker has `Status: Done`.
- **Comment on an issue**: `notion-create-comment` on the page.
- **Apply / remove labels**: `notion-update-page`, writing the full new `Labels` set (read the current set first; a multi-select write replaces it).
- **Close**: comment the explanation first, then `notion-update-page` with `Status: Done`.

Write only inside this database. Pages elsewhere in the workspace are the user's notes, not issues.

## Code lives on the git host

Notion holds the issues; branches and pull requests live on the git host. Put the issue ID in the branch name and the pull request title, and paste the pull request URL into a comment on the issue, since nothing links them automatically. Pull requests are not a triage surface here.

## When a skill says "publish to the issue tracker"

Create a page in the database.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single page with **child** pages as tickets.

- **Map**: one page labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a page whose `Parent` is the map, labelled `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: see **Blocking** under Conventions.
- **Frontier query**: query the data source for pages whose `Parent` is the map, `Status` is not `Done` and `Assignee` is empty; drop any whose `Blocked by` holds a page that is not `Done`; first in map order wins.
- **Claim**: set `Assignee` to the driving dev and `Status: In progress`, the session's first write.
- **Resolve**: comment the answer, set `Status: Done`, then append a context pointer (link to the page) to the map's Decisions-so-far.
