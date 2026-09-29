import { describe, expect, it } from "vitest";
import {
  checkDigit,
  compatibleNetworks,
  displayNumber,
  formatRecords,
  generateCards,
  luhnValid,
  NETWORKS,
  validateOptions,
  type GeneratorOptions,
} from "./generator";
const now = new Date(2026, 8, 29);
const base: GeneratorOptions = {
  prefix: "",
  network: "Random",
  quantity: 10,
  expiryMode: "random",
  month: 1,
  year: 2027,
  cvv: "auto",
};
const generate = (overrides: Partial<GeneratorOptions> = {}) =>
  generateCards({ ...base, ...overrides }, now);
describe("Luhn implementation", () => {
  it("calculates a known mathematical checksum", () => {
    expect(checkDigit("7992739871")).toBe("3");
    expect(luhnValid("79927398713")).toBe(true);
  });
  it.each(["79927398714", "", "x123", "4", "12 34", "12345678901234567890"])(
    "rejects malformed or incorrect checksum %s",
    (number) => expect(luhnValid(number)).toBe(false),
  );
  it("rejects nonnumeric bodies", () => {
    expect(() => checkDigit("")).toThrow();
    expect(() => checkDigit("123x")).toThrow();
  });
  it("handles zeros and leading zeros", () => {
    expect(checkDigit("000000")).toBe("0");
    expect(luhnValid("0000000")).toBe(true);
  });
});
describe("network matching and generation", () => {
  it.each(NETWORKS)(
    "generates correct lengths and CVV widths for %s",
    (network) => {
      const rows = generate({ network, quantity: 100 });
      expect(rows).toHaveLength(100);
      for (const row of rows) {
        expect(row.network).toBe(network);
        expect(row.synthetic).toBe(true);
        expect(row.number).toHaveLength(
          network === "American Express" ? 15 : 16,
        );
        expect(row.cvv).toMatch(
          network === "American Express" ? /^\d{4}$/ : /^\d{3}$/,
        );
        expect(luhnValid(row.number)).toBe(true);
        expect(compatibleNetworks(row.number)).toContain(network);
      }
    },
  );
  it.each([
    ["4", "Visa"],
    ["42424242", "Visa"],
    ["51", "Mastercard"],
    ["55", "Mastercard"],
    ["2221", "Mastercard"],
    ["2720", "Mastercard"],
    ["34", "American Express"],
    ["37", "American Express"],
    ["6011", "Discover"],
    ["644", "Discover"],
    ["649", "Discover"],
    ["65", "Discover"],
    ["622126", "Discover"],
    ["622925", "Discover"],
  ] as const)("preserves requested prefix %s for %s", (prefix, network) => {
    for (const row of generate({ prefix, network })) {
      expect(row.number.startsWith(prefix)).toBe(true);
      expect(luhnValid(row.number)).toBe(true);
    }
  });
  it.each([
    ["4", "Mastercard"],
    ["51", "Visa"],
    ["36", "American Express"],
    ["2220", "Mastercard"],
    ["2721", "Mastercard"],
    ["50", "Mastercard"],
    ["56", "Mastercard"],
    ["622125", "Discover"],
    ["622926", "Discover"],
    ["643", "Discover"],
    ["650", "Visa"],
  ] as const)("rejects incompatible %s / %s", (prefix, network) =>
    expect(() => generate({ prefix, network })).toThrow(/not compatible/),
  );
  it.each(["2", "3", "5", "6", "622", "222", "27"])(
    "extends partial prefix %s without changing it",
    (prefix) => {
      for (const row of generate({ prefix, quantity: 100 }))
        expect(row.number.startsWith(prefix)).toBe(true);
    },
  );
  it("random network respects a supplied prefix", () => {
    for (const row of generate({ prefix: "37" }))
      expect(row.network).toBe("American Express");
  });
  it("rejects unsupported prefixes rather than fabricating a network", () =>
    expect(() => generate({ prefix: "9" })).toThrow(/not compatible/));
  it.each(["123456789", "12x", " 4", "4 ", "-4", "4.2", "４２"])(
    "rejects invalid prefix %s",
    (prefix) => expect(() => generate({ prefix })).toThrow(/1–8 digits/),
  );
});
describe("limits and CVV validation", () => {
  it.each([0, -1, 101, 1.5, Infinity, NaN])("rejects quantity %s", (quantity) =>
    expect(() => generate({ quantity })).toThrow(/between 1 and 100/),
  );
  it.each([1, 100])("accepts boundary quantity %s", (quantity) =>
    expect(generate({ quantity })).toHaveLength(quantity),
  );
  it("rejects a four-digit CVV request for Visa", () =>
    expect(() => generate({ network: "Visa", cvv: "4" })).toThrow(
      /CVV format/,
    ));
  it("rejects a three-digit CVV request for Amex", () =>
    expect(() => generate({ network: "American Express", cvv: "3" })).toThrow(
      /CVV format/,
    ));
  it("does not silently restrict Random networks based on CVV", () =>
    expect(() => generate({ cvv: "3" })).toThrow(/CVV format/));
  it("supports explicit compatible CVV format", () =>
    expect(
      generate({ network: "American Express", cvv: "4" })[0].cvv,
    ).toHaveLength(4));
  it("validates untrusted enum values", () => {
    expect(() =>
      generate({ network: "Unknown" as GeneratorOptions["network"] }),
    ).toThrow(/supported card network/);
    expect(() => generate({ cvv: "5" as GeneratorOptions["cvv"] })).toThrow(
      /supported CVV/,
    );
    expect(() =>
      generate({ expiryMode: "past" as GeneratorOptions["expiryMode"] }),
    ).toThrow(/supported expiry/);
  });
});
describe("future expiry dates", () => {
  it("uses future months only", () => {
    for (const row of generate({ quantity: 100 })) {
      expect(Number(row.month)).toBeGreaterThanOrEqual(1);
      expect(Number(row.month)).toBeLessThanOrEqual(12);
      expect(Number(row.year) * 12 + Number(row.month)).toBeGreaterThan(
        26 * 12 + 9,
      );
    }
  });
  it("keeps a selected month", () =>
    expect(
      generate({ expiryMode: "month", month: 2 }).every(
        (r) => r.month === "02",
      ),
    ).toBe(true));
  it("keeps a selected year", () =>
    expect(
      generate({ expiryMode: "year", year: 2028 }).every(
        (r) => r.year === "28",
      ),
    ).toBe(true));
  it("keeps a fixed expiry", () =>
    expect(
      generate({ expiryMode: "fixed", month: 11, year: 2027 }).every(
        (r) => r.month === "11" && r.year === "27",
      ),
    ).toBe(true));
  it.each([0, 13, 1.5, NaN])("rejects invalid month %s", (month) =>
    expect(() => generate({ expiryMode: "month", month })).toThrow(
      /month between/,
    ),
  );
  it.each([2025, 2037, NaN, 2027.5])("rejects invalid year %s", (year) =>
    expect(() => generate({ expiryMode: "year", year })).toThrow(
      /next 10 years/,
    ),
  );
  it("rejects past and current-month fixed expiry", () => {
    for (const month of [1, 9])
      expect(() =>
        generate({ expiryMode: "fixed", month, year: 2026 }),
      ).toThrow(/after the current month/);
  });
  it("handles December rollover", () => {
    const date = new Date(2026, 11, 31);
    expect(() =>
      validateOptions({ ...base, expiryMode: "year", year: 2026 }, date),
    ).toThrow(/after the current month/);
    expect(generateCards(base, date).every((r) => Number(r.year) >= 27)).toBe(
      true,
    );
  });
});
describe("builder expiry modes (auto / custom)", () => {
  it("treats auto as the existing random future expiry", () => {
    for (const row of generate({ expiryMode: "auto", quantity: 100 }))
      expect(Number(row.year) * 12 + Number(row.month)).toBeGreaterThan(
        26 * 12 + 9,
      );
  });
  it("treats custom as one fixed synthetic future month and year", () => {
    const rows = generate({ expiryMode: "custom", month: 11, year: 2027 });
    expect(rows.every((r) => r.month === "11" && r.year === "27")).toBe(true);
  });
  it.each([0, 13, 1.5, NaN])("rejects a custom month %s", (month) =>
    expect(() => generate({ expiryMode: "custom", month, year: 2027 })).toThrow(
      /month between/,
    ),
  );
  it.each([2025, 2037, NaN, 2027.5])("rejects a custom year %s", (year) =>
    expect(() => generate({ expiryMode: "custom", month: 5, year })).toThrow(
      /next 10 years/,
    ),
  );
  it("rejects a custom expiry in the current month", () =>
    expect(() => generate({ expiryMode: "custom", month: 9, year: 2026 })).toThrow(
      /after the current month/,
    ));
  it("rejects an unknown expiry mode", () =>
    expect(() =>
      generate({ expiryMode: "someday" as GeneratorOptions["expiryMode"] }),
    ).toThrow(/supported expiry/));
});
describe("builder CVV modes (auto / custom)", () => {
  it("auto keeps network-correct widths", () => {
    for (const row of generate({ network: "American Express", quantity: 20 }))
      expect(row.cvv).toMatch(/^\d{4}$/);
    for (const row of generate({ network: "Visa", quantity: 20 }))
      expect(row.cvv).toMatch(/^\d{3}$/);
  });
  it("custom applies the developer's synthetic value to every record", () => {
    const rows = generate({
      network: "Visa",
      cvv: "custom",
      cvvValue: "007",
      quantity: 10,
    });
    expect(rows.every((r) => r.cvv === "007")).toBe(true);
  });
  it("custom supports the Amex width", () =>
    expect(
      generate({
        network: "American Express",
        cvv: "custom",
        cvvValue: "0000",
      })[0].cvv,
    ).toBe("0000"));
  it.each(["", "12", "12345", "abc", "12a", " 123", "１２３"])(
    "rejects malformed custom CVV %j",
    (cvvValue) =>
      expect(() =>
        generate({ network: "Visa", cvv: "custom", cvvValue }),
      ).toThrow(/3 or 4 digits/),
  );
  it("rejects a custom CVV that cannot match the requested network", () =>
    expect(() =>
      generate({ network: "Visa", cvv: "custom", cvvValue: "1234" }),
    ).toThrow(/3-digit CVV/));
  it("rejects a custom CVV while networks have different widths", () =>
    expect(() => generate({ network: "Random", cvv: "custom", cvvValue: "123" })).toThrow(
      /only match one network length/,
    ));
  it("rejects an unknown CVV option", () =>
    expect(() => generate({ cvv: "custom-length" as GeneratorOptions["cvv"] })).toThrow(
      /supported CVV/,
    ));
});
describe("output formatting", () => {
  const rows = generate({ network: "Visa", quantity: 2 });
  it("exports one pipe-separated record per line", () =>
    expect(formatRecords(rows, "pipe")).toBe(
      rows
        .map((r) => `${r.number} | ${r.month}/${r.year} | ${r.cvv}`)
        .join("\n"),
    ));
  it("exports exactly four comma-separated fields per line", () =>
    expect(formatRecords(rows, "csv")).toBe(
      rows.map((r) => `${r.number},${r.month},${r.year},${r.cvv}`).join("\n"),
    ));
  it("exports parseable JSON with synthetic labels and string values", () =>
    expect(JSON.parse(formatRecords(rows, "json"))).toEqual(rows));
  it("handles empty exports", () => {
    expect(formatRecords([], "pipe")).toBe("");
    expect(formatRecords([], "csv")).toBe("");
    expect(formatRecords([], "json")).toBe("[]");
  });
  it("groups Visa display numbers 4-4-4-4", () =>
    expect(displayNumber(rows[0])).toMatch(/^\d{4} \d{4} \d{4} \d{4}$/));
  it("groups Amex display numbers 4-6-5", () =>
    expect(displayNumber(generate({ network: "American Express" })[0])).toMatch(
      /^\d{4} \d{6} \d{5}$/,
    ));
});
