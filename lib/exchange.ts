export async function getEurToRsd(): Promise<number> {
  const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=RSD');
  if (!res.ok) throw new Error('Failed to fetch exchange rate');
  const data = await res.json();
  return data.rates.RSD as number;
}
