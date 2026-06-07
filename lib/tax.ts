export type Country = 'RS' | 'ES' | 'DE' | 'AT';
export type Currency = 'RSD' | 'EUR';

export interface TaxResult {
  grossMonthly: number;
  grossAnnual: number;
  netMonthly: number;
  netAnnual: number;
  socialContributions: number;
  incomeTax: number;
  currency: Currency;
  effectiveRate: number;
}

// ─── Serbia ───────────────────────────────────────────────────────────────────

function calcSerbia(grossMonthly: number): TaxResult {
  const SS_RATE = 0.199;
  const PERSONAL_DEDUCTION = 25000;
  const TAX_RATE = 0.10;

  const ss = grossMonthly * SS_RATE;
  const taxableBase = Math.max(0, grossMonthly - ss - PERSONAL_DEDUCTION);
  const tax = taxableBase * TAX_RATE;
  const net = grossMonthly - ss - tax;

  return {
    grossMonthly,
    grossAnnual: grossMonthly * 12,
    netMonthly: net,
    netAnnual: net * 12,
    socialContributions: ss,
    incomeTax: tax,
    currency: 'RSD',
    effectiveRate: (ss + tax) / grossMonthly,
  };
}

// ─── Spain ────────────────────────────────────────────────────────────────────

function spainWorkReduction(netWorkIncome: number): number {
  if (netWorkIncome <= 13115) return 5565;
  if (netWorkIncome <= 16825) return 5565 - 1.5 * (netWorkIncome - 13115);
  return 1000;
}

function spainBrackets(base: number): number {
  const brackets = [
    [12450, 0.19],
    [7750, 0.24],
    [15000, 0.30],
    [24800, 0.37],
    [240000, 0.45],
    [Infinity, 0.47],
  ];
  let tax = 0;
  let remaining = base;
  for (const [size, rate] of brackets) {
    if (remaining <= 0) break;
    const chunk = Math.min(remaining, size as number);
    tax += chunk * (rate as number);
    remaining -= chunk;
  }
  return tax;
}

function calcSpain(grossMonthly: number): TaxResult {
  const grossAnnual = grossMonthly * 12;
  const SS_CAP_MONTHLY = 4909.50;
  const ss = Math.min(grossMonthly, SS_CAP_MONTHLY) * 0.0648;
  const ssAnnual = ss * 12;

  const netWorkIncome = grossAnnual - ssAnnual - 2000;
  const workReduction = spainWorkReduction(netWorkIncome);
  const taxableBase = Math.max(0, netWorkIncome - workReduction);
  const irpf = spainBrackets(taxableBase);
  const netAnnual = grossAnnual - ssAnnual - irpf;

  return {
    grossMonthly,
    grossAnnual,
    netMonthly: netAnnual / 12,
    netAnnual,
    socialContributions: ss,
    incomeTax: irpf / 12,
    currency: 'EUR',
    effectiveRate: (ssAnnual + irpf) / grossAnnual,
  };
}

// ─── Germany ──────────────────────────────────────────────────────────────────

function germanyTax(zvE: number): number {
  if (zvE <= 12096) return 0;
  if (zvE <= 17004) {
    const y = (zvE - 12096) / 10000;
    return (972.87 * y + 1400) * y;
  }
  if (zvE <= 66760) {
    const z = (zvE - 17005) / 10000;
    return (181.19 * z + 2397) * z + 1025.38;
  }
  if (zvE <= 277825) return 0.42 * zvE - 10911.92;
  return 0.45 * zvE - 19246.67;
}

