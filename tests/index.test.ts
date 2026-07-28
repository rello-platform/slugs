import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  APP_SLUGS,
  CANONICAL_SET,
  ENGINE_SLUGS,
  LEGACY_ALIASES,
  PLATFORM_SLUGS,
  normalizeSlug,
  toSourceAppIdentifier,
  tryNormalizeSlug,
  type PlatformSlug,
} from "../src/index";

// ─────────────────────────────────────────────────────────────────────────────
// console.warn capture. Every test runs with a spy installed so an unexpected
// warning is a hard failure rather than silent noise.
// ─────────────────────────────────────────────────────────────────────────────
let captured: string[] = [];
let restoreWarn: (() => void) | null = null;

beforeEach(() => {
  captured = [];
  const original = console.warn;
  console.warn = (...args: unknown[]): void => {
    captured.push(args.map((a) => String(a)).join(" "));
  };
  restoreWarn = () => {
    console.warn = original;
  };
});

afterEach(() => {
  restoreWarn?.();
  restoreWarn = null;
});

const warnCalls = (): string[] => captured;

// ─────────────────────────────────────────────────────────────────────────────
// The corpus. Table-driven off the package's OWN data, so a newly-added app or
// engine is automatically covered — that is the entire point of the underscore
// fold (no per-slug enumeration anywhere).
// ─────────────────────────────────────────────────────────────────────────────

/** Inputs that MUST resolve, paired with the slug they must resolve to. */
const RESOLVING_CORPUS: ReadonlyArray<{
  input: string;
  expected: PlatformSlug;
  label: string;
}> = [
  ...PLATFORM_SLUGS.flatMap((slug) => {
    const upperSnake = toSourceAppIdentifier(slug);
    return [
      { input: slug, expected: slug, label: "canonical" },
      { input: slug.toUpperCase(), expected: slug, label: "canonical-upper" },
      { input: `  ${slug}  `, expected: slug, label: "canonical-padded" },
      { input: upperSnake, expected: slug, label: "upper-snake" },
      { input: upperSnake.toLowerCase(), expected: slug, label: "lower-snake" },
      { input: `  ${upperSnake} `, expected: slug, label: "upper-snake-padded" },
    ];
  }),
  ...Object.entries(LEGACY_ALIASES).flatMap(([alias, target]) => [
    { input: alias, expected: target, label: "alias" },
    { input: alias.toUpperCase(), expected: target, label: "alias-upper" },
    { input: `  ${alias}\t`, expected: target, label: "alias-padded" },
  ]),
];

/** Present-but-unrecognized inputs: null + a warning. */
const UNKNOWN_CORPUS: readonly string[] = [
  "neighborhood-intel",
  "NEIGHBORHOOD_INTEL",
  "neighborhood_intel",
  "totally-bogus-app",
  "FUB",
  "prequal-pro",
  "PREQUAL_PRO",
  "daily_plan",
  "compliance",
  "email",
  "unknown",
  "Home Ready",
  "rello-crm",
  "inbound-sms",
  "___",
  "_",
  "-",
];

