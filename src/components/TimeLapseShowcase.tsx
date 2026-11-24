import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Upload, Volume2, VolumeX } from 'lucide-react';
import { STOREFRONT_CONFIG } from '../config/storefrontConfig';

interface TimeLapseShowcaseProps {
  title?: string;
  description?: string;
  videoUrl?: string;
  brandName?: string;
  onToast: (msg: string) => void;
}

export const TimeLapseShowcase: React.FC<TimeLapseShowcaseProps> = ({
  title,
  description,
  videoUrl,
  brandName,
  onToast,
}) => {
  const [localVideoUrl, setLocalVideoUrl] = useState<string>('');
  const [localVideoName, setLocalVideoName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [layerPercent, setLayerPercent] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const activeVideoSrc = localVideoUrl || videoUrl || STOREFRONT_CONFIG.timeLapse.videoUrl;
  const displayTitle = title || STOREFRONT_CONFIG.timeLapse.title;
  const displayDescription = description || STOREFRONT_CONFIG.timeLapse.description;
  const displayBrand = brandName || STOREFRONT_CONFIG.brand.name;

  useEffect(() => {
    return () => {
      if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    };
  }, [localVideoUrl]);

  // Procedural 3D-Printing Layer-by-Layer Time-Lapse Animation (when no video uploaded yet)
  useEffect(() => {
    if (activeVideoSrc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let progress = 0.08;
    let lastTs = performance.now();

    const drawFrame = (ts: number) => {
      rafId = requestAnimationFrame(drawFrame);
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (isPlayingRef.current) {
        progress += dt * 0.095;
        if (progress > 1.08) progress = 0.05;
      }

      const clamped = Math.min(1, progress);
      setLayerPercent(Math.round(clamped * 100));

      const w = (canvas.width = canvas.clientWidth * Math.min(window.devicePixelRatio, 2));
      const h = (canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio, 2));

      // Clean bright architectural studio background
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#0E1722');
      bg.addColorStop(0.55, '#132231');
      bg.addColorStop(1, '#0B1117');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle build-plate perspective grid
      const bedY = h * 0.78;
      const bedW = w * 0.62;
      const cx = w * 0.5;

      ctx.save();
      ctx.strokeStyle = 'rgba(184, 196, 208, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - bedW * 0.62, bedY + h * 0.11);
      ctx.lineTo(cx - bedW * 0.44, bedY - h * 0.06);
      ctx.lineTo(cx + bedW * 0.44, bedY - h * 0.06);
      ctx.lineTo(cx + bedW * 0.62, bedY + h * 0.11);
      ctx.closePath();
      ctx.fillStyle = 'rgba(248, 250, 252, 0.05)';
      ctx.fill();
      ctx.stroke();

      for (let i = 1; i <= 7; i++) {
        const t = i / 8;
        const xTop = cx - bedW * 0.44 + bedW * 0.88 * t;
        const xBot = cx - bedW * 0.62 + bedW * 1.24 * t;
        ctx.beginPath();
        ctx.moveTo(xTop, bedY - h * 0.06);
        ctx.lineTo(xBot, bedY + h * 0.11);
        ctx.stroke();
      }
      ctx.restore();

      // Sculpted Quilted Purse Building Layer by Layer
      const totalLayers = 68;
      const visibleLayers = Math.max(2, Math.floor(clamped * totalLayers));
      const purseH = h * 0.48;
      const purseW = Math.min(w * 0.34, h * 0.56);
      const baseBottom = bedY + h * 0.02;

      for (let i = 0; i < visibleLayers; i++) {
        const frac = i / totalLayers;
        const y = baseBottom - frac * purseH;

        // Tapered sculptural heart-clutch silhouette profile
        let widthScale = 1;
        if (frac < 0.25) {
          widthScale = 0.55 + (frac / 0.25) * 0.45;
        } else if (frac > 0.78) {
          widthScale = 1 - ((frac - 0.78) / 0.22) * 0.14;
        }
        const halfW = (purseW * 0.5) * widthScale;

        // Blue -> Teal Queen City Ombre transition
        const r = Math.round(0 + frac * 0);
        const g = Math.round(133 + frac * (156 - 133));
        const b = Math.round(202 + frac * (166 - 202));

        // Quilted facet highlight wave
        const wave = Math.sin(i * 0.85) * 0.5 + 0.5;
        const alpha = 0.82 + wave * 0.18;

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = Math.max(2.5, (purseH / totalLayers) * 0.82);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - halfW, y);
        ctx.quadraticCurveTo(cx, y + 8, cx + halfW, y);
        ctx.stroke();

        // Crisp specular highlight rim
        ctx.strokeStyle = `rgba(248, 250, 252, ${0.14 + wave * 0.16})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - halfW * 0.72, y - 1);
        ctx.lineTo(cx - halfW * 0.12, y + 1);
        ctx.stroke();
      }

      // Active Printhead Gantry & Extrusion Nozzle Spark
      const activeY = baseBottom - (visibleLayers / totalLayers) * purseH;
      const nozzleSwing = Math.sin(ts * 0.0085) * (purseW * 0.42);
      const nozzleX = cx + nozzleSwing;

      // Gantry rail
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, activeY - h * 0.11);
      ctx.lineTo(w * 0.88, activeY - h * 0.11);
      ctx.stroke();

      // Carriage head
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.fillRect(nozzleX - 24, activeY - h * 0.14, 48, h * 0.08);
      ctx.strokeRect(nozzleX - 24, activeY - h * 0.14, 48, h * 0.08);

      // Brass/silver nozzle tip
      ctx.beginPath();
      ctx.moveTo(nozzleX - 8, activeY - h * 0.06);
      ctx.lineTo(nozzleX + 8, activeY - h * 0.06);
      ctx.lineTo(nozzleX, activeY - 2);
      ctx.closePath();
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();

      // Luminous extrusion glow at active bead
      const glow = ctx.createRadialGradient(nozzleX, activeY, 1, nozzleX, activeY, 26);
      glow.addColorStop(0, 'rgba(94, 234, 212, 0.95)');
      glow.addColorStop(0.45, 'rgba(0, 133, 202, 0.45)');
      glow.addColorStop(1, 'rgba(0, 133, 202, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(nozzleX, activeY, 26, 0, Math.PI * 2);
      ctx.fill();
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, [activeVideoSrc]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    const nextUrl = URL.createObjectURL(file);
    setLocalVideoUrl(nextUrl);
    setLocalVideoName(file.name);
    setIsPlaying(true);
    onToast(`Previewing your time-lapse video: ${file.name}`);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        void videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted((prev) => !prev);
  };

  const clearLocalVideo = () => {
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    setLocalVideoUrl('');
    setLocalVideoName('');
    setIsPlaying(true);
    onToast('Restored procedural 3D-print time-lapse preview');
  };

  return (
    <section id="timelapse" className="py-16 lg:py-24 border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#FDE68A] uppercase">
              {STOREFRONT_CONFIG.timeLapse.kicker}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight drop-shadow-sm">
              {displayTitle}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
              {displayDescription}
            </p>
          </div>
        </div>

        {/* Widescreen Cinematic Film Frame */}
        <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-[#0B1117] shadow-2xl">
          <div className="relative aspect-[16/9] max-h-[560px] w-full">
            {activeVideoSrc ? (
              <video
                ref={videoRef}
                src={activeVideoSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
                aria-label="Live procedural 3D printing time-lapse animation"
              />
            )}

            {/* Measured Bottom Contrast Scrim */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B1117]/85 via-[#0B1117]/35 to-transparent" />

            {/* Clean Film Overlay Controls */}
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 text-white">
                <div className="text-xs text-[#CBD5E1] font-medium">
                  {localVideoName
                    ? `Previewing Studio Clip · ${localVideoName}`
                    : activeVideoSrc
                      ? `${displayBrand} Studio Time-Lapse Film`
                      : `Live Layer Simulation · ${layerPercent}% Sculpted`}
                </div>
                {!activeVideoSrc && (
                  <div className="w-44 h-1 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0085CA] to-[#009CA6] transition-all duration-150"
                      style={{ width: `${layerPercent}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="min-h-[42px] px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 border border-white/20 transition-colors whitespace-nowrap"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                {activeVideoSrc && (
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="min-h-[42px] px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 border border-white/20 transition-colors"
                    aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
                  </button>
                )}

                <label className="min-h-[42px] px-4 py-2 rounded-full bg-[#0085CA] hover:bg-[#006BA3] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Preview Your Video</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>

                {localVideoUrl && (
                  <button
                    type="button"
                    onClick={clearLocalVideo}
                    className="min-h-[42px] px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 border border-white/20 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clean 3-Column Atelier Craft Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {STOREFRONT_CONFIG.timeLapse.highlights.map((item) => (
            <div
              key={item.label}
              className="p-5 rounded-2xl glass-card flex flex-col gap-1"
            >
              <span className="text-xs text-slate-300">{item.label}</span>
              <span className="font-serif text-2xl font-semibold text-[#FDE68A] tabular-nums">
                {item.value}
              </span>
              <span className="text-xs text-slate-300/90">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
