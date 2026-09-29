import { describe, expect, it } from 'vitest';
import { fixtureExport } from './exports';
import { type CardRecord } from './generator';
const record: CardRecord = { number: '4242420000000000', month: '01', year: '29', cvv: '007', network: 'Visa', synthetic: true };
describe('download exports', () => {
  it('exports TXT with no header and one record per line', () => expect(fixtureExport([record, record], 'txt')).toEqual({ filename: 'fixture-test-data.txt', mime: 'text/plain', content: '4242420000000000 | 01/29 | 007\n4242420000000000 | 01/29 | 007' }));
  it('exports four CSV columns, preserving leading zeros', () => expect(fixtureExport([record], 'csv')).toEqual({ filename: 'fixture-test-data.csv', mime: 'text/csv', content: '4242420000000000,01,29,007' }));
  it('exports labeled synthetic JSON with string values', () => { const file = fixtureExport([record], 'json'); expect(file.mime).toBe('application/json'); expect(JSON.parse(file.content)).toEqual([record]); });
});
