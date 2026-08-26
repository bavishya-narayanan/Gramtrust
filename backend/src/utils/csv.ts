import { parse } from 'csv-parse/sync';

export interface NregaCsvRow {
  state_name: string;
  district_name: string;
  'Total No. of JobCards issued': string;
  'Total No. of Workers': string;
  'Total No. of Active Job Cards': string;
  'Total No. of Active Workers': string;
  'Approved Labour Budget': string;
  'Average Wage rate per day per person(Rs.)': string;
  'Total Exp(Rs. in Lakhs.)': string;
  'Wages(Rs. In Lakhs)': string;
}

export function parseNregaCsv(csvContent: string) {
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as NregaCsvRow[];
}
