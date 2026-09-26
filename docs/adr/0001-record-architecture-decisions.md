# 0001. Record architecture decisions

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0022 (enforcement), ADR-0024 (workflow)

## Context

This project is a take-home assignment that is evaluated partly on "your thinking: decisions documented". It is also built as if it were a real product that many engineers and coding agents will extend. Decisions that live only in someone's head, a chat log or private notes get lost, get quietly reversed, or get argued over again.

We need a lightweight, reviewable record that:

- explains _why_, not just _what_
- lives next to the code and is versioned with it
- humans and agents can find from one entry point (AGENTS.md, README)

## Decision

Use **Architecture Decision Records** in `docs/adr/`, in a lightweight format based on MADR ([template](template.md)).

- File name: `NNNN-kebab-case-title.md`, numbered in order with no gaps and never reused.
- Sections: Context, Decision, Alternatives considered, Consequences, **Enforcement**, References.
- Status: `proposed` → `accepted` → optionally `deprecated` or `superseded by NNNN`.
- `docs/adr/README.md` is the index: number, title, status, one-line summary.
- **Accepted ADRs are not rewritten.** When a decision changes, write a new ADR that supersedes the old one and update the old one's status line. Typo and link fixes are fine.

**Where a decision goes:**

| Kind of decision                                                                         | Home                                                       |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Hard to reverse, cross-cutting, or had a credible alternative a reviewer might ask about | **ADR**                                                    |
| Worth knowing but local and cheap to change (a debounce value, a page size)              | **README "Key decisions"**, plus a comment at the constant |
| Why a specific piece of code looks the way it does                                       | **Code comment** (linking the ADR if one exists)           |

If a change would contradict an ADR, stop and write the superseding ADR first, then change the code.

## Alternatives considered

- **README only.** Fine for summaries, but it gets long and loses history. The README links to ADRs instead.
- **Wiki or Notion.** Lives apart from the code, isn't versioned with it, and agents can't read it in the repo. Rejected.
- **Heavier formats** (full arc42, Y-statements with scoring). Too much ceremony for this size.
- **No formal record.** Fails the evaluation criterion and doesn't scale to a team.

## Consequences

Positive:

- Reviewers see the reasoning behind each choice and the alternatives rejected.
- New contributors and agents have a binding, discoverable rulebook.
- Reversing a decision is visible and deliberate.

Negative / accepted costs:

- It takes some writing time. We keep ADRs short, roughly one screen each.
- ADRs can go stale if the code drifts. ADR-0022's checks and the review skill guard against this.

## Enforcement

- `scripts/check-docs.ts` in CI checks that:
  - numbering has no gaps
  - every status is valid
  - every ADR is listed in the index
  - every "superseded by" target exists
  - every relative link resolves
- AGENTS.md tells agents to check whether a change affects or contradicts an ADR before committing.
- The `rn-review` skill flags decisions made in code without an ADR, README note or comment.
- The `adr-new` skill scaffolds the next ADR and its index row.

## References

- Michael Nygard, "Documenting Architecture Decisions" (2011)
- MADR: https://adr.github.io/madr/
