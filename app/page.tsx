import Link from 'next/link'
import { ArrowRight, QrCode, Zap, BarChart3, Shield, CheckCircle2, ChevronRight } from 'lucide-react'

const features = [
  { icon: QrCode, title: 'Instant QR Menus', desc: 'Generate unique QR codes per table. Customers scan and order — no app download needed.' },
  { icon: Zap, title: 'Real-time Orders', desc: 'Orders appear on the kitchen display the moment they\'re placed. Zero delay, zero missed tickets.' },
  { icon: BarChart3, title: 'Live Dashboard', desc: 'Monitor table status, revenue, and order flow from a single beautiful screen.' },
  { icon: Shield, title: 'Multi-tenant SaaS', desc: 'Manage any number of restaurant locations with role-based access and isolated data.' },
]

const plans = [
  { name: 'Starter', price: '₹999', period: '/mo', tables: '5 tables', items: '30 items', cta: 'Start free trial' },
  { name: 'Professional', price: '₹2,499', period: '/mo', tables: '20 tables', items: '150 items', cta: 'Most popular', popular: true },
  { name: 'Enterprise', price: '₹4,999', period: '/mo', tables: 'Unlimited', items: 'Unlimited items', cta: 'Contact sales' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface-950 text-slate-100 overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/60 bg-surface-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <QrCode className="w-4.5 h-4.5 text-slate-900" size={18} />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">QRBite</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
            <a href="#" className="hover:text-slate-100 transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-100 transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium bg-brand-500 hover:bg-brand-400 text-slate-900 px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-5">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b33_1px,transparent_1px),linear-gradient(to_bottom,#1e293b33_1px,transparent_1px)] bg-[size:60px_60px]" />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/8 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium px-3.5 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Now serving 500+ restaurants across India
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            The smarter way
            <br />
            <span className="text-brand-400 italic">restaurants</span> take orders
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            QRBite turns every table into a seamless ordering experience.
            Scan a QR code, browse the menu, place an order — no app, no waiter, no wait.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="group flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-slate-900 font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-glow-amber"
            >
              Start free 14-day trial
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 text-slate-400 hover:text-slate-100 font-medium px-6 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              See how it works
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        {/* Hero dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="relative rounded-2xl border border-slate-700/60 bg-surface-900 shadow-premium overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-surface-900">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-slate-800 rounded-md h-6 max-w-xs px-3 flex items-center">
                  <span className="text-slate-500 text-xs">app.qrbite.io/dashboard</span>
                </div>
              </div>
            </div>
            {/* Mock dashboard content */}
            <div className="grid grid-cols-12 h-[360px]">
              {/* Sidebar */}
              <div className="col-span-2 border-r border-slate-800 p-3 space-y-1">
                {['Dashboard', 'Orders', 'Menu', 'Tables', 'QR Codes'].map((item, i) => (
                  <div key={item} className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 ${i === 0 ? 'bg-brand-500/15 text-brand-400' : 'text-slate-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-brand-500' : 'bg-slate-700'}`} />
                    {item}
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="col-span-10 p-5">
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total Orders', value: '247', change: '+12%' },
                    { label: 'Revenue', value: '₹84,290', change: '+8%' },
                    { label: 'Active Tables', value: '8/14', change: '' },
                    { label: 'Pending', value: '3', change: '' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-surface-800 rounded-lg p-3 border border-slate-700/50">
                      <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
                      <p className="text-slate-100 font-semibold text-base">{stat.value}</p>
                      {stat.change && <p className="text-green-400 text-xs mt-0.5">{stat.change}</p>}
                    </div>
                  ))}
                </div>
                <div className="bg-surface-800 rounded-lg border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50">
                    <p className="text-slate-300 text-xs font-medium">Live Orders</p>
                  </div>
                  {[
                    { num: '#20240424-003', table: 'Table 5', items: '3 items', status: 'Preparing', statusColor: 'text-blue-400' },
                    { num: '#20240424-002', table: 'Table 2', items: '5 items', status: 'Ready', statusColor: 'text-green-400' },
                    { num: '#20240424-001', table: 'Table 9', items: '2 items', status: 'Pending', statusColor: 'text-brand-400' },
                  ].map(order => (
                    <div key={order.num} className="flex items-center px-4 py-2 border-b border-slate-800/60 text-xs">
                      <span className="text-slate-500 w-32">{order.num}</span>
                      <span className="text-slate-400 flex-1">{order.table}</span>
                      <span className="text-slate-500 flex-1">{order.items}</span>
                      <span className={`font-medium ${order.statusColor}`}>{order.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect below card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-brand-500/10 blur-2xl rounded-full" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium mb-3 tracking-wide uppercase">Built for operators</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Everything your restaurant needs</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">From QR generation to real-time kitchen updates — one platform handles it all.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group bg-surface-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-7 transition-all duration-200 hover:shadow-card-hover">
                <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center mb-5 group-hover:bg-brand-500/15 transition-colors">
                  <Icon className="text-brand-400" size={20} />
                </div>
                <h3 className="font-semibold text-slate-100 text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Simple, honest pricing</h2>
            <p className="text-slate-400 text-lg">Start free. Upgrade when you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {plans.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl p-7 border transition-all duration-200 ${plan.popular ? 'bg-brand-500/8 border-brand-500/40 shadow-glow-amber' : 'bg-surface-900 border-slate-800'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <p className="font-medium text-slate-300 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-display text-4xl font-bold text-slate-100">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
                <div className="space-y-3 mb-7">
                  {[plan.tables, plan.items, 'Real-time orders', 'QR generation', 'Analytics'].map(feature => (
                    <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <CheckCircle2 size={15} className="text-brand-400 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link
                  href="/login"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${plan.popular ? 'bg-brand-500 hover:bg-brand-400 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-5">Ready to modernize your restaurant?</h2>
          <p className="text-slate-400 text-lg mb-8">Join 500+ restaurants already using QRBite to serve more, faster.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-slate-900 font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base"
          >
            Start your free trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <QrCode size={15} className="text-slate-900" />
            </div>
            <span className="font-display font-semibold text-slate-300">QRBite</span>
          </div>
          <p className="text-slate-600 text-sm">© 2024 QRBite. Built for restaurants that move fast.</p>
        </div>
      </footer>
    </main>
  )
}
