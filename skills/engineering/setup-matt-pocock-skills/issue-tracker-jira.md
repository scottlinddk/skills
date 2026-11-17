# Issue tracker: Jira

Issues and specs for this repo live as Jira work items in project **`<PROJECT-KEY>`** on `<site>.atlassian.net`. Use Atlassian's [`acli`](https://developer.atlassian.com/cloud/acli/) for all operations. Sign in once with `acli jira auth login`.

Jira calls an issue a "work item" and identifies it by key (`<PROJECT-KEY>-123`).

## Workflow statuses

Jira closes by status, and status names belong to the project's workflow. Record this project's names here:

- **Open**: `To Do`
- **In progress**: `In Progress`
- **Closed**: `Done`

## Conventions

- **Create an issue**: `acli jira workitem create --project <PROJECT-KEY> --type Task --summary "..." --description-file <file> --json`. Write the body to a file first; `--json` returns the new key.
- **Body format**: `acli` takes plain text or Atlassian Document Format, and Jira shows Markdown syntax literally. Write bodies as plain text with blank-line paragraphs and `-` lists, or as ADF JSON when headings and code blocks matter.
- **Read an issue**: `acli jira workitem view <KEY> --fields "*all" --json`, and `acli jira workitem comment list --key <KEY> --json` for its comments.
- **List issues**: `acli jira workitem search --jql 'project = <PROJECT-KEY> AND statusCategory != Done' --fields "key,summary,status,labels,assignee" --json --paginate`. Filter by label with `AND labels = "<label>"`.
- **Make an issue a child of a parent**: `--parent <PARENT-KEY>` on create. The parent's work item type must sit one level above the child's in the project's hierarchy (an Epic over a Task, a Task over a Sub-task).
- **Blocking**: Jira's native **Blocks** link. `acli jira workitem link create --out <BLOCKER-KEY> --in <BLOCKED-KEY> --type Blocks --yes`. After the first link in a session, open the blocked item (`acli jira workitem view <BLOCKED-KEY> --web`) and confirm it reads "is blocked by" the blocker; if it reads the other way round, swap `--out` and `--in` and note the correct order here. A ticket is unblocked when every blocker is in a Done-category status.
- **Open blockers of a ticket**: `acli jira workitem search --jql 'issue in linkedIssues("<KEY>", "is blocked by") AND statusCategory != Done' --json`. An empty result means startable.
- **Comment on an issue**: `acli jira workitem comment create --key <KEY> --body "..."`, or `--body-file <file>` for long text.
- **Apply / remove labels**: `acli jira workitem edit --key <KEY> --labels "<label>" --yes` / `--remove-labels "<label>" --yes`. Jira labels cannot contain spaces.
- **Close**: comment the explanation first, then `acli jira workitem transition --key <KEY> --status "Done" --yes`.

Flags move between `acli` releases. When a command is rejected, run it with `--help` and trust that over this file, then correct this file.

## Code lives on the git host

Jira holds the issues; branches and merge requests live on the git host. Put the work item key in the branch name and at the start of the merge request title (`<PROJECT-KEY>-123: ...`) so the two link up. Merge requests are not a triage surface here.

## When a skill says "publish to the issue tracker"

Create a Jira work item in `<PROJECT-KEY>`.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single work item with **child** work items as tickets.

- **Map**: one work item labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. Use a type that can have children, normally an Epic.
- **Child ticket**: a work item created with `--parent <MAP-KEY>` and a label `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: see **Blocking** under Conventions.
- **Frontier query**: `acli jira workitem search --jql 'parent = <MAP-KEY> AND statusCategory != Done AND assignee IS EMPTY ORDER BY created ASC' --json`, then drop any with an open blocker (see **Open blockers of a ticket**); first in map order wins.
- **Claim**: `acli jira workitem edit --key <KEY> --assignee @me --yes`, the session's first write.
- **Resolve**: comment the answer, transition to the Closed status, then append a context pointer (link to the work item) to the map's Decisions-so-far.
