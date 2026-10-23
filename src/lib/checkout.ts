import { PRODUCTS } from '../data/products.ts';

export const CURRENCY_RATES = { AED: 3.67, USD: 1, PKR: 277.55, EUR: 0.92, GBP: 0.78, CAD: 1.38 } as const;
export const PROMOS: Record<string, number> = { WELCOME10: 10, ICON15: 15, VIP15: 15, FITNESS20: 20, MOVEMENT20: 20, FLASH40: 40, FREESHIP: 0 };
export const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export function quoteCheckout(input: any) {
  const currency = input?.currency;
  if (!Object.hasOwn(CURRENCY_RATES, currency)) throw new Error('Unsupported currency.');
  const rate = CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES];
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) throw new Error('Your cart must contain between 1 and 50 items.');
  if (input.paymentMethod && input.paymentMethod !== 'credit_card') throw new Error('Only secure online payment is available.');
  const promoCode = typeof input.promoCode === 'string' ? input.promoCode.trim().toUpperCase() : '';
  if (promoCode && !Object.hasOwn(PROMOS, promoCode)) throw new Error('Invalid promo code.');
  const items = input.items.map((item: any) => {
    const product = PRODUCTS.find(product => product.id === item?.productId);
    if (!product || !product.inStock) throw new Error('A product is unavailable. Please update your cart.');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('Invalid quantity.');
    if (!product.colors.some(color => color.name === item.color) || !product.sizes.includes(item.size)) throw new Error('Please select an available color and size.');
    return { productId: product.id, name: product.name, color: item.color, size: item.size, quantity: item.quantity,
      price: roundMoney(currency === 'PKR' ? product.pkrPrice : product.usdPrice * rate), image: product.image };
  });
  const subtotal = roundMoney(items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0));
  const discount = roundMoney(subtotal * (PROMOS[promoCode] || 0) / 100);
  const threshold = currency === 'PKR' ? 8000 : roundMoney(40.87 * rate);
  const shipping = promoCode === 'FREESHIP' || subtotal >= threshold ? 0 : currency === 'PKR' ? 250 : roundMoney(5.99 * rate);
  return { currency, items, subtotal, discount, shipping, total: roundMoney(subtotal - discount + shipping), promoCode };
}

export function shippingDetails(input: any) {
  for (const key of ['customerName', 'phone', 'address', 'city', 'country']) {
    if (typeof input?.[key] !== 'string' || !input[key].trim() || input[key].length > 500) throw new Error(`Please enter a valid ${key}.`);
  }
  return { customerName: input.customerName.trim(), phone: input.phone.trim(), address: input.address.trim(), city: input.city.trim(), country: input.country.trim(), postalCode: typeof input.postalCode === 'string' ? input.postalCode.slice(0, 30) : '', shippingMethod: 'standard' };
}
