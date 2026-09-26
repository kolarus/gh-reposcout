# 0024. Contribution workflow: solo now, ready for contributors

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0001, ADR-0002, ADR-0005, ADR-0013, ADR-0015, ADR-0016, ADR-0021, ADR-0022

## Context

The project has one owner and no outside contributors. The repository is public, and its commit history is part of what gets evaluated. Coding agents also work in the repository and need one predictable workflow. The brief explicitly welcomes code comments.

Team ceremony (pull requests, templates, branch protection, review sign-offs) exists so that several people can review and coordinate. With a single owner there's nobody to review a PR, so today it would be overhead with no benefit. But the architecture is built to scale to many engineers (ADR-0005, ADR-0022), so the flow for contributors is designed now and switched on when needed, without redesign.

## Decision

### Now: solo, straight to `main`

- **Commit straight to `main`.** No pull requests, no branch protection, no PR templates.
- Small, focused commits in **Conventional Commits** format (`feat(search): …`, `fix(save-repo): …`), with the slice as the scope. commitlint checks this in the `commit-msg` hook.
- The **pre-push hook runs `yarn validate`**, so most problems never reach `main`.
- **CI runs on every push to `main`.** If it goes red, fixing it comes before anything else.
- Planned work is done in **phases**. Each phase ends with a short checklist:
  - automated checks, run by Claude, with the real results reported to the owner
  - visual checks of the app on both platforms from screenshots, **internal only**: kept in the git-ignored planning folder, never committed
  - a few manual checks by the owner: look, feel and behaviour on a device
- **Public evidence of correctness is the test suite and CI**, not screenshots. The only images committed are README material (demo GIFs, and the performance screenshots the brief asks for), in `docs/media/`.

### Conventions (always, solo or team)

- **Comments:**
  - TSDoc on every slice's public API (the exports in `index.ts`) and on the `shared/ui` primitives.
  - _Why_-comments on non-obvious code (performance tricks, API quirks, workarounds), linking the ADR or issue.
  - No comments that restate the code, and no commented-out code.
- **File naming** (enforced by lint, ADR-0022): folders in kebab-case; components as `PascalCase.tsx` with `PascalCase.styles.ts` and `PascalCase.test.tsx` beside them; hooks as `useThing.ts`; other modules in camelCase.
- **Agent guidance:**
  - **Agents never commit, push or tag.** They prepare changes, run the checks and propose a Conventional Commit message; the owner commits. No AI attribution trailers (`Co-Authored-By`) in commits.
  - `AGENTS.md` is the single entry point for agents; `CLAUDE.md` is a symlink to it.
  - Skills in `.claude/skills/`:
    - `where-does-it-go`: run before creating files
    - `rn-review`: run at the end of each phase and before a release
    - `adr-new`: scaffolds the next ADR
- **Releases** (ADR-0016):
  - `yarn release:prepare <x.y.z>` bumps `package.json` and syncs iOS and the generated version file. Commit that, then tag `v<x.y.z>`.
  - A prerelease tag (`v1.0.0-rc.1`) is the dry run.
  - Release notes are hand-written for now, because GitHub's generated notes need merged PRs.

### When contributors join

**Trigger:** the first outside contributor, or a second maintainer. From then on, this section replaces "Now: solo".

1. **Talk first.**
   - Anything beyond a small fix starts as an issue, using GitHub issue forms, with `good first issue` labels.
   - A change that would contradict an ADR starts with a superseding ADR (status `proposed`) in the PR.
2. **Pull requests.**
   - Forks for outside contributors; short-lived branches (`feat/…`, `fix/…`) for maintainers.
   - Small PRs with one concern each, aiming for under about 400 changed lines, excluding generated files and fixtures.
   - The PR title follows Conventional Commits, because it becomes the squash commit.
   - A PR template covers what and why, testing, screenshots or video for UI changes, ADR impact, and a `yarn validate` + tests checklist.
   - AI-assisted contributions are welcome. The contributor is responsible for every line, and significant AI generation is mentioned.
3. **Checks.**
   - CI runs on `pull_request`, and its jobs are required checks.
   - PRs from forks run with a read-only token and **no secrets**: we use `pull_request`, never `pull_request_target`, and the signing keys stay in the tag-only `release` Environment.
   - Workflows from first-time contributors need maintainer approval.
   - commitlint checks PR titles.
4. **Review and merge.**
   - A `main` ruleset requires a PR, one approval, green checks and resolved conversations, and blocks force-pushes.
   - CODEOWNERS maps slices to reviewers.
   - Squash merge only.
   - Reviewers use the `rn-review` checklist, so humans and agents review against the same rules.
   - For UI changes, a maintainer can run the Maestro flows (ADR-0021).
5. **Security and upkeep.**
   - `SECURITY.md` and private vulnerability reporting.
   - Dependabot or Renovate with grouped updates. React Native itself is still upgraded through the Upgrade Helper (ADR-0002).
   - `CODE_OF_CONDUCT.md` (Contributor Covenant).
   - Licensing is inbound = outbound (MIT), with no CLA.
6. **Releases:**
   - the version bump goes through a PR, and only maintainers tag
   - the `release` Environment requires approval
   - notes are generated from PR titles, grouped by label in `.github/release.yml`

**Switch-on checklist:**

- [ ] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`
- [ ] issue forms, PR template, `CODEOWNERS`, `.github/release.yml`
- [ ] CI: add the `pull_request` trigger and required checks
- [ ] repository settings:
  - [ ] the `main` ruleset
  - [ ] first-time-contributor approval
  - [ ] private vulnerability reporting
  - [ ] Dependabot or Renovate
- [ ] update this ADR's status line to note the switch

## Alternatives considered

- **PRs and branch protection from day one.** Ceremony without a reviewer while the project is solo. It's the "When contributors join" section instead.
- **Committing straight to `main` even with contributors.** No review gate, and `main` could break at any time.
- **Gitflow** (`develop`, release and hotfix branches). Heavy and slows releases. Tag-based releases from `main` are enough.
- **A merge queue.** The next step when many PRs land at once. On GitHub it needs an organization-owned repository.
- **Rebase or merge commits instead of squash.** Squash gives one Conventional commit per PR, which keeps history and release notes clean.
- **Committing phase screenshots as evidence.** They bloat the repository and prove less than tests do.
- **Free-form commit messages or a CLA.** Free-form messages make history harder to scan; a CLA adds friction for a small MIT project.

## Consequences

Positive:

- Low overhead today, with readable history and the important checks still running.
- The team flow is ready to switch on. The existing enforcement (ADR-0022) becomes the required PR checks without changes.

Negative / accepted costs:

- While the project is solo, nothing technically stops a broken commit from reaching `main`. The pre-push hook makes that rare, and a red CI run is fixed immediately.
- There's no PR discussion record while solo. The reasoning lives in ADRs and commit messages.
- After switch-on, reviews slow merging and maintainers take on triage.

## Enforcement

- **Now:** commitlint (`commit-msg` hook), `yarn validate` (`pre-push` hook), CI on every push, `eslint-plugin-check-file`.
- **After switch-on:** additionally the `main` ruleset with required checks, CODEOWNERS, the PR template, commitlint on PR titles, and first-time-contributor approval.

## References

- https://www.conventionalcommits.org
- https://tsdoc.org
- https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
