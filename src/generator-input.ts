import { validateBin } from './bin';
import { type GeneratorOptions } from './generator';
export type GeneratorInput = Omit<GeneratorOptions, 'network'> & { network: GeneratorOptions['network'] | 'Auto' };
/** New UI contract, leaving the existing low-level generator and range rules unchanged. */
export function prepareGeneratorOptions(input: GeneratorInput): GeneratorOptions {
  if (input.prefix !== '') validateBin(input.prefix);
  return { ...input, network: input.network === 'Auto' ? 'Random' : input.network };
}
