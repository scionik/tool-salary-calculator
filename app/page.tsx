'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { netToGross, COUNTRY_LABELS, type Country } from '@/lib/tax';
import { getEurToRsd } from '@/lib/exchange';

type InputCurrency = 'RSD' | 'EUR';
const COUNTRIES = Object.entries(COUNTRY_LABELS) as [Country, string][];

function fmtRSD(value: number) {
  return new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 0 }).format(value) + ' RSD';
}

function fmtEUR(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export default function Home() {
  const [country, setCountry] = useState<Country>('RS');
  const [inputCurrency, setInputCurrency] = useState<InputCurrency>('RSD');
  const [netInput, setNetInput] = useState('');
  const [eurToRsd, setEurToRsd] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [rateError, setRateError] = useState(false);

  useEffect(() => {
    getEurToRsd()
      .then((rate) => {
        setEurToRsd(rate);
        setRateDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
      })
      .catch(() => setRateError(true));
  }, []);

  const result = useMemo(() => {
    const net = parseFloat(netInput.replace(/,/g, ''));
    if (!net || net <= 0 || !eurToRsd) return null;

    // The tax functions always work in the country's native currency.
    // Serbia = RSD, others = EUR. Convert input if needed.
    const isSerbia = country === 'RS';
    const nativeNet = isSerbia
      ? (inputCurrency === 'EUR' ? net * eurToRsd : net)
      : (inputCurrency === 'RSD' ? net / eurToRsd : net);

    const taxResult = netToGross(country, nativeNet);
    const grossMonthly = taxResult.grossMonthly;
    const grossYearly = taxResult.grossAnnual;

    if (isSerbia) {
      return {
        grossMonthly,
        grossYearly,
        grossMonthlyAlt: grossMonthly / eurToRsd,
        grossYearlyAlt: grossYearly / eurToRsd,
        primaryFmt: fmtRSD,
        altFmt: fmtEUR,
        altLabel: 'EUR equivalent',
      };
    } else {
      return {
        grossMonthly,
        grossYearly,
        grossMonthlyAlt: grossMonthly * eurToRsd,
        grossYearlyAlt: grossYearly * eurToRsd,
        primaryFmt: fmtEUR,
        altFmt: fmtRSD,
        altLabel: 'RSD equivalent',
      };
    }
  }, [netInput, country, inputCurrency, eurToRsd]);

  const placeholder = inputCurrency === 'RSD' ? 'e.g. 150,000' : 'e.g. 3,000';

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Salary Calculator</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Enter your desired net monthly salary to see the gross equivalent.
          </p>
        </div>

        <Card className="border border-zinc-200 shadow-none">
          <CardContent className="pt-6 space-y-4">

            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v as Country); setNetInput(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(([code, label]) => (
                    <SelectItem key={code} value={code}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Desired net monthly salary</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={placeholder}
                  value={netInput}
                  onChange={(e) => setNetInput(e.target.value)}
                  className="flex-1"
                />
                <Select value={inputCurrency} onValueChange={(v) => { setInputCurrency(v as InputCurrency); setNetInput(''); }}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RSD">RSD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {rateDate && !rateError && (
              <p className="text-xs text-zinc-400">
                Rate as of {rateDate}: 1 EUR = {eurToRsd?.toFixed(2)} RSD
              </p>
            )}
            {rateError && (
              <p className="text-xs text-red-400">Could not fetch live exchange rate.</p>
            )}

          </CardContent>
        </Card>

        {result && (
          <div className="space-y-3">
            <Row
              label="Gross monthly"
              primary={result.primaryFmt(result.grossMonthly)}
              alt={result.altFmt(result.grossMonthlyAlt)}
              altLabel={result.altLabel}
              highlight
            />
            <Row
              label="Gross yearly"
              primary={result.primaryFmt(result.grossYearly)}
              alt={result.altFmt(result.grossYearlyAlt)}
              altLabel={result.altLabel}
            />
          </div>
        )}

      </div>
    </main>
  );
}

function Row({
  label,
  primary,
  alt,
  altLabel,
  highlight,
}: {
  label: string;
  primary: string;
  alt: string;
  altLabel: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`border shadow-none ${highlight ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-200'}`}>
      <CardContent className="py-4 px-5">
        <p className={`text-xs mb-0.5 ${highlight ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</p>
        <p className={`text-xl font-semibold ${highlight ? 'text-white' : 'text-zinc-900'}`}>{primary}</p>
        <p className={`text-xs mt-0.5 ${highlight ? 'text-zinc-500' : 'text-zinc-400'}`}>{altLabel}: {alt}</p>
      </CardContent>
    </Card>
  );
}
