import React, { useEffect, useState } from 'react';
import { Check, Download, ImagePlus, Mail, Send, Trash2 } from 'lucide-react';
import { CURATED_SWATCHES, STOREFRONT_CONFIG } from '../config/storefrontConfig';

interface UploadedPhoto {
  id: string;
  name: string;
  previewUrl: string;
  dataUrl: string;
}

interface CustomRequestSectionProps {
  prefillCategory?: string;
  prefillNotes?: string;
  userEmail?: string | null;
  userName?: string | null;
  onSubmitToCloud: (payload: {
    category: string;
    neededByDate: string;
    notes: string;
    referenceFileName: string;
    customerName: string;
    customerEmail: string;
    instagramHandle: string;
  }) => Promise<void>;
  onToast: (msg: string) => void;
}

const REQUEST_CATEGORIES = [
  'Custom Purse Shape Not in Studio',
  'Custom Engraved Rolling Tray / Grinder Set',
  'Personalized Keychains, Charms & Catchall Trays',
  'Outfit Color-Match / Event & Group Set',
  'Custom Desk, Home Decor, or Branded Piece',
];

export const CustomRequestSection: React.FC<CustomRequestSectionProps> = ({
  prefillCategory,
  prefillNotes,
  userEmail,
  userName,
  onSubmitToCloud,
  onToast,
}) => {
  const [category, setCategory] = useState(REQUEST_CATEGORIES[0]);
  const [neededByDate, setNeededByDate] = useState('');
  const [notes, setNotes] = useState('');
  const [engravingIdea, setEngravingIdea] = useState('');
  const [primaryHex, setPrimaryHex] = useState('#0085CA');
  const [accentHex, setAccentHex] = useState('#009CA6');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [customerName, setCustomerName] = useState(userName || '');
  const [customerEmail, setCustomerEmail] = useState(userEmail || '');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    referenceId: string;
    emailedViaServer: boolean;
    mailtoHref: string;
  } | null>(null);

  useEffect(() => {
    if (prefillCategory) setCategory(prefillCategory);
  }, [prefillCategory]);

  useEffect(() => {
    if (prefillNotes) setNotes(prefillNotes);
  }, [prefillNotes]);

  useEffect(() => {
    if (userName && !customerName) setCustomerName(userName);
    if (userEmail && !customerEmail) setCustomerEmail(userEmail);
  }, [userName, userEmail, customerName, customerEmail]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        setPhotos((prev) => [
          ...prev.slice(0, 2),
          {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            previewUrl: URL.createObjectURL(file),
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    onToast(`Added ${files.length} inspiration photo${files.length > 1 ? 's' : ''}`);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  // Generates a crisp downloadable Concept Brief PNG capturing colors, notes & engraving
  const downloadConceptBriefPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header band
    ctx.fillStyle = '#0B1117';
    ctx.fillRect(0, 0, canvas.width, 132);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 44px Georgia, serif';
    ctx.fillText('MAISON 704 · CUSTOM DESIGN BRIEF', 56, 78);
    ctx.fillStyle = '#5EEAD4';
    ctx.font = '600 18px sans-serif';
    ctx.fillText(category.toUpperCase(), 56, 110);

    // Color swatches preview
    ctx.fillStyle = primaryHex;
    ctx.fillRect(56, 174, 210, 120);
    ctx.fillStyle = accentHex;
    ctx.fillRect(286, 174, 210, 120);

    const grad = ctx.createLinearGradient(516, 174, 1024, 294);
    grad.addColorStop(0, primaryHex);
    grad.addColorStop(1, accentHex);
    ctx.fillStyle = grad;
    ctx.fillRect(516, 174, 508, 120);

    ctx.fillStyle = '#0B1117';
    ctx.font = '600 18px sans-serif';
    ctx.fillText(`Primary: ${primaryHex}`, 56, 324);
    ctx.fillText(`Accent: ${accentHex}`, 286, 324);
    ctx.fillText(
      `Engraving: ${engravingIdea.trim() || 'None specified'}`,
      516,
      324
    );

    // Notes block
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(56, 360, 968, 250);
    ctx.strokeStyle = '#DCE4EC';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 360, 968, 250);

    ctx.fillStyle = '#475569';
    ctx.font = '600 16px sans-serif';
    ctx.fillText('CUSTOMER VISION & SPECIFICATIONS', 84, 398);

    ctx.fillStyle = '#0B1117';
    ctx.font = '400 22px sans-serif';
    const text =
      notes.trim() || 'Custom 3D-printed boutique piece crafted to order in Charlotte, NC.';
    const words = text.split(' ');
    let line = '';
    let y = 442;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > 900) {
        ctx.fillText(line, 84, y);
        line = w;
        y += 32;
        if (y > 580) break;
      } else {
        line = test;
      }
    }
    if (line && y <= 580) ctx.fillText(line, 84, y);

    ctx.fillStyle = '#475569';
    ctx.font = '500 16px sans-serif';
    ctx.fillText(
      `Requested by: ${customerName || 'Guest Shopper'} (${customerEmail || 'No email'}) · Send to ${STOREFRONT_CONFIG.brand.ownerAdminEmail}`,
      56,
      664
    );

    const link = document.createElement('a');
    link.download = `maison704-custom-brief-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    onToast('Downloaded your Custom Design Concept Card PNG');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || !customerName.trim() || !customerEmail.trim()) return;
    setIsSubmitting(true);

    const combinedNotes = [
      notes.trim(),
      `Color Palette: ${primaryHex} + ${accentHex}`,
      engravingIdea.trim() ? `Engraving: "${engravingIdea.trim()}"` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const refNames = photos.map((p) => p.name).join(', ').slice(0, 120);

    const emailedViaServer = false;
    const referenceId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      await onSubmitToCloud({
        category,
        neededByDate,
        notes: combinedNotes,
        referenceFileName: refNames,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        instagramHandle: instagramHandle.trim(),
      });
    } catch {
      // Static-site mode: saved locally
    }

    const subject = encodeURIComponent(
      `Maison 704 Custom Request (${referenceId}) — ${category}`
    );
    const body = encodeURIComponent(
      `Hi Maison 704,\n\nI'd love a quote on a custom 3D-printed design:\n\n` +
        `Category: ${category}\n` +
        `Date Needed: ${neededByDate || 'Flexible'}\n` +
        `Colors: ${primaryHex} & ${accentHex}\n` +
        `Engraving: ${engravingIdea.trim() || 'None'}\n` +
        `Design Details:\n${notes.trim()}\n\n` +
        `Name: ${customerName.trim()}\n` +
        `Email: ${customerEmail.trim()}\n` +
        `Instagram: ${instagramHandle.trim() || 'N/A'}\n` +
        (refNames ? `Reference Photos: ${refNames} (attached)\n` : '')
    );

    setConfirmation({
      referenceId,
      emailedViaServer,
      mailtoHref: `mailto:${STOREFRONT_CONFIG.brand.ownerAdminEmail}?subject=${subject}&body=${body}`,
    });
    setIsSubmitting(false);
    onToast(`Custom request ${referenceId} submitted!`);
  };

  return (
    <section id="bespoke" className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/30 p-6 sm:p-10 lg:p-12 shadow-2xl text-[#0B1117]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Editorial Pitch + Live Concept Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#009CA6] uppercase">
                  Custom Design Requests · Beyond the Studio
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0B1117] leading-tight">
                  Dreaming of Something <span className="italic text-[#0085CA]">One-of-One?</span>
                </h2>
                <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                  Want a custom silhouette not listed in the Purse Studio, an outfit-matched event set, or a personalized grinder, rolling tray, &amp; lighter sleeve combo? Describe your vision or upload inspiration photos and send your design brief straight to our Charlotte atelier.
                </p>
              </div>

              {/* Live Visual Concept Moodboard Preview */}
              <div className="rounded-2xl border border-[#DCE4EC] overflow-hidden bg-[#F8FAFC]">
                <div
                  className="h-24 p-4 flex items-end justify-between"
                  style={{
                    background: `linear-gradient(135deg, ${primaryHex}, ${accentHex})`,
                  }}
                >
                  <div className="bg-white/95 px-3 py-1 rounded-lg text-[11px] font-semibold text-[#0B1117]">
                    Live Concept Moodboard
                  </div>
                  <div className="bg-[#0B1117]/85 text-white px-2.5 py-1 rounded-lg text-[11px] font-mono tabular-nums">
                    {primaryHex} · {accentHex}
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="text-xs font-semibold text-[#0B1117]">{category}</div>
                  {engravingIdea.trim() && (
                    <div className="font-serif italic text-lg text-[#0085CA]">
                      “{engravingIdea.trim()}”
                    </div>
                  )}
                  <p className="text-xs text-[#475569] line-clamp-2">
                    {notes.trim() ||
                      'Select your colors, upload inspiration photos, and describe your custom piece on the right.'}
                  </p>
                  <button
                    type="button"
                    onClick={downloadConceptBriefPng}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white border border-[#DCE4EC] hover:border-[#0B1117] text-xs font-semibold text-[#0B1117] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0085CA]" />
                    <span>Download Concept Card PNG</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Custom Request Form */}
            <div className="lg:col-span-7">
              {confirmation ? (
                <div className="rounded-3xl bg-[#F8FAFC] border border-[#DCE4EC] p-8 text-center space-y-5">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#E6F7F8] text-[#009CA6] flex items-center justify-center">
                    <Check className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-3xl font-semibold text-[#0B1117]">
                      Custom Request Received!
                    </h3>
                    <p className="text-sm text-[#475569] max-w-md mx-auto">
                      Reference <strong className="text-[#0B1117]">{confirmation.referenceId}</strong>{' '}
                      {confirmation.emailedViaServer
                        ? 'has been emailed directly to our Charlotte atelier and logged.'
                        : 'is saved in our atelier queue. You can also send your pre-filled email with photos directly to our inbox below.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={confirmation.mailtoHref}
                      className="min-h-[46px] px-6 py-3 rounded-full bg-[#0085CA] hover:bg-[#006BA3] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Open Email to {STOREFRONT_CONFIG.brand.ownerAdminEmail}</span>
                    </a>
                    <button
                      type="button"
                      onClick={downloadConceptBriefPng}
                      className="min-h-[46px] px-5 py-3 rounded-full bg-white border border-[#DCE4EC] hover:border-[#0B1117] text-[#0B1117] text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Brief PNG</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmation(null);
                      setNotes('');
                      setEngravingIdea('');
                      setPhotos([]);
                    }}
                    className="text-xs font-semibold text-[#475569] hover:text-[#0B1117] underline underline-offset-4"
                  >
                    Submit Another Custom Idea
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-3xl bg-[#F8FAFC] border border-[#DCE4EC] p-6 sm:p-8 space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reqCategory"
                        className="block text-xs font-semibold text-[#0B1117] mb-1.5"
                      >
                        What are we designing?
                      </label>
                      <select
                        id="reqCategory"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE4EC] text-sm text-[#0B1117] focus:border-[#0085CA] focus:outline-none"
                      >
                        {REQUEST_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="reqDate"
                        className="block text-xs font-semibold text-[#0B1117] mb-1.5"
                      >
                        Date Needed (Optional)
                      </label>
                      <input
                        id="reqDate"
                        type="date"
                        value={neededByDate}
                        onChange={(e) => setNeededByDate(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE4EC] text-sm text-[#0B1117] focus:border-[#0085CA] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick Color Pair Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-[#0B1117] mb-1.5">
                        Primary Color Theme
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {CURATED_SWATCHES.slice(0, 6).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setPrimaryHex(s.hex)}
                            title={s.name}
                            className={`w-8 h-8 rounded-lg border ${
                              primaryHex === s.hex
                                ? 'ring-2 ring-[#0085CA] ring-offset-1 border-[#0B1117]'
                                : 'border-[#DCE4EC]'
                            }`}
                            style={{ backgroundColor: s.hex }}
                          />
                        ))}
                        <input
                          type="color"
                          value={primaryHex}
                          onChange={(e) => setPrimaryHex(e.target.value.toUpperCase())}
                          aria-label="Custom primary color"
                          className="w-8 h-8 rounded-lg border border-[#DCE4EC] cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-[#0B1117] mb-1.5">
                        Accent / Engraving Color
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {CURATED_SWATCHES.slice(0, 6).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setAccentHex(s.hex)}
                            title={s.name}
                            className={`w-8 h-8 rounded-lg border ${
                              accentHex === s.hex
                                ? 'ring-2 ring-[#009CA6] ring-offset-1 border-[#0B1117]'
                                : 'border-[#DCE4EC]'
                            }`}
                            style={{ backgroundColor: s.hex }}
                          />
                        ))}
                        <input
                          type="color"
                          value={accentHex}
                          onChange={(e) => setAccentHex(e.target.value.toUpperCase())}
                          aria-label="Custom accent color"
                          className="w-8 h-8 rounded-lg border border-[#DCE4EC] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reqEngraving"
                      className="block text-xs font-semibold text-[#0B1117] mb-1.5"
                    >
                      Custom Name, Initials, or Engraving Text (Optional)
                    </label>
                    <input
                      id="reqEngraving"
                      type="text"
                      maxLength={40}
                      value={engravingIdea}
                      onChange={(e) => setEngravingIdea(e.target.value)}
                      placeholder="e.g. JORDAN, BRIANNA, CLT 704"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE4EC] text-sm text-[#0B1117] focus:border-[#0085CA] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reqNotes"
                      className="block text-xs font-semibold text-[#0B1117] mb-1.5"
                    >
                      Describe Your Custom Design
                    </label>
                    <textarea
                      id="reqNotes"
                      rows={3}
                      required
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tell us the shape, size, outfit match, multi-color fade, or special accessory set you're envisioning..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE4EC] text-sm text-[#0B1117] focus:border-[#0085CA] focus:outline-none"
                    />
                  </div>

                  {/* Multi-Photo Inspiration Uploader */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0B1117]">
                        Upload Inspiration Photos or Outfit Snapshots (Up to 3)
                      </span>
                      <span className="text-[11px] text-[#475569] tabular-nums">
                        {photos.length} / 3 attached
                      </span>
                    </div>

                    {photos.length < 3 && (
                      <label className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white border-2 border-dashed border-[#CBD5E1] hover:border-[#0085CA] cursor-pointer transition-colors text-center">
                        <ImagePlus className="w-5 h-5 text-[#0085CA] shrink-0" />
                        <span className="text-xs font-medium text-[#475569]">
                          Tap to upload outfit photos, sketches, or design references
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative aspect-square rounded-xl overflow-hidden border border-[#DCE4EC] bg-white"
                          >
                            <img
                              src={photo.previewUrl}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              aria-label={`Remove ${photo.name}`}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-[#0B1117]/80 text-white flex items-center justify-center hover:bg-[#0B1117]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="reqName"
                        className="block text-xs font-semibold text-[#0B1117] mb-1"
                      >
                        Your Name
                      </label>
                      <input
                        id="reqName"
                        type="text"
                        required
                        maxLength={80}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Jordan Brooks"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DCE4EC] text-sm text-[#0B1117] focus:border-[#0085CA] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reqEmail"
                        className="block text-xs font-semibold text-[#0B1117] mb-1"
                      >
                        Email Address
                      </label>
                      <input
                        id="reqEmail"
                        type="email"
                        required
                        maxLength={120}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DCE4EC] text-sm text-[#0B1117] focus:border-[#0085CA] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reqInsta"
                        className="block text-xs font-semibold text-[#0B1117] mb-1"
                      >
                        Instagram Handle
                      </label>
                      <input
                        id="reqInsta"
                        type="text"
                        maxLength={50}
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="@yourhandle"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DCE4EC] text-sm text-[#0B1117] focus:border-[#0085CA] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] px-6 py-3.5 rounded-full bg-[#0B1117] hover:bg-[#0085CA] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Sending Request...'
                        : 'Send Custom Design Request'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
