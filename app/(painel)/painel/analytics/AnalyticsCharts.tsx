'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

import { formatCurrency } from '@/utils/format'

type MonthlyRow = {
  month: string
  gross: number
  net: number
}

type WeeklyRow = {
  week: string
  aulas: number
}

function formatBRL(v: number) {
  return `R$${(v / 1000).toFixed(1)}k`
}

export default function AnalyticsCharts({
  monthlyData,
  weeklyLessons,
}: {
  monthlyData: MonthlyRow[]
  weeklyLessons: WeeklyRow[]
}) {
  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">Receita mensal (R$)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatBRL} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                formatCurrency(value ?? 0),
                name === 'gross' ? 'Bruto' : 'Liquido',
              ]}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
            />
            <Legend formatter={v => v === 'gross' ? 'Bruto' : 'Liquido'} iconType="circle" />
            <Area type="monotone" dataKey="gross" stroke="#1D4ED8" strokeWidth={2} fill="url(#grossGrad)" />
            <Area type="monotone" dataKey="net" stroke="#059669" strokeWidth={2} fill="url(#netGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">Aulas por semana (ultimas 4 semanas)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyLessons} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
            <Bar dataKey="aulas" fill="#1D4ED8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