/** Absent inputs: null, SILENTLY (no warning). */
const ABSENT_CORPUS: ReadonlyArray<string | null | undefined> = [
  null,
  undefined,
  "",
  "   ",
  "\t",
  "\n",
  " \t\n ",
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Structural invariants the fold depends on
// ─────────────────────────────────────────────────────────────────────────────

describe("structural invariants", () => {
  test("no canonical slug contains an underscore (the fold can never shadow one)", () => {
    expect(PLATFORM_SLUGS.filter((s) => s.includes("_"))).toEqual([]);
  });

  test("PLATFORM_SLUGS is exactly APP_SLUGS + ENGINE_SLUGS with no duplicates", () => {
    expect(PLATFORM_SLUGS).toEqual([...APP_SLUGS, ...ENGINE_SLUGS]);
    expect(new Set(PLATFORM_SLUGS).size).toBe(PLATFORM_SLUGS.length);
  });

  test("every canonical slug is lowercase-hyphenated", () => {
    for (const slug of PLATFORM_SLUGS) {
      expect(slug).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    }
  });

  test("no LEGACY_ALIASES key collides with a canonical slug", () => {
    for (const alias of Object.keys(LEGACY_ALIASES)) {
      expect(CANONICAL_SET.has(alias as PlatformSlug)).toBe(false);
    }
  });

  test("every LEGACY_ALIASES target is itself canonical", () => {
    for (const [alias, target] of Object.entries(LEGACY_ALIASES)) {
      expect(
        CANONICAL_SET.has(target),
        `alias "${alias}" targets non-canonical "${target}"`,
      ).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Canonical slugs + the UPPER_SNAKE round-trip (the fix)
// ─────────────────────────────────────────────────────────────────────────────

describe("canonical slugs", () => {
  test.each(PLATFORM_SLUGS.map((slug) => [slug] as const))(
    "%s resolves to itself",
    (slug) => {
      expect(normalizeSlug(slug)).toBe(slug);
      expect(tryNormalizeSlug(slug)).toBe(slug);
      expect(warnCalls()).toEqual([]);
    },
  );

  test.each(
    PLATFORM_SLUGS.map((slug) => [toSourceAppIdentifier(slug), slug] as const),
  )(
    "UPPER_SNAKE %s round-trips back to %s",
    (identifier, slug) => {
      expect(normalizeSlug(identifier)).toBe(slug);
      expect(tryNormalizeSlug(identifier)).toBe(slug);
      // The whole point: an UPPER_SNAKE routing identifier is a recognized
      // platform value, not drift — it must not warn.
      expect(warnCalls()).toEqual([]);
    },
  );

  test("round-trip is table-driven — a new slug is covered with no test edit", () => {
    // Guards against someone replacing the generated table with a literal list.
    const failures = PLATFORM_SLUGS.filter(
      (slug) => tryNormalizeSlug(toSourceAppIdentifier(slug)) !== slug,
    );
    expect(failures).toEqual([]);
  });

  test("the four engine identifiers that previously missed now resolve", () => {
    // Regression pin for the specific defect this change fixes.
    expect(tryNormalizeSlug("PROPERTY_ENGINE")).toBe("property-engine");
    expect(tryNormalizeSlug("JOURNEY_ENGINE")).toBe("journey-engine");
    expect(tryNormalizeSlug("REPORT_ENGINE")).toBe("report-engine");
    expect(tryNormalizeSlug("DRUMBEAT_VIDEO_ENGINE")).toBe(
      "drumbeat-video-engine",
    );
    expect(warnCalls()).toEqual([]);
  });

  test("lowercase snake_case forms resolve identically to UPPER_SNAKE", () => {
    for (const slug of PLATFORM_SLUGS) {
      const identifier = toSourceAppIdentifier(slug);
      expect(tryNormalizeSlug(identifier.toLowerCase())).toBe(slug);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Legacy aliases — including the divergent ones the fold must NOT preempt
// ─────────────────────────────────────────────────────────────────────────────

describe("legacy aliases", () => {
  test.each(Object.entries(LEGACY_ALIASES))(
    "%s resolves to %s (raw / uppercased / whitespace-padded)",
    (alias, target) => {
      expect(normalizeSlug(alias)).toBe(target);
      expect(normalizeSlug(alias.toUpperCase())).toBe(target);
      expect(normalizeSlug(`  ${alias}\t`)).toBe(target);
      expect(tryNormalizeSlug(alias)).toBe(target);
      expect(tryNormalizeSlug(alias.toUpperCase())).toBe(target);
      expect(tryNormalizeSlug(`  ${alias}\t`)).toBe(target);
      expect(warnCalls()).toEqual([]);
    },
  );

  test("divergent aliases keep their documented target, not their hyphenated spelling", () => {
    // These four are the reason step 2 (aliases) MUST precede step 3 (fold).
    expect(tryNormalizeSlug("rello_crm")).toBe("rello");
    expect(tryNormalizeSlug("RELLO_CRM")).toBe("rello");
    expect(tryNormalizeSlug("inbound_sms")).toBe("rello");
    expect(tryNormalizeSlug("INBOUND_SMS")).toBe("rello");
    expect(tryNormalizeSlug("inbound_email")).toBe("rello");
    expect(tryNormalizeSlug("INBOUND_EMAIL")).toBe("rello");
    expect(tryNormalizeSlug("inbound_call")).toBe("rello");
    expect(tryNormalizeSlug("INBOUND_CALL")).toBe("rello");
    // Divergent but same-family; safe either way, pinned for completeness.
    expect(tryNormalizeSlug("open_house")).toBe("open-house-hub");
    expect(tryNormalizeSlug("OPEN_HOUSE")).toBe("open-house-hub");
  });

  test("the hyphenated spellings of the divergent aliases are NOT canonical", () => {
    // If any of these ever became a real slug, alias-before-fold ordering
    // would become outcome-affecting. This test fails loudly if that happens.
    for (const spelling of [
      "rello-crm",
      "inbound-sms",
      "inbound-email",
      "inbound-call",
      "open-house",
    ]) {
      expect(
        CANONICAL_SET.has(spelling as PlatformSlug),
        `"${spelling}" became canonical — re-verify alias-before-fold ordering`,
      ).toBe(false);
    }
  });

  test("no alias's answer would change if the fold ran first (today)", () => {
    // Documents the current state precisely: ordering is defensive, and this
    // assertion is the tripwire for the day it stops being merely defensive.
    for (const [alias, target] of Object.entries(LEGACY_ALIASES)) {
      const folded = alias.replace(/_/g, "-");
      if (folded !== alias && CANONICAL_SET.has(folded as PlatformSlug)) {
        expect(
          folded,
          `alias "${alias}" folds to canonical "${folded}" but maps to "${target}" — ordering is now outcome-affecting`,
        ).toBe(target);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Unknown input — null AND a warning naming the raw input
// ─────────────────────────────────────────────────────────────────────────────

describe("unrecognized input", () => {
  test.each(UNKNOWN_CORPUS.map((v) => [v] as const))(
    "normalizeSlug(%j) → null and warns with the raw input",
    (input) => {
      expect(normalizeSlug(input)).toBeNull();
      const calls = warnCalls();
      expect(calls).toHaveLength(1);
      expect(calls[0]).toContain("[@rello-platform/slugs]");
      expect(calls[0]).toContain(`"${input}"`);
      expect(calls[0]).toContain("treating as unknown");
    },
  );

  test("the warning preserves the raw input verbatim (not the trimmed/lowered form)", () => {
    expect(normalizeSlug("  Totally-Bogus  ")).toBeNull();
    expect(warnCalls()[0]).toContain('"  Totally-Bogus  "');
  });

  test("neighborhood-intel stays unresolvable — it is a Property Engine feature", () => {
    expect(normalizeSlug("neighborhood-intel")).toBeNull();
    expect(tryNormalizeSlug("neighborhood-intel")).toBeNull();
    expect(tryNormalizeSlug("neighborhood_intel")).toBeNull();
    expect(tryNormalizeSlug("NEIGHBORHOOD_INTEL")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Absent input — null, SILENTLY
// ─────────────────────────────────────────────────────────────────────────────

describe("absent input", () => {
  test.each(ABSENT_CORPUS.map((v) => [v] as const))(
    "normalizeSlug(%j) → null with NO warning",
    (input) => {
      expect(normalizeSlug(input)).toBeNull();
      expect(warnCalls()).toEqual([]);
    },
  );

  test.each(ABSENT_CORPUS.map((v) => [v] as const))(
    "tryNormalizeSlug(%j) → null with NO warning",
    (input) => {
      expect(tryNormalizeSlug(input)).toBeNull();
      expect(warnCalls()).toEqual([]);
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. tryNormalizeSlug is silent for EVERY input class
// ─────────────────────────────────────────────────────────────────────────────

describe("tryNormalizeSlug never warns", () => {
  test("across the full corpus (resolving, unknown, and absent)", () => {
    const everything: ReadonlyArray<string | null | undefined> = [
      ...RESOLVING_CORPUS.map((c) => c.input),
      ...UNKNOWN_CORPUS,
      ...ABSENT_CORPUS,
    ];
    for (const input of everything) {
      tryNormalizeSlug(input);
    }
    expect(warnCalls()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. The two functions agree on return value for every input in the corpus
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeSlug / tryNormalizeSlug parity", () => {
  test("identical return value for every corpus input", () => {
    const everything: ReadonlyArray<string | null | undefined> = [
      ...RESOLVING_CORPUS.map((c) => c.input),
      ...UNKNOWN_CORPUS,
      ...ABSENT_CORPUS,
    ];
    const mismatches: Array<{
      input: string | null | undefined;
      normalize: PlatformSlug | null;
      tryNormalize: PlatformSlug | null;
    }> = [];
    for (const input of everything) {
      const a = normalizeSlug(input);
      const b = tryNormalizeSlug(input);
      if (a !== b) mismatches.push({ input, normalize: a, tryNormalize: b });
    }
    expect(mismatches).toEqual([]);
  });

  test("every RESOLVING_CORPUS entry resolves to its expected slug via both", () => {
    const failures = RESOLVING_CORPUS.filter(
      ({ input, expected }) =>
        normalizeSlug(input) !== expected || tryNormalizeSlug(input) !== expected,
    );
    expect(failures).toEqual([]);
    // Nothing in the resolving corpus may warn.
    expect(warnCalls()).toEqual([]);
  });
});
