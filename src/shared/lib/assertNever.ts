/**
 * Exhaustiveness guard for `switch` over a union (ADR-0004, ADR-0018): adding a
 * new member makes every unhandled switch fail to compile.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
