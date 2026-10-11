import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { Product } from '../types';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setSelectedProductForDetail } = useCart();
  const { formatPrice } = useCurrency();
  const [query, setQuery] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the modal content area
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSearchOpen, setIsSearchOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.colors.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [query]);

  if (!isSearchOpen) return null;

  const popularSearches = [
    'Seamless Leggings',
    'Sports Bra',
    'Squat Proof',
    'Cycling Shorts',
    'Ribbed Tank'
  ];

  const handleSelectProduct = (product: Product) => {
    setIsSearchOpen(false);
    setSelectedProductForDetail(product);
  };

  return (
    <div
      onClick={() => setIsSearchOpen(false)}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-2xl rounded-none shadow-2xl border border-neutral-200 overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 gap-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leggings, sports bras, fabrics..."
            className="flex-1 text-sm font-medium text-neutral-900 focus:outline-hidden placeholder:text-neutral-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-400 hover:text-black p-1 text-xs"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 text-neutral-400 hover:text-black"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Popular Tags */}
        <div className="px-4 py-3 bg-[#FAF9F8] border-b border-neutral-100 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Popular:
          </span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="text-[11px] font-medium px-2 py-0.5 bg-white border border-neutral-200 text-neutral-700 hover:border-black hover:text-black transition-colors"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {query.trim() === '' ? (
            <div className="text-center py-10 text-neutral-400 text-xs">
              Type above to search activewear catalog
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-bold text-neutral-800">No activewear matched "{query}"</p>
              <p className="text-xs text-neutral-500">
                Try searching for "seamless", "bra", or "shorts".
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Found {filteredProducts.length} results
              </p>
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="py-3 flex items-center justify-between hover:bg-neutral-50 px-2 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-neutral-100 overflow-hidden border border-neutral-200 shrink-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase group-hover:text-black">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500">{p.categoryLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-900 tabular-nums">
                      {formatPrice(p.usdPrice, p.pkrPrice)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 group-hover:text-black transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
