import React, { useEffect, useState } from 'react';
import {
  Check,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Wand2,
  X,
} from 'lucide-react';
import { STOREFRONT_CONFIG } from '../config/storefrontConfig';
import type { BagItem } from '../types/store';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  items: BagItem[];
  userEmail?: string | null;
  userName?: string | null;
  isSignedIn: boolean;
  onClose: () => void;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onPersonalizeItem?: (item: BagItem) => void;
  onClearBag: () => void;
  onPlaceOrder: (payload: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    fulfillment: 'pickup' | 'shipping';
    subtotal: number;
    shipping: number;
    total: number;
  }) => Promise<string>;
  onSignInPrompt: () => void;
}

export const ShoppingBagDrawer: React.FC<ShoppingBagDrawerProps> = ({
  isOpen,
  items,
  userEmail,
  userName,
  isSignedIn,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onPersonalizeItem,
  onClearBag,
  onPlaceOrder,
  onSignInPrompt,
}) => {
  const [fulfillment, setFulfillment] = useState<'pickup' | 'shipping'>('pickup');
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [customerName, setCustomerName] = useState(userName || '');
  const [customerEmail, setCustomerEmail] = useState(userEmail || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');

  useEffect(() => {
    if (userName && !customerName) setCustomerName(userName);
    if (userEmail && !customerEmail) setCustomerEmail(userEmail);
  }, [userName, userEmail, customerName, customerEmail]);

  useEffect(() => {
    if (!isOpen && step === 'confirmed') {
      setStep('bag');
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const freeThreshold = STOREFRONT_CONFIG.brand.freeShippingThreshold;
  const flatRate = STOREFRONT_CONFIG.brand.flatShippingRate;
  const shipping =
    fulfillment === 'pickup' || subtotal === 0 || subtotal >= freeThreshold ? 0 : flatRate;
  const total = subtotal + shipping;
  const amountToFreeShipping = Math.max(0, freeThreshold - subtotal);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim() || items.length === 0) return;
    setIsSubmitting(true);
    try {
      const orderNum = await onPlaceOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        fulfillment,
        subtotal,
        shipping,
        total,
      });
      setConfirmedOrderNumber(orderNum);
      onClearBag();
      setStep('confirmed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B1117]/50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white text-[#0B1117] h-full flex flex-col shadow-2xl border-l border-[#DCE4EC]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCE4EC] flex items-center justify-between shrink-0">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#009CA6] uppercase">
              Maison 704 · Charlotte Atelier
            </p>
            <h3 className="font-serif text-2xl font-semibold text-[#0B1117]">
              {step === 'bag'
                ? 'Boutique Bag'
                : step === 'checkout'
                  ? 'Order Details'
                  : 'Order Received'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close boutique bag"
            className="w-10 h-10 rounded-full bg-[#EEF3F7] text-[#0B1117] flex items-center justify-center hover:bg-[#DCE4EC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {step === 'confirmed' ? (
            <div className="py-10 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#E6F7F8] text-[#009CA6] flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold tracking-[0.16em] text-[#0085CA] uppercase">
                  Confirmation #{confirmedOrderNumber}
                </p>
                <h4 className="font-serif text-3xl font-semibold text-[#0B1117]">
                  Thank You, {customerName || 'Friend'}!
                </h4>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Your custom 3D-printed order is queued at our Charlotte atelier.{' '}
                  {fulfillment === 'pickup'
                    ? 'We’ll email you as soon as it’s ready for complimentary boutique pickup.'
                    : 'We’ll send tracking details as soon as your pieces finish hand-finishing.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[46px] px-7 py-3 rounded-full bg-[#0B1117] hover:bg-[#0085CA] text-white text-xs font-semibold transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EEF3F7] text-[#475569] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-2xl font-semibold text-[#0B1117]">
                  Your Bag Is Empty
                </p>
                <p className="text-xs text-[#475569] max-w-xs mx-auto">
                  Explore our sculpted purses, custom bag charms, or personalized grinders &amp; rolling trays to start your capsule.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#0B1117] text-white text-xs font-semibold hover:bg-[#0085CA] transition-colors"
              >
                Explore Collection
              </button>
            </div>
          ) : step === 'bag' ? (
            <>
              {/* Fulfillment Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#EEF3F7]">
                <button
                  type="button"
                  onClick={() => setFulfillment('pickup')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    fulfillment === 'pickup'
                      ? 'bg-white text-[#0B1117] shadow-sm'
                      : 'text-[#475569] hover:text-[#0B1117]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-[#009CA6]" />
                  <span>CLT Pickup (Free)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillment('shipping')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    fulfillment === 'shipping'
                      ? 'bg-white text-[#0B1117] shadow-sm'
                      : 'text-[#475569] hover:text-[#0B1117]'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-[#0085CA]" />
                  <span>US Shipping</span>
                </button>
              </div>

              {fulfillment === 'shipping' && (
                <div className="rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] px-4 py-3 space-y-2">
                  <p className="text-xs text-[#0B1117] font-medium">
                    {amountToFreeShipping === 0
                      ? 'You unlocked complimentary insured US shipping!'
                      : `Add $${amountToFreeShipping} more for free insured US shipping.`}
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-[#DCE4EC] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0085CA] to-[#009CA6] transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((subtotal / freeThreshold) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Bag Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {item.personalization?.previewDataUrl ? (
                          <div className="w-12 h-12 rounded-xl border border-[#009CA6]/40 bg-[#0B1117] p-1 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={item.personalization.previewDataUrl}
                              alt="Custom print vector preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-11 h-11 rounded-xl border border-white shadow-sm shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${item.primaryHex} 0%, ${item.secondaryHex} 100%)`,
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[#0B1117] leading-snug">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">
                            {item.details}
                          </p>
                          {item.personalization?.customSvg && (
                            <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6F7F8] text-[#0085CA] text-[10px] font-bold">
                              {item.personalization.isFullPattern
                                ? `✓ Full Monogram Pattern SVG (${(item.personalization.patternMode || 'brick').toUpperCase()})`
                                : '✓ Print-Ready SVG Attached'}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[#0B1117] tabular-nums shrink-0">
                        ${item.price * item.qty}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#E2E8F0]">
                      <div className="inline-flex items-center gap-1 rounded-full bg-white border border-[#DCE4EC] p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, -1)}
                          aria-label={`Decrease quantity for ${item.name}`}
                          className="w-7 h-7 rounded-full hover:bg-[#EEF3F7] flex items-center justify-center text-[#0B1117]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold tabular-nums text-[#0B1117]">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, 1)}
                          aria-label={`Increase quantity for ${item.name}`}
                          className="w-7 h-7 rounded-full hover:bg-[#EEF3F7] flex items-center justify-center text-[#0B1117]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {onPersonalizeItem && (
                          <button
                            type="button"
                            onClick={() => onPersonalizeItem(item)}
                            className="px-2.5 py-1 rounded-full bg-[#E6F7F8] hover:bg-[#CCF0F3] text-[#00738C] text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>
                              {item.personalization ? 'Edit Photo / Text' : 'Add Photo / Text'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.key)}
                          className="text-xs font-medium text-[#475569] hover:text-[#0B1117] inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form id="bag-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="chkName"
                  className="block text-xs font-semibold text-[#0B1117] mb-1"
                >
                  Full Name
                </label>
                <input
                  id="chkName"
                  type="text"
                  required
                  maxLength={80}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jordan Carter"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE4EC] text-sm text-[#0B1117] focus:bg-white focus:border-[#0085CA] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="chkEmail"
                  className="block text-xs font-semibold text-[#0B1117] mb-1"
                >
                  Email Address
                </label>
                <input
                  id="chkEmail"
                  type="email"
                  required
                  maxLength={120}
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jordan@example.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE4EC] text-sm text-[#0B1117] focus:bg-white focus:border-[#0085CA] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="chkPhone"
                  className="block text-xs font-semibold text-[#0B1117] mb-1"
                >
                  Mobile Number (For Pickup / Delivery Text)
                </label>
                <input
                  id="chkPhone"
                  type="tel"
                  maxLength={30}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(704) 555-0194"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE4EC] text-sm text-[#0B1117] focus:bg-white focus:border-[#0085CA] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] text-xs text-[#475569] space-y-1">
                <p className="font-semibold text-[#0B1117]">
                  Fulfillment:{' '}
                  {fulfillment === 'pickup'
                    ? 'Free Charlotte Partner Boutique Pickup'
                    : 'Insured US Delivery'}
                </p>
                <p>
                  Each piece is 3D-printed to order in 3–5 business days with final color &amp; engraving verification.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Sticky Footer Totals & CTA */}
        {step !== 'confirmed' && items.length > 0 && (
          <div className="px-6 py-4 border-t border-[#DCE4EC] bg-white space-y-3 shrink-0 pb-safe">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#475569]">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-[#0B1117]">${subtotal}</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>
                  {fulfillment === 'pickup' ? 'Charlotte Boutique Pickup' : 'Insured Shipping'}
                </span>
                <span className="tabular-nums font-medium text-[#009CA6]">
                  {shipping === 0 ? 'Free' : `$${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#0B1117] pt-1.5 border-t border-[#EEF3F7]">
                <span>Estimated Total</span>
                <span className="tabular-nums">${total}</span>
              </div>
            </div>

            {step === 'bag' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full min-h-[48px] rounded-full bg-[#0B1117] hover:bg-[#0085CA] text-white text-sm font-semibold transition-colors"
              >
                Continue to Order Details
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('bag')}
                  className="min-h-[48px] px-4 rounded-full border border-[#DCE4EC] text-xs font-semibold text-[#0B1117] hover:border-[#0B1117]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="bag-checkout-form"
                  disabled={isSubmitting}
                  className="flex-1 min-h-[48px] rounded-full bg-[#0085CA] hover:bg-[#006BA3] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Placing Order...' : `Reserve Order · $${total}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
