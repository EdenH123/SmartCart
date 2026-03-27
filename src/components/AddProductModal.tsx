'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, ChevronRight, ShoppingCart } from 'lucide-react';
import { searchCategoriesAction, searchProductsAction } from '@/lib/actions';
import type { CategoryWithAttributes, MatchMode, UserConstraints, BasketItemInput, ProductSearchResult } from '@/types';

type Step = 'search' | 'configure' | 'preview';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (item: BasketItemInput) => void;
}

export default function AddProductModal({ open, onClose, onAdd }: Props) {
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryWithAttributes[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithAttributes | null>(null);
  const [constraints, setConstraints] = useState<UserConstraints>({});
  const [matchMode, setMatchMode] = useState<MatchMode>('flexible');
  const [quantity, setQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [matchingProducts, setMatchingProducts] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setStep('search');
    setSearchQuery('');
    setCategories([]);
    setSelectedCategory(null);
    setConstraints({});
    setMatchMode('flexible');
    setQuantity(1);
    setSelectedProduct(null);
    setMatchingProducts([]);
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  // Search categories
  useEffect(() => {
    if (searchQuery.length < 1) {
      setCategories([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchCategoriesAction(searchQuery);
      setCategories(results);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCategory = (cat: CategoryWithAttributes) => {
    setSelectedCategory(cat);
    // Init constraints with 'any' for all attributes
    const initConstraints: UserConstraints = {};
    for (const attr of cat.attributes) {
      initConstraints[attr.key] = 'any';
    }
    setConstraints(initConstraints);
    setStep('configure');
  };

  const handleConstraintChange = (key: string, value: string) => {
    setConstraints((prev) => ({ ...prev, [key]: value }));
  };

  // Fetch matching products when constraints change
  useEffect(() => {
    if (!selectedCategory || step !== 'configure') return;
    const timer = setTimeout(async () => {
      setLoading(true);
      const filtered: Record<string, string | number | boolean | null> = {};
      for (const [k, v] of Object.entries(constraints)) {
        if (v !== 'any') filtered[k] = v;
      }
      const products = await searchProductsAction(selectedCategory.id, filtered);
      setMatchingProducts(products);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [constraints, selectedCategory, step]);

  const buildDisplayName = () => {
    if (!selectedCategory) return '';
    const parts = [selectedCategory.name];
    for (const attr of selectedCategory.attributes) {
      const val = constraints[attr.key];
      if (val && val !== 'any') {
        parts.push(String(val));
      }
    }
    return parts.join(' ');
  };

  const handleGoToPreview = () => {
    setStep('preview');
  };

  const handleAdd = () => {
    if (!selectedCategory) return;

    const displayName = selectedProduct?.name ?? buildDisplayName();
    const cleanConstraints: UserConstraints = {};
    for (const [k, v] of Object.entries(constraints)) {
      if (v !== 'any') cleanConstraints[k] = v;
    }

    onAdd({
      categoryId: selectedCategory.id,
      quantity,
      matchMode,
      selectedCanonicalProductId: matchMode === 'exact' ? (selectedProduct?.id ?? null) : null,
      userConstraints: cleanConstraints,
      displayName,
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'search' && 'Add Product'}
            {step === 'configure' && selectedCategory?.name}
            {step === 'preview' && 'Review & Add'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step: Search */}
        {step === 'search' && (
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search for a product (e.g., milk, eggs, bread...)"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mt-4 max-h-64 overflow-y-auto">
              {categories.length === 0 && searchQuery.length > 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No categories found</p>
              )}
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-500">
                      {cat.attributes.map((a) => a.label).join(' · ')}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>

            {searchQuery.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">
                Start typing to search product categories
              </p>
            )}
          </div>
        )}

        {/* Step: Configure */}
        {step === 'configure' && selectedCategory && (
          <div className="p-6">
            <button
              onClick={() => setStep('search')}
              className="mb-4 text-sm text-brand-600 hover:text-brand-700"
            >
              &larr; Back to search
            </button>

            <div className="space-y-4">
              {selectedCategory.attributes.map((attr) => (
                <div key={attr.key}>
                  <label className="block text-sm font-medium text-gray-700">{attr.label}</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={String(constraints[attr.key] ?? 'any')}
                    onChange={(e) => handleConstraintChange(attr.key, e.target.value)}
                  >
                    <option value="any">Any</option>
                    {attr.possibleValues.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Brand selection from matching products */}
              {matchingProducts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={selectedProduct?.id ?? 'any'}
                    onChange={(e) => {
                      if (e.target.value === 'any') {
                        setSelectedProduct(null);
                      } else {
                        const prod = matchingProducts.find((p) => p.id === e.target.value);
                        setSelectedProduct(prod ?? null);
                      }
                    }}
                  >
                    <option value="any">Any brand</option>
                    {matchingProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.brand ?? 'Unbranded'} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    className="btn-secondary px-3 py-1"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-medium">{quantity}</span>
                  <button
                    className="btn-secondary px-3 py-1"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Match Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Match Mode</label>
                <div className="mt-2 flex gap-3">
                  <button
                    className={`flex-1 rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                      matchMode === 'flexible'
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setMatchMode('flexible')}
                  >
                    <p className="font-medium">Flexible</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Allow cheaper alternatives
                    </p>
                  </button>
                  <button
                    className={`flex-1 rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                      matchMode === 'exact'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setMatchMode('exact')}
                  >
                    <p className="font-medium">Exact</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Only this specific product
                    </p>
                  </button>
                </div>
              </div>

              {loading && (
                <p className="text-xs text-gray-400">Finding matching products...</p>
              )}
              {!loading && matchingProducts.length > 0 && (
                <p className="text-xs text-gray-500">
                  {matchingProducts.length} matching product{matchingProducts.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoToPreview}
                className="btn-primary w-full gap-2"
              >
                Review
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && selectedCategory && (
          <div className="p-6">
            <button
              onClick={() => setStep('configure')}
              className="mb-4 text-sm text-brand-600 hover:text-brand-700"
            >
              &larr; Back to options
            </button>

            <div className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedProduct?.name ?? buildDisplayName()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{selectedCategory.name}</p>
                </div>
                <span className={matchMode === 'exact' ? 'badge-exact' : 'badge-flexible'}>
                  {matchMode}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                {Object.entries(constraints).map(([key, value]) => {
                  if (value === 'any' || !value) return null;
                  return (
                    <span key={key} className="rounded-md bg-gray-100 px-2 py-1">
                      {key}: {String(value)}
                    </span>
                  );
                })}
                <span className="rounded-md bg-gray-100 px-2 py-1">qty: {quantity}</span>
              </div>

              {selectedProduct && (
                <p className="mt-2 text-xs text-gray-500">
                  Brand: {selectedProduct.brand ?? 'Any'}
                </p>
              )}
            </div>

            <button
              onClick={handleAdd}
              className="btn-primary mt-6 w-full gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Basket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
