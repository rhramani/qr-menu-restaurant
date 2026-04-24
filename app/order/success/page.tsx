'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle2, Clock, ChefHat, UtensilsCrossed, QrCode } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const params = useSearchParams()
  const orderNum = params.get('num') ?? '—'
  const tableNum = params.get('table') ?? '—'

  const steps = [
    { icon: Clock, label: 'Order received', status: 'done' },
    { icon: ChefHat, label: 'Kitchen is preparing', status: 'active' },
    { icon: UtensilsCrossed, label: 'Ready to serve', status: 'pending' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: '#faf7f2' }}>
      {/* Success animation */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={52} className="text-green-500" strokeWidth={1.5} />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-green-300 animate-ping opacity-30" />
      </div>

      <div className="text-center mb-10 max-w-xs">
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Order Placed!</h1>
        <p className="text-stone-500">Your order has been sent to the kitchen. Sit back and relax.</p>
      </div>

      {/* Order details card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm w-full max-w-sm mb-8 overflow-hidden">
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-0.5">Order Number</p>
            <code className="text-amber-600 font-mono font-bold text-base">{orderNum}</code>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-0.5">Table</p>
            <span className="font-bold text-stone-800 text-base">{tableNum}</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="px-6 py-5 space-y-4">
          {steps.map(({ icon: Icon, label, status }, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                status === 'done' ? 'bg-green-100' :
                status === 'active' ? 'bg-amber-100' :
                'bg-stone-100'
              }`}>
                <Icon size={18} className={
                  status === 'done' ? 'text-green-600' :
                  status === 'active' ? 'text-amber-600' :
                  'text-stone-400'
                } />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  status === 'done' ? 'text-stone-700' :
                  status === 'active' ? 'text-amber-700' :
                  'text-stone-400'
                }`}>{label}</p>
              </div>
              {status === 'done' && (
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              )}
              {status === 'active' && (
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-stone-200 px-6 py-4">
          <p className="text-stone-500 text-sm text-center">
            Your server will bring the order to <strong className="text-stone-700">Table {tableNum}</strong>
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 w-full max-w-sm mb-6 text-center">
        <p className="text-amber-800 text-sm font-medium">
          Want to order more? Scan the QR code on your table again.
        </p>
      </div>

      <div className="flex items-center gap-2 text-stone-400 text-sm">
        <QrCode size={15} />
        <span>Powered by QRBite</span>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf7f2' }}>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
