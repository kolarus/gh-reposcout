# How this was built

RepoScout was built in phases, each one closed by checks, with every decision written down before the code. It was built with an AI pair programmer (Claude Code); the owner made the decisions, reviewed every phase and made every commit.

## The loop

1. **Plan.** The brief became a plan of seven phases (0–6), each with its own exit checks. The plan itself stayed private; what it decided is public, in the ADRs and this repository.
2. **Decide before coding.** Every decision that is hard to reverse, affects the whole app, or had a real alternative is an [Architecture Decision Record](adr/README.md). They're binding: changing one means writing a new ADR that supersedes it.
3. **Enforce with tooling.** Layer boundaries, strict TypeScript, confined APIs (`fetch`, storage, icons), architecture, documentation and version checks, unused-code detection and the tests all run in `yarn validate`, before every push and in CI ([ADR-0022](adr/0022-architecture-enforcement.md)). What tooling can't check is a checklist: the `rn-review` skill.
4. **Close each phase with evidence.** An automated gate (tests, end-to-end flows, measurements) and a manual one, where the owner used the app. A phase isn't done while a check is red.
5. **Review the backlog.** At the end of Phase 5, everything deliberately left out was weighed again: one item was picked and built, and the rest is in the README under "What I'd improve", each with its reason.

## Working with an AI pair programmer

- **[AGENTS.md](../AGENTS.md)** is where an agent starts: the binding ADRs, where code goes, and the hard rules. `CLAUDE.md` points to it.
- **Project skills** keep the agent inside the architecture: `where-does-it-go` before creating a file, `adr-new` for decisions, `rn-review` at the end of each phase.
- **The owner decides.** Product and architecture choices, and every trade-off with a cost, were put to the owner, not taken by the agent. The agent never commits, pushes or tags: it prepares a change, runs `yarn validate` and proposes a commit message ([ADR-0024](adr/0024-contribution-workflow.md)).
- **Failures are investigated, not retried away.** When something failed, the rule was to find out why before moving on.

## What the checks caught

A few examples of why the process was worth it:

- **Bundling.** Zod 4 broke Metro's bundle while Jest passed, because the tests used a different build of zod. Since then `yarn validate` bundles the release JavaScript for both platforms.
- **Release-only crash.** On Android, R8 stripped a class that React Native Screens needs when the activity is recreated. Only a release build on a device showed it; it's now a keep rule, and end-to-end tests run on release builds.
- **A keyboard race.** A rare end-to-end failure turned out to be the keyboard missing an input-session restart on a busy cold start. It was diagnosed from device logs, and the test now fails at the typing step with a clear message.
- **Measuring the right thing.** The first frame-time numbers came from an emulator drawing in software. The performance script now refuses to run unless the emulator uses the host GPU ([ADR-0017](adr/0017-performance-measurement.md)).
- **GitHub's secondary rate limits.** They can arrive without the headers the client relied on. The end-of-phase review found it, and the app now waits and resumes ([ADR-0018](adr/0018-error-model.md)).