function calcGermany(grossMonthly: number): TaxResult {
  const grossAnnual = grossMonthly * 12;
  const PENSION_CAP = 8050 * 12;
  const HEALTH_CAP = 5512.50 * 12;

  const pensionBase = Math.min(grossAnnual, PENSION_CAP);
  const healthBase = Math.min(grossAnnual, HEALTH_CAP);

  const pension = pensionBase * 0.093;
  const unemployment = pensionBase * 0.013;
  const health = healthBase * 0.0815;
  const ltc = healthBase * 0.023;
  const ssAnnual = pension + unemployment + health + ltc;

  const zvERaw = grossAnnual - ssAnnual - 1230;
  const zvE = Math.max(0, Math.floor(zvERaw / 36) * 36);
  const incomeTaxAnnual = germanyTax(zvE);
  const soliAnnual = incomeTaxAnnual > 18130 ? incomeTaxAnnual * 0.055 : 0;
  const netAnnual = grossAnnual - ssAnnual - incomeTaxAnnual - soliAnnual;

  return {
    grossMonthly,
    grossAnnual,
    netMonthly: netAnnual / 12,
    netAnnual,
    socialContributions: ssAnnual / 12,
    incomeTax: (incomeTaxAnnual + soliAnnual) / 12,
    currency: 'EUR',
    effectiveRate: (ssAnnual + incomeTaxAnnual + soliAnnual) / grossAnnual,
  };
}

// ─── Austria ──────────────────────────────────────────────────────────────────

function austriaBrackets(annualTaxable: number): number {
  const brackets = [
    [13308, 0],
    [8309, 0.20],
    [14219, 0.30],
    [33330, 0.40],
    [33906, 0.48],
    [896928, 0.50],
    [Infinity, 0.55],
  ];
  let tax = 0;
  let remaining = annualTaxable;
  for (const [size, rate] of brackets) {
    if (remaining <= 0) break;
    const chunk = Math.min(remaining, size as number);
    tax += chunk * (rate as number);
    remaining -= chunk;
  }
  return tax;
}

function calcAustria(grossMonthly: number): TaxResult {
  const SS_CAP = 6060;
  const ssBase = Math.min(grossMonthly, SS_CAP);

  const pension = ssBase * 0.1025;
  const health = ssBase * 0.0387;
  const alv = grossMonthly <= 2164 ? 0 : grossMonthly <= 2440 ? ssBase * 0.01 : ssBase * 0.03;
  const housing = ssBase * 0.005;
  const ss = pension + health + alv + housing;

  const annualTaxable = Math.max(0, (grossMonthly - ss - 11) * 12);
  const annualTax = Math.max(0, austriaBrackets(annualTaxable) - 421);
  const monthlyTax = annualTax / 12;
  const net = grossMonthly - ss - monthlyTax;

  return {
    grossMonthly,
    grossAnnual: grossMonthly * 12,
    netMonthly: net,
    netAnnual: net * 12,
    socialContributions: ss,
    incomeTax: monthlyTax,
    currency: 'EUR',
    effectiveRate: (ss + monthlyTax) / grossMonthly,
  };
}

// ─── Gross → Net ──────────────────────────────────────────────────────────────

export function grossToNet(country: Country, grossMonthly: number): TaxResult {
  switch (country) {
    case 'RS': return calcSerbia(grossMonthly);
    case 'ES': return calcSpain(grossMonthly);
    case 'DE': return calcGermany(grossMonthly);
    case 'AT': return calcAustria(grossMonthly);
  }
}

// ─── Net → Gross (binary search) ─────────────────────────────────────────────

export function netToGross(country: Country, targetNetMonthly: number): TaxResult {
  let lo = targetNetMonthly;
  let hi = targetNetMonthly * 3;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const result = grossToNet(country, mid);
    if (result.netMonthly < targetNetMonthly) lo = mid;
    else hi = mid;
  }

  return grossToNet(country, (lo + hi) / 2);
}

export const COUNTRY_LABELS: Record<Country, string> = {
  RS: 'Serbia',
  ES: 'Spain',
  DE: 'Germany',
  AT: 'Austria',
};

export const CURRENCIES: Record<Country, Currency> = {
  RS: 'RSD',
  ES: 'EUR',
  DE: 'EUR',
  AT: 'EUR',
};
