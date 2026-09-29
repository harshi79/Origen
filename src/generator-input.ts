/**
 * Fixture-builder form contract.
 *
 * This layer translates the five builder steps (BIN, expiry, CVV, quantity,
 * generate) into the low-level generator options and produces friendly,
 * field-scoped validation messages. Nothing here ever leaves the page.
 */
import { validateBin } from "./bin";
import {
  cardLengths,
  compatibleNetworks,
  cvvDigits,
  displayName,
  lengthLabel,
  resolveExpiryMode,
  type GeneratorOptions,
  type Network,
} from "./generator";
export type GeneratorInput = Omit<GeneratorOptions, "network"> & {
  network: GeneratorOptions["network"] | "Auto";
};
/** Auto is the builder-facing alias for "use the existing generator rules". */
export function prepareGeneratorOptions(input: GeneratorInput): GeneratorOptions {
  if (input.prefix !== "") validateBin(input.prefix);
  return {
    ...input,
    network: input.network === "Auto" ? "Random" : input.network,
    cvvValue: input.cvv === "custom" ? input.cvvValue : undefined,
  };
}
export type BinMode = "auto" | "manual";
export type ValueMode = "auto" | "custom";
/** Exactly what the five builder steps hold right now. */
export interface GeneratorFormValues {
  binMode: BinMode;
  prefix: string;
  network: GeneratorOptions["network"] | "Auto";
  expiryMode: ValueMode;
  month: number;
  year: number;
  cvvMode: ValueMode;
  cvvValue: string;
  quantity: number;
}
export interface GeneratorFieldErrors {
  prefix?: string;
  network?: string;
  expiry?: string;
  cvv?: string;
  quantity?: string;
}
export function hasFieldErrors(errors: GeneratorFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
/** The BIN actually used for generation: Auto mode never reads typed digits. */
export function effectivePrefix(
  values: Pick<GeneratorFormValues, "binMode" | "prefix">,
): string {
  return values.binMode === "auto" ? "" : values.prefix;
}
/** Networks compatible with the current BIN selection, per the existing rules. */
export function formNetworks(values: GeneratorFormValues): Network[] {
  const prefix = effectivePrefix(values);
  const compatible = compatibleNetworks(prefix);
  if (values.network === "Auto" || values.network === "Random")
    return compatible;
  return compatible.includes(values.network) ? [values.network] : [];
}
function expiryError(
  values: GeneratorFormValues,
  now: Date,
): string | undefined {
  if (values.expiryMode === "auto") return undefined;
  const lastYear = now.getFullYear() + 10;
  if (!Number.isInteger(values.month) || values.month < 1 || values.month > 12)
    return "Choose a month between 01 and 12.";
  if (
    !Number.isInteger(values.year) ||
    values.year < now.getFullYear() ||
    values.year > lastYear
  )
    return `Choose a year between ${now.getFullYear()} and ${lastYear}.`;
  if (values.year * 12 + values.month <= now.getFullYear() * 12 + now.getMonth() + 1)
    return "Choose an expiry month after the current month.";
  return undefined;
}
function cvvError(
  values: GeneratorFormValues,
  networks: Network[],
): string | undefined {
  if (values.cvvMode === "auto") return undefined;
  if (!/^\d{3,4}$/.test(values.cvvValue))
    return "Enter 3 or 4 digits only. Use synthetic numbers, never a real CVV.";
  if (!networks.length) return undefined;
  const widths = [...new Set(networks.map(cvvDigits))];
  if (widths.length > 1)
    return `A custom CVV cannot cover ${networks.map(displayName).join(", ")} at once. Pick one network, or switch CVV back to Auto.`;
  if (widths[0] !== values.cvvValue.length)
    return `${displayName(networks[0])} uses a ${widths[0]}-digit CVV. Enter ${widths[0]} digits, or switch CVV back to Auto.`;
  return undefined;
}
/** Field-scoped validation. Every message suggests how to fix the input. */
export function validateGeneratorForm(
  values: GeneratorFormValues,
  now = new Date(),
): GeneratorFieldErrors {
  const errors: GeneratorFieldErrors = {};
  const prefix = effectivePrefix(values);
  if (values.binMode === "manual") {
    if (prefix === "")
      errors.prefix = "Enter a 6–8 digit synthetic BIN / IIN, or turn on Auto.";
    else {
      try {
        validateBin(prefix);
      } catch (error) {
        errors.prefix = (error as Error).message;
      }
    }
  }
  const networks = errors.prefix ? [] : formNetworks(values);
  if (!errors.prefix && !networks.length) {
    const compatible = compatibleNetworks(prefix);
    errors.network =
      values.network === "Auto" || values.network === "Random"
        ? "No supported test network matches this BIN. Check the digits, or turn on Auto."
        : compatible.length
          ? `${displayName(values.network)} does not match this BIN. Compatible here: ${compatible.map(displayName).join(", ")}.`
          : `${displayName(values.network)} does not match this BIN, and no supported network does. Check the digits, or turn on Auto.`;
  }
  const expiry = expiryError(values, now);
  if (expiry) errors.expiry = expiry;
  const cvv = cvvError(values, networks);
  if (cvv) errors.cvv = cvv;
  if (
    !Number.isInteger(values.quantity) ||
    values.quantity < 1 ||
    values.quantity > 100
  )
    errors.quantity = "Choose a whole number of fixtures between 1 and 100.";
  return errors;
}
/**
 * One-line preview of what the next generation run will produce, e.g.
 * `Visa · 16 digits · Auto expiry · Auto CVV · 10 fixtures`.
 */
export function summarizeGeneratorForm(values: GeneratorFormValues): string {
  const networks = formNetworks(values);
  const names = networks.map(displayName);
  const networkLabel =
    names.length === 1
      ? names[0]
      : names.length
        ? "Auto network"
        : "Network pending";
  const widths = [
    ...new Set(networks.flatMap((network) => [...cardLengths(network)])),
  ];
  const lengthLabelText = lengthLabel(widths);
  const mode = resolveExpiryMode(values.expiryMode);
  const expiryLabel =
    mode === "random"
      ? "Auto expiry"
      : mode === "month"
        ? `Expiry ${String(values.month).padStart(2, "0")}`
        : mode === "year"
          ? `Expiry ${values.year}`
          : `Expiry ${String(values.month).padStart(2, "0")}/${String(values.year).slice(-2)}`;
  const cvvLabel =
    values.cvvMode === "custom"
      ? `Custom CVV (${values.cvvValue.length} digits)`
      : "Auto CVV";
  const quantity =
    Number.isInteger(values.quantity) && values.quantity > 0
      ? values.quantity
      : 0;
  return [
    networkLabel,
    lengthLabelText,
    expiryLabel,
    cvvLabel,
    `${quantity} ${quantity === 1 ? "fixture" : "fixtures"}`,
  ].join(" · ");
}
