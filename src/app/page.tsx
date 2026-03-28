import Link from 'next/link';
import { ShoppingCart, ArrowRight, TrendingDown, RefreshCw, Search } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="py-16 sm:py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Compare your grocery basket
          <br />
          <span className="text-brand-600">across supermarkets</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Build your basket, compare totals, and discover cheaper substitutions.
          Find where your weekly shop costs the least.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/basket" className="btn-primary gap-2 px-6 py-3 text-base">
            <ShoppingCart className="h-5 w-5" />
            Start Your Basket
          </Link>
          <Link href="/basket?demo=true" className="btn-secondary gap-2 px-6 py-3 text-base">
            Load Demo Basket
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">How it works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <Search className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">1. Build your basket</h3>
            <p className="mt-2 text-sm text-gray-600">
              Search for products, choose your preferences, and add items to your basket. Pick exact products or stay flexible.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <RefreshCw className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">2. Compare prices</h3>
            <p className="mt-2 text-sm text-gray-600">
              We check prices across multiple supermarkets and find the best deals, including smart substitutions.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <TrendingDown className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">3. Save money</h3>
            <p className="mt-2 text-sm text-gray-600">
              See a ranked breakdown of supermarkets by total cost. Know exactly how much you save and where.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
