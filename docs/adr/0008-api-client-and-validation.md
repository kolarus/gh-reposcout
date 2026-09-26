# 0008. Typed fetch client, Zod validation at the boundary, mapping API data to domain types

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0004, ADR-0007, ADR-0012, ADR-0018

## Context

GitHub responses are large, snake_case, and full of nullable fields. TypeScript types alone don't protect us at runtime: a missing field or an API change would surface as a crash deep inside a component. We also need cancellation (typing fast), rate-limit headers, testability without a network, and room for authentication or a proxy later.

## Decision

**Client** (`shared/api/github/client.ts`):

- `createGitHubClient({ fetch = globalThis.fetch, baseUrl })`. The fetch function is **injectable**, so tests can pass a fake one and a proxy or auth wrapper can slot in later.
- A single header-building function sets `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2022-11-28`. Authentication would be added here (ADR-0012).
- Every call takes an `AbortSignal` (supplied by TanStack Query), combined with a timeout. `AbortSignal.any` / `timeout` are used if Hermes supports them; otherwise a small helper.
- Every response has its `x-ratelimit-*` / `retry-after` headers parsed into the rate-limit store (ADR-0012).
- Every failure is turned into our `ApiError` type (ADR-0018).
- URLs are built with `URL` / `URLSearchParams`, never string concatenation.

**Validation:**

- **Zod** schemas in each slice's `api/` folder, covering **only the fields we use**. Unknown fields are stripped, so new fields from GitHub don't break us.
- The item schema is shared: search results reuse `entities/repo`'s repository schema.
- A mismatch becomes a `validation` error, is logged through monitoring, and shows an error state rather than a crash.

**Mapping from the API shape (DTO) to our domain types** (`model/mappers.ts`):

- snake_case → camelCase; `null` → `undefined` or an explicit variant.
- **Dates stay ISO-8601 strings** in domain types, because they must survive JSON persistence (ADR-0011, ADR-0020). They're formatted only in the view layer (ADR-0019).
- Avatar URLs are rewritten to the size needed with `s=<px>` (ADR-0009).
- **API response types never leave `api/` and `model/`.** Components see only domain types.

**Query input:**

- Search queries are normalised before being sent or used as a cache key: trimmed, whitespace collapsed, lowercased (GitHub search is case-insensitive).
- Qualifiers users type (`language:go stars:>100`) pass through deliberately.
- GitHub's 422 (invalid query) becomes a `validation` error with friendly copy.

## Alternatives considered

- **axios / ky.** Extra dependency for features `fetch` already has; axios adapters on React Native add weight.
- **Octokit.** A large SDK aimed at Node and web; we use three endpoints.
- **Types generated from OpenAPI, without runtime checks.** Precise types, but no runtime guarantee and a huge generated surface.
- **Valibot instead of Zod.** Smaller bundle. Zod v4 is fast, has the bigger ecosystem, and bundle size matters less with Hermes bytecode. Either would be acceptable.
- **No validation (trusting a cast).** Violates ADR-0004.

## Consequences

Positive:

- Runtime-safe boundary; the UI is insulated from API shape changes.
- Easy to test with a fake fetch or MSW.
- Better cache hit rate thanks to normalisation.

Negative / accepted costs:

- Schema and mapper code for each endpoint (small, and tested).
- Validating 100 items per page costs some JS time. It will be measured (ADR-0017); expected to be well below one frame per page.

## Enforcement

- Lint: nothing outside `api/` and `model/` may import `*.schema.ts`, and nothing outside `shared/api` may call `fetch`.
- Every mapper has unit tests using captured real payloads.
- The `rn-review` skill flags snake_case fields reaching the UI.

## References

- https://docs.github.com/en/rest/search/search#search-repositories
- https://zod.dev
