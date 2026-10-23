import React, { useState, useRef, useEffect } from 'react';
import { X, Star, ShoppingBag, ShieldCheck, Truck, RefreshCw, Check, ArrowRight, MessageCircle, Heart, ChevronDown, ChevronUp, Sparkles, Send } from 'lucide-react';
import { Product, ProductColor, ProductSize, Review } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'all',
    userName: 'Fatima Z.',
    rating: 5,
    title: 'Squat proof & beautiful fit!',
    comment: 'The 280 GSM knit is truly opaque. I wore this for heavy deadlifts in Lahore and had zero roll down on the waist.',
    date: '3 days ago',
    isVerified: true
  },
  {
    id: 'rev-2',
    productId: 'all',
    userName: 'Sana M.',
    rating: 5,
    title: 'Extremely soft microfiber',
    comment: 'Better than imported brands priced 3x higher. Delivered in 2 days to Karachi with tracked shipping.',
    date: '1 week ago',
    isVerified: true
  },
  {
    id: 'rev-3',
    productId: 'all',
    userName: 'Mariam K.',
    rating: 4,
    title: 'Great compression',
    comment: 'True to size. I am usually a Small and Small fit perfectly without pinching.',
    date: '2 weeks ago',
    isVerified: true
  }
];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  return product ? <ProductDetailContent key={product.id} product={product} onClose={onClose} /> : null;
};
const ProductDetailContent: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {

  const { formatPrice } = useCurrency();
  const { addToCart, buyNow, ownerWhatsApp, toggleWishlist, isInWishlist, setSelectedProductForDetail } = useCart();

  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [activeImage, setActiveImage] = useState<string>(product.image);

  // Accordions open/close state
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    description: true,
    specs: false,
    shipping: false,
    reviews: false
  });

  // Reviews state
  const [reviewsList, setReviewsList] = useState<Review[]>(DEFAULT_REVIEWS);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  // Gallery images (main image + hover image + category alternates)
  const galleryImages = [
    product.image,
    product.hoverImage || product.image,
    '/images/hero_pink_activewear_1790852235638.jpg',
    '/images/campaign_dark_fitness_1790852253184.jpg'
  ].filter(Boolean);

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdd = () => {
    if (!addToCart(product, selectedColor, selectedSize, quantity)) return;
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 900);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName || !newReviewComment) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      userName: newReviewName,
      rating: newReviewRating,
      title: newReviewTitle || 'Verified Athlete Review',
      comment: newReviewComment,
      date: 'Just now',
      isVerified: true
    };

    setReviewsList([newRev, ...reviewsList]);
    setReviewSubmitted(true);
    setNewReviewName('');
    setNewReviewTitle('');
    setNewReviewComment('');
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  // Related products
  const relatedProducts = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the modal content area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div
        ref={modalRef}
        className="relative bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 text-neutral-500 hover:text-black bg-white/90 backdrop-blur-xs rounded-full shadow-sm hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Close product modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <div className="px-6 py-3 border-b border-neutral-100 bg-[#FAF9F8] text-[11px] text-neutral-500 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <span className="hover:text-black cursor-pointer" onClick={onClose}>Home</span>
          <span>/</span>
          <span className="hover:text-black cursor-pointer" onClick={onClose}>Shop</span>
          <span>/</span>
          <span className="font-semibold text-neutral-700">{product.categoryLabel}</span>
          <span>/</span>
          <span className="font-black text-neutral-900 truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left Column: Product Image Gallery & Thumbnails */}
          <div className="md:col-span-6 bg-[#F6F6F6] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-neutral-200">
            {/* Main Stage Image */}
            <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden bg-white shadow-xs group">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
                referrerPolicy="no-referrer"
              />
              {product.isNew && (
                <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 animate-pulse">
                  NEW DROP
                </span>
              )}
            </div>

            {/* Thumbnails Strip */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-14 h-16 border-2 transition-all cursor-pointer overflow-hidden bg-white shrink-0 ${
                    activeImage === img ? 'border-black scale-105 shadow-sm' : 'border-neutral-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info, Variants & Accordions */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Category & SKU */}
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span className="font-bold tracking-widest uppercase text-neutral-500">{product.categoryLabel}</span>
                <span>SKU: ICON-{product.slug.toUpperCase().slice(0, 10)}</span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-neutral-900 uppercase leading-snug">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-black tabular-nums text-neutral-900">
                  {formatPrice(product.usdPrice, product.pkrPrice)}
                </span>
                {product.originalPriceUsd && (
                  <span className="text-sm tabular-nums text-neutral-400 line-through">
                    {formatPrice(product.originalPriceUsd, product.originalPricePkr)}
                  </span>
                )}
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  Secure Online Payment
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-neutral-300'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-neutral-900">{product.rating}</span>
                <span className="text-neutral-400">({product.reviewsCount} verified reviews)</span>
              </div>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {product.description}
              </p>

              {/* Color Swatches */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Color: <strong className="text-neutral-900">{selectedColor.name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setSelectedColor(color);
                        if (color.image) setActiveImage(color.image);
                      }}
                      className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        selectedColor.name === color.name
                          ? 'ring-2 ring-black ring-offset-2 border-transparent scale-110'
                          : 'border-neutral-300 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      aria-label={`Select color ${color.name}`}
                    >
                      {selectedColor.name === color.name && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Size: <strong className="text-neutral-900">{selectedSize}</strong>
                  </span>
                  <span className="text-[11px] text-neutral-500 underline cursor-pointer">
                    Size Guide (Inches)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        selectedSize === size
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Qty:
                </span>
                <div className="flex items-center border border-neutral-300 bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-xs text-neutral-600 hover:text-black cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-neutral-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="px-3 py-1.5 text-xs text-neutral-600 hover:text-black cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons: Add to Bag + Wishlist */}
              <div className="pt-3 space-y-2.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAdd}
                    disabled={isAdded || !product.inStock}
                    className="flex-1 py-4 bg-black hover:bg-neutral-800 active:scale-95 text-white text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>ADDED TO YOUR BAG!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>ADD TO CART · {formatPrice(product.usdPrice * quantity, product.pkrPrice ? product.pkrPrice * quantity : undefined)}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-4 border transition-colors cursor-pointer ${
                      isWishlisted
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-neutral-300 hover:border-black text-neutral-800'
                    }`}
                    title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>

                <button onClick={() => { if (buyNow(product, selectedColor, selectedSize, quantity)) onClose(); }} disabled={!product.inStock} className="w-full py-3 border border-black text-black text-xs font-black tracking-wider uppercase disabled:opacity-40">BUY IT NOW</button>
              </div>

              {/* Value Props Strip */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-200 text-[11px] text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Free Shipping on 150 AED+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Squat-Proof Knit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-700" />
                  <span>30-Day Easy Exchange</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>High-Density 280 GSM</span>
                </div>
              </div>

              {/* Accordion Sections: Description, Specs, Shipping, Reviews */}
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                {/* 1. Description Details */}
                <div className="border border-neutral-200">
                  <button
                    onClick={() => toggleAccordion('description')}
                    className="w-full px-4 py-3 bg-neutral-50 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 cursor-pointer"
                  >
                    <span>Product Highlights & Features</span>
                    {openAccordions.description ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openAccordions.description && (
                    <div className="p-4 text-xs text-neutral-600 space-y-2 bg-white">
                      <ul className="space-y-1.5 list-disc list-inside">
                        {product.details.map((detail, i) => (
                          <li key={i}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 2. Specifications Table */}
                <div className="border border-neutral-200">
                  <button
                    onClick={() => toggleAccordion('specs')}
                    className="w-full px-4 py-3 bg-neutral-50 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 cursor-pointer"
                  >
                    <span>Technical Fabric & Specs</span>
                    {openAccordions.specs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openAccordions.specs && (
                    <div className="p-4 bg-white text-xs">
                      <table className="w-full text-left text-neutral-700 border-collapse">
                        <tbody>
                          <tr className="border-b border-neutral-100">
                            <td className="py-1.5 font-bold text-neutral-900">Composition</td>
                            <td className="py-1.5">{product.fabric}</td>
                          </tr>
                          <tr className="border-b border-neutral-100">
                            <td className="py-1.5 font-bold text-neutral-900">Knit Density</td>
                            <td className="py-1.5">280 GSM Circular Micro-Knit</td>
                          </tr>
                          <tr className="border-b border-neutral-100">
                            <td className="py-1.5 font-bold text-neutral-900">Support Level</td>
                            <td className="py-1.5">{product.supportLevel || 'Medium Support'}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-bold text-neutral-900">Origin</td>
                            <td className="py-1.5">Manufactured & Fulfilled in Karachi, Pakistan</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. Shipping & Payment Policy */}
                <div className="border border-neutral-200">
                  <button
                    onClick={() => toggleAccordion('shipping')}
                    className="w-full px-4 py-3 bg-neutral-50 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 cursor-pointer"
                  >
                    <span>Shipping & Payment Terms</span>
                    {openAccordions.shipping ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openAccordions.shipping && (
                    <div className="p-4 bg-white text-xs text-neutral-600 space-y-2">
                      <p>• <strong>Dubai Delivery:</strong> Same-day or 24 hours via courier express.</p>
                      <p>• <strong>All Other Emirates (Abu Dhabi, Sharjah, Ajman, RAK, etc.):</strong> 1–2 business days.</p>
                      <p>• <strong>Cards & Apple Pay:</strong> Pay securely through our online checkout.</p>
                      <p>• <strong>Free Delivery:</strong> Automatically applied at checkout on all orders above 150 AED.</p>
                    </div>
                  )}
                </div>

                {/* 4. Customer Reviews Breakdown */}
                <div className="border border-neutral-200">
                  <button
                    onClick={() => toggleAccordion('reviews')}
                    className="w-full px-4 py-3 bg-neutral-50 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 cursor-pointer"
                  >
                    <span>Verified Reviews ({reviewsList.length})</span>
                    {openAccordions.reviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openAccordions.reviews && (
                    <div className="p-4 bg-white space-y-4">
                      {/* Star Rating Breakdown Bar Chart */}
                      <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-neutral-900">
                          <span>Overall Rating</span>
                          <span>4.9 / 5.0</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="w-6">5★</span>
                            <div className="flex-1 bg-neutral-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-amber-400 h-full w-[85%]" />
                            </div>
                            <span className="w-8 text-right text-neutral-500">85%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6">4★</span>
                            <div className="flex-1 bg-neutral-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-amber-400 h-full w-[12%]" />
                            </div>
                            <span className="w-8 text-right text-neutral-500">12%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6">3★</span>
                            <div className="flex-1 bg-neutral-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-amber-400 h-full w-[3%]" />
                            </div>
                            <span className="w-8 text-right text-neutral-500">3%</span>
                          </div>
                        </div>
                      </div>

                      {/* Submit Review Form */}
                      <form onSubmit={handleSubmitReview} className="space-y-3 border-t border-neutral-100 pt-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                          Leave a Verified Review
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-neutral-500">Your Rating:</span>
                          <div className="flex gap-1 text-amber-400 cursor-pointer">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReviewRating(star)}
                                className="cursor-pointer"
                              >
                                <Star
                                  className={`w-4 h-4 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <input
                            type="text"
                            placeholder="Your Name (e.g. Sana K.)"
                            value={newReviewName}
                            onChange={(e) => setNewReviewName(e.target.value)}
                            required
                            className="p-2 border border-neutral-300 focus:outline-hidden focus:border-black"
                          />
                          <input
                            type="text"
                            placeholder="Headline (e.g. Squat proof fit)"
                            value={newReviewTitle}
                            onChange={(e) => setNewReviewTitle(e.target.value)}
                            className="p-2 border border-neutral-300 focus:outline-hidden focus:border-black"
                          />
                        </div>
                        <textarea
                          placeholder="Tell us about the fabric, sizing, compression and gym performance..."
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          required
                          rows={2}
                          className="w-full p-2 border border-neutral-300 text-xs focus:outline-hidden focus:border-black"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit Review</span>
                        </button>
                        {reviewSubmitted && (
                          <p className="text-[11px] text-emerald-600 font-bold">
                            ✓ Thank you! Your review has been submitted and verified.
                          </p>
                        )}
                      </form>

                      {/* Reviews List */}
                      <div className="space-y-3 pt-2">
                        {reviewsList.map((rev) => (
                          <div key={rev.id} className="p-3 bg-neutral-50 border border-neutral-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-900">{rev.userName}</span>
                              <div className="flex text-amber-400">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            </div>
                            <p className="font-semibold text-neutral-800">{rev.title}</p>
                            <p className="text-neutral-600 leading-relaxed text-[11px]">{rev.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="pt-6 border-t border-neutral-200">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 mb-3">
                    Pairs Perfectly With
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {relatedProducts.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => setSelectedProductForDetail(rel)}
                        className="border border-neutral-200 p-2 cursor-pointer hover:border-black transition-colors bg-white group text-center"
                      >
                        <img src={rel.image} alt={rel.name} className="w-full aspect-[3/4] object-cover mb-1" />
                        <p className="text-[10px] font-bold uppercase truncate text-neutral-900 group-hover:text-neutral-600">
                          {rel.name}
                        </p>
                        <p className="text-[10px] font-black text-neutral-900">
                          {formatPrice(rel.usdPrice, rel.pkrPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Mobile Add-to-Bag Action Bar */}
        <div className="md:hidden sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 flex items-center justify-between gap-3 shadow-lg z-30">
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block truncate">
              {selectedColor.name} · Size {selectedSize}
            </span>
            <span className="text-sm font-black text-neutral-900 tabular-nums">
              {formatPrice(product.usdPrice * quantity, product.pkrPrice ? product.pkrPrice * quantity : undefined)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleWishlist(product)}
              className={`p-2.5 border transition-colors cursor-pointer ${
                isWishlisted
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-neutral-300 text-neutral-800'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>

            <button
              onClick={handleAdd}
              disabled={isAdded || !product.inStock}
              className="py-2.5 px-4 bg-black hover:bg-neutral-800 active:scale-95 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ADDED!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>ADD TO CART</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

