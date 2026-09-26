---
name: adr-new
description: Scaffold a new Architecture Decision Record for RepoScout. Use when a decision is hard to reverse, cross-cutting, or had a credible alternative; when a change would contradict an existing ADR (write a superseding one); or when the user asks to record a decision.
---

# adr-new

Creates the next ADR in `docs/adr/` following ADR-0001. ADRs are binding; accepted ones aren't rewritten. A change of mind gets a new ADR that supersedes the old one.

## First: does this need an ADR at all? (ADR-0001)

| Decision                                                                                 | Home                                               |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Hard to reverse, cross-cutting, or had a credible alternative a reviewer would ask about | **ADR**                                            |
| Worth knowing, but local and cheap to change (a timeout, a page size)                    | README "Key decisions" + a comment at the constant |
| Why a specific piece of code looks the way it does                                       | Code comment (link the ADR if one exists)          |

Also check whether an existing ADR already covers the topic. If it does, and the change _extends_ it rather than reversing it, propose adding a section to that ADR instead of creating a new one.

## Steps

1. **Next number:** list `docs/adr/[0-9][0-9][0-9][0-9]-*.md` and take the highest number + 1 (4 digits, no gaps).
2. **File:** `docs/adr/NNNN-kebab-case-title.md`, copied from `docs/adr/template.md`.
3. **Fill every section:**
   - **Context:** forces and constraints, with dates on facts that can change ("checked YYYY-MM-DD").
   - **Decision:** imperative, including the rules someone must follow.
   - **Alternatives considered:** each with a why-not.
   - **Consequences:** positive and negative/accepted costs.
   - **Enforcement:** the lint rule, script, test or CI step that checks it, or "convention only".
   - **References.**
   - Keep it to about one screen.
4. **Status:** `proposed` while under discussion, `accepted` once the owner agrees.
5. **Superseding:** in the _old_ ADR, change only the status line to `superseded by [NNNN](NNNN-title.md)`. Don't rewrite its content.
6. **Index:** add a row to `docs/adr/README.md` (`| [NNNN](NNNN-title.md) | Title | status |`).
7. **Discoverability:** if the ADR covers a new area, add it to the "Area → ADR" table in `AGENTS.md`. If it changes a hard rule, update that rule there too.
8. **Verify:** `yarn check:docs` must pass (contiguous numbering, valid status, index entry, links).

Don't commit. Hand the change to the owner with a suggested message, e.g. `docs(adr): add ADR-NNNN <title>`.
