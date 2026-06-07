'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { grossToNet, netToGross, COUNTRY_LABELS, type Country } from '@/lib/tax';

type Mode = 'gross' | 'net';
type Period = 'monthly' | 'yearly';

const COUNTRIES = Object.entries(COUNTRY_LABELS) as [Country, string][];

function fmt(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [country, setCountry] = useState<Country>('RS');
  const [mode, setMode] = useState<Mode>('gross');
  const [period, setPeriod] = useState<Period>('monthly');
  const [rawInput, setRawInput] = useState('');

  const result = useMemo(() => {
    const amount = parseFloat(rawInput.replace(/,/g, ''));
    if (!amount || amount <= 0) return null;

    const monthly = period === 'yearly' ? amount / 12 : amount;

    if (mode === 'gross') return grossToNet(country, monthly);
    return netToGross(country, monthly);
  }, [rawInput, country, mode, period]);

  const currency = country === 'RS' ? 'RSD' : 'EUR';

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Salary Calculator</h1>
          <p className="text-sm text-zinc-500 mt-1">Convert between gross and net salary</p>
        </div>

        <Card className="border border-zinc-200 shadow-none">
          <CardContent className="pt-6 space-y-4">

            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>I have a</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gross">Gross salary</SelectItem>
                    <SelectItem value="net">Net salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Period</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Amount ({currency})</Label>
              <Input
                type="number"
                placeholder="e.g. 150000"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="border border-zinc-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-zinc-700">Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ResultBlock label="Gross monthly" value={fmt(result.grossMonthly, currency)} />
                <ResultBlock label="Net monthly" value={fmt(result.netMonthly, currency)} highlight />
                <ResultBlock label="Gross yearly" value={fmt(result.grossAnnual, currency)} />
                <ResultBlock label="Net yearly" value={fmt(result.netAnnual, currency)} highlight />
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-2">
                <BreakdownRow label="Social contributions / month" value={fmt(result.socialContributions, currency)} />
                <BreakdownRow label="Income tax / month" value={fmt(result.incomeTax, currency)} />
                <BreakdownRow
                  label="Effective total rate"
                  value={`${(result.effectiveRate * 100).toFixed(1)}%`}
                  bold
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function ResultBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
      <p className={`text-xs ${highlight ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${highlight ? 'text-white' : 'text-zinc-900'}`}>{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={bold ? 'font-semibold text-zinc-900' : 'text-zinc-700'}>{value}</span>
    </div>
  );
}
