'use client';

import { useState, useMemo } from 'react';
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

// Approximate rate — update manually a few times a year
const EUR_TO_RSD = 117;

type InputCurrency = 'RSD' | 'EUR';
const COUNTRIES = Object.keys(COUNTRY_LABELS) as Country[];

function fmtRSD(value: number) {
  return new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 0 }).format(value) + ' RSD';
}

function fmtEUR(value: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [netInput, setNetInput] = useState('');
  const [inputCurrency, setInputCurrency] = useState<InputCurrency>('EUR');

  const results = useMemo(() => {
    const amount = parseFloat(netInput.replace(/,/g, ''));
    if (!amount || amount <= 0) return null;

    // Convert input to each country's native currency for tax calc
    return COUNTRIES.map((country) => {
      const isSerbia = country === 'RS';
      const nativeNet = isSerbia
        ? (inputCurrency === 'EUR' ? amount * EUR_TO_RSD : amount)
        : (inputCurrency === 'RSD' ? amount / EUR_TO_RSD : amount);

      const { grossMonthly, grossAnnual } = netToGross(country, nativeNet);

      const grossMonthlyRSD = isSerbia ? grossMonthly : grossMonthly * EUR_TO_RSD;
      const grossMonthlyEUR = isSerbia ? grossMonthly / EUR_TO_RSD : grossMonthly;

      return {
        country,
        label: COUNTRY_LABELS[country],
        grossMonthlyRSD,
        grossMonthlyEUR,
        grossYearlyRSD: grossMonthlyRSD * 12,
        grossYearlyEUR: grossMonthlyEUR * 12,
      };
    });
  }, [netInput, inputCurrency]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">

        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Salary Calculator</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Enter your desired net monthly salary to see what gross you need to earn in each country.
          </p>
        </div>

        <Card className="border border-zinc-200 shadow-none">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Desired net monthly salary</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={inputCurrency === 'EUR' ? 'e.g. 3,000' : 'e.g. 150,000'}
                  value={netInput}
                  onChange={(e) => setNetInput(e.target.value)}
                  className="flex-1"
                />
                <Select value={inputCurrency} onValueChange={(v) => { setInputCurrency(v as InputCurrency); setNetInput(''); }}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="RSD">RSD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-zinc-400">Rate used: 1 EUR = {EUR_TO_RSD} RSD</p>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-3">
            {results.map(({ country, label, grossMonthlyEUR, grossMonthlyRSD, grossYearlyEUR, grossYearlyRSD }) => (
              <Card key={country} className="border border-zinc-200 shadow-none">
                <CardContent className="py-4 px-5">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">{label}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Gross monthly</p>
                      <p className="text-base font-semibold text-zinc-900">{fmtEUR(grossMonthlyEUR)}</p>
                      <p className="text-xs text-zinc-400">{fmtRSD(grossMonthlyRSD)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Gross yearly</p>
                      <p className="text-base font-semibold text-zinc-900">{fmtEUR(grossYearlyEUR)}</p>
                      <p className="text-xs text-zinc-400">{fmtRSD(grossYearlyRSD)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
