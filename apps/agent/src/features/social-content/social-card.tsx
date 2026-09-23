import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { formatPriceSom, type RealtorOwnListing } from '@rieltor/shared';

export type CardFormat = 'story' | 'post';
const SIZES: Record<CardFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  post: { w: 1080, h: 1080 },
};
const TEAL = '#0d9488';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export interface SocialCardHandle {
  download: (filename: string) => void;
}

interface Props {
  listing: RealtorOwnListing;
  format: CardFormat;
  agency: string;
  realtorName: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  shareUrl: string;
}

/** Load an image, resolving null on absence/error (never rejects). Same-origin → no taint. */
function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function hostFrom(shareUrl: string): string {
  try {
    const u = new URL(shareUrl);
    return (u.host + u.pathname).replace(/\/$/, '');
  } catch {
    return shareUrl;
  }
}

export const SocialCard = forwardRef<SocialCardHandle, Props>(function SocialCard(props, ref) {
  const { listing, format, agency, realtorName, logoUrl, brandColor, shareUrl } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    download(filename) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      } catch {
        /* toBlob throws only on a tainted canvas; covers are same-origin so this is defensive (spec §5) */
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = SIZES[format];
    canvas.width = w;
    canvas.height = h;
    const brand = brandColor ?? TEAL;
    let cancelled = false;

    void Promise.all([loadImage(listing.imageUrl), loadImage(logoUrl)])
      .then(([cover, logo]) => {
        if (cancelled) return;
        // Background: cover-fit photo, or a solid brand fill when there is no cover.
        if (cover) {
          const scale = Math.max(w / cover.width, h / cover.height);
          const dw = cover.width * scale;
          const dh = cover.height * scale;
          ctx.drawImage(cover, (w - dw) / 2, (h - dh) / 2, dw, dh);
        } else {
          ctx.fillStyle = brand;
          ctx.fillRect(0, 0, w, h);
        }
        // Legibility gradient (bottom) + brand accent bar (top).
        const grad = ctx.createLinearGradient(0, h * 0.45, 0, h);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.78)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = brand;
        ctx.fillRect(0, 0, w, 18);

        // Header: logo (rounded) + agency/name, top-left.
        let hx = 56;
        if (logo) {
          const s = 104;
          ctx.save();
          ctx.beginPath();
          ctx.arc(56 + s / 2, 56 + s / 2, s / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logo, 56, 56, s, s);
          ctx.restore();
          hx = 56 + s + 24;
        }
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#fff';
        ctx.font = `bold 44px ${FONT}`;
        ctx.fillText(ellipsize(ctx, agency || 'Rieltor', w - hx - 56), hx, 64);
        if (realtorName) {
          ctx.font = `600 34px ${FONT}`;
          ctx.fillStyle = 'rgba(255,255,255,0.88)';
          ctx.fillText(ellipsize(ctx, realtorName, w - hx - 56), hx, 118);
        }

        // Footer block: price, params, site host pill.
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fff';
        ctx.font = `bold 92px ${FONT}`;
        ctx.fillText(
          ellipsize(ctx, formatPriceSom(listing.priceSom, listing.deal), w - 112),
          56,
          h - 232,
        );

        const params = [
          listing.rooms != null ? `${listing.rooms} xona` : null,
          `${listing.areaM2} m²`,
          listing.district,
        ]
          .filter(Boolean)
          .join(' · ');
        ctx.font = `600 42px ${FONT}`;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillText(ellipsize(ctx, params, w - 112), 56, h - 160);

        const host = hostFrom(shareUrl);
        if (host) {
          // Only draw the pill once shareUrl has resolved — on the first (pending) render
          // shareUrl is '' and hostFrom('') is '' → skip, so no empty lozenge flashes.
          ctx.font = `bold 36px ${FONT}`;
          const pillW = Math.min(ctx.measureText(host).width + 56, w - 112);
          ctx.fillStyle = brand;
          ctx.beginPath();
          ctx.roundRect(56, h - 118, pillW, 64, 32);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillText(ellipsize(ctx, host, pillW - 56), 84, h - 74);
        }
      })
      .catch(() => {}); // loadImage never rejects; defensive so a draw error is never unhandled

    return () => {
      cancelled = true;
    };
  }, [listing, format, agency, realtorName, logoUrl, brandColor, shareUrl]);

  const { w, h } = SIZES[format];
  return (
    <canvas
      ref={canvasRef}
      aria-label="Ijtimoiy tarmoq kartasi"
      className="mx-auto block h-auto w-full rounded-[14px] border border-line"
      style={{ aspectRatio: `${w} / ${h}`, maxWidth: format === 'story' ? 300 : 400 }}
    />
  );
});
