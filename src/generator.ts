export const NETWORKS = [
  "Visa",
  "Mastercard",
  "American Express",
  "Discover",
] as const;
export type Network = (typeof NETWORKS)[number];
export type ExpiryMode = "random" | "month" | "year" | "fixed";
export type OutputFormat = "pipe" | "csv" | "json";
export interface CardRecord {
  number: string;
  month: string;
  year: string;
  cvv: string;
  network: Network;
  synthetic: true;
}
export interface GeneratorOptions {
  prefix: string;
  network: Network | "Random";
  quantity: number;
  expiryMode: ExpiryMode;
  month: number;
  year: number;
  cvv: "auto" | "3" | "4";
}
// Public network-format ranges, not a database of issued cards or accounts.
const ranges: Record<Network, [number, number, number][]> = {
  Visa: [[4, 4, 1]],
  Mastercard: [
    [51, 55, 2],
    [2221, 2720, 4],
  ],
  "American Express": [
    [34, 34, 2],
    [37, 37, 2],
  ],
  Discover: [
    [6011, 6011, 4],
    [644, 649, 3],
    [65, 65, 2],
    [622126, 622925, 6],
  ],
};
export function luhnValid(value: string): boolean {
  if (!/^\d{2,19}$/.test(value)) return false;
  let sum = 0;
  for (
    let i = value.length - 1, double = false;
    i >= 0;
    i--, double = !double
  ) {
    let digit = Number(value[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
export function checkDigit(body: string): string {
  if (!/^\d{1,18}$/.test(body))
    throw new Error("A Luhn body must contain 1–18 digits.");
  for (let digit = 0; digit < 10; digit++)
    if (luhnValid(body + digit)) return String(digit);
  throw new Error("Unable to calculate checksum.");
}
function randomInt(min: number, max: number): number {
  const span = max - min + 1;
  const limit = Math.floor(0x100000000 / span) * span;
  const bytes = new Uint32Array(1);
  do {
    crypto.getRandomValues(bytes);
  } while (bytes[0] >= limit);
  return min + (bytes[0] % span);
}
function compatibleRanges(
  prefix: string,
  network: Network,
): [number, number, number][] {
  return ranges[network].flatMap(([low, high, width]) => {
    if (!prefix) return [[low, high, width] as [number, number, number]];
    if (prefix.length >= width) {
      const value = Number(prefix.slice(0, width));
      return value >= low && value <= high
        ? [[value, value, width] as [number, number, number]]
        : [];
    }
    const start = Number(prefix.padEnd(width, "0"));
    const end = Number(prefix.padEnd(width, "9"));
    return Math.max(low, start) <= Math.min(high, end)
      ? [
          [Math.max(low, start), Math.min(high, end), width] as [
            number,
            number,
            number,
          ],
        ]
      : [];
  });
}
export function compatibleNetworks(prefix: string): Network[] {
  return NETWORKS.filter(
    (network) => compatibleRanges(prefix, network).length > 0,
  );
}
export function expiryChoices(
  options: GeneratorOptions,
  now = new Date(),
): { month: number; year: number }[] {
  const result = [];
  for (let year = now.getFullYear(); year <= now.getFullYear() + 10; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === now.getFullYear() && month <= now.getMonth() + 1) continue;
      if (
        ["month", "fixed"].includes(options.expiryMode) &&
        month !== options.month
      )
        continue;
      if (
        ["year", "fixed"].includes(options.expiryMode) &&
        year !== options.year
      )
        continue;
      result.push({ month, year });
    }
  }
  return result;
}
export function validateOptions(
  options: GeneratorOptions,
  now = new Date(),
): Network[] {
  if (!/^\d{0,8}$/.test(options.prefix))
    throw new Error(
      "BIN / IIN must contain 1–8 digits, or be blank for an automatic prefix.",
    );
  if (
    !Number.isInteger(options.quantity) ||
    options.quantity < 1 ||
    options.quantity > 100
  )
    throw new Error("Quantity must be a whole number between 1 and 100.");
  if (options.network !== "Random" && !NETWORKS.includes(options.network))
    throw new Error("Choose a supported card network.");
  const networks =
    options.network === "Random"
      ? compatibleNetworks(options.prefix)
      : [options.network].filter(
          (n) => compatibleRanges(options.prefix, n).length,
        );
  if (!networks.length)
    throw new Error(
      `Prefix ${options.prefix} is not compatible with ${options.network === "Random" ? "a supported network" : options.network}. Choose another prefix or network.`,
    );
  if (!["auto", "3", "4"].includes(options.cvv))
    throw new Error("Choose a supported CVV format.");
  if (
    options.cvv !== "auto" &&
    networks.some((n) => (n === "American Express" ? "4" : "3") !== options.cvv)
  )
    throw new Error(
      "CVV format does not match the network. Use automatic, or select American Express for 4 digits and another network for 3 digits.",
    );
  if (!["random", "month", "year", "fixed"].includes(options.expiryMode))
    throw new Error("Choose a supported expiry mode.");
  if (
    ["month", "fixed"].includes(options.expiryMode) &&
    (!Number.isInteger(options.month) ||
      options.month < 1 ||
      options.month > 12)
  )
    throw new Error("Select a month between 01 and 12.");
  if (
    ["year", "fixed"].includes(options.expiryMode) &&
    (!Number.isInteger(options.year) ||
      options.year < now.getFullYear() ||
      options.year > now.getFullYear() + 10)
  )
    throw new Error("Select a year within the next 10 years.");
  if (!expiryChoices(options, now).length)
    throw new Error(
      "Expiry must be after the current month. Choose a future month or year.",
    );
  return networks;
}
export function generateCards(
  options: GeneratorOptions,
  now = new Date(),
): CardRecord[] {
  const networks = validateOptions(options, now);
  const dates = expiryChoices(options, now);
  return Array.from({ length: options.quantity }, () => {
    const network = networks[randomInt(0, networks.length - 1)];
    const possible = compatibleRanges(options.prefix, network);
    const [low, high, width] = possible[randomInt(0, possible.length - 1)];
    let body =
      options.prefix.length >= width
        ? options.prefix
        : String(randomInt(low, high)).padStart(width, "0");
    const length = network === "American Express" ? 15 : 16;
    while (body.length < length - 1) body += randomInt(0, 9);
    const expiry = dates[randomInt(0, dates.length - 1)];
    const cvvLength = network === "American Express" ? 4 : 3;
    return {
      number: body + checkDigit(body),
      month: String(expiry.month).padStart(2, "0"),
      year: String(expiry.year).slice(-2),
      cvv: String(randomInt(0, 10 ** cvvLength - 1)).padStart(cvvLength, "0"),
      network,
      synthetic: true,
    };
  });
}
export function formatRecords(
  records: CardRecord[],
  format: OutputFormat,
): string {
  if (format === "json") return JSON.stringify(records, null, 2);
  return records
    .map((r) =>
      format === "csv"
        ? `${r.number},${r.month},${r.year},${r.cvv}`
        : `${r.number} | ${r.month}/${r.year} | ${r.cvv}`,
    )
    .join("\n");
}
export function displayNumber(record: CardRecord): string {
  return record.network === "American Express"
    ? `${record.number.slice(0, 4)} ${record.number.slice(4, 10)} ${record.number.slice(10)}`
    : record.number.match(/.{1,4}/g)!.join(" ");
}
