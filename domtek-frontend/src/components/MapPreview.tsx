'use client';

import { useState, useEffect, useRef } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Tente d'extraire (lat, lng) depuis une URL Google Maps longue ou des coordonnées brutes. */
function parseCoords(s: string): { lat: number; lng: number } | null {
  try {
    // Coordonnées directes : "36.874, 10.273" ou "36.874,10.273"
    const direct = s.match(/^(-?\d{1,3}\.?\d*)\s*,\s*(-?\d{1,3}\.?\d*)$/);
    if (direct) {
      const lat = parseFloat(direct[1]);
      const lng = parseFloat(direct[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
    }
    // @lat,lng,zoom
    let m = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // q=lat,lng
    m = s.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // ll=lat,lng
    m = s.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // /lat,lng in path
    m = s.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  } catch { /* noop */ }
  return null;
}

const isUrl      = (s: string) => /^https?:\/\//i.test(s);
const isShortUrl = (s: string) => /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(s);
const isCoords   = (s: string) => /^-?\d{1,3}\.?\d*\s*,\s*-?\d{1,3}\.?\d*$/.test(s.trim());

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'error';

interface MapPreviewProps {
  value: string;
  onChange: (v: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function MapPreview({ value, onChange }: MapPreviewProps) {
  const [coords, setCoords]       = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [status, setStatus]       = useState<Status>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const s = value.trim();
    if (!s) {
      setCoords(null); setPlaceName(null); setStatus('idle'); setErrorMsg('');
      return;
    }

    // ── 1. Coordonnées directes ou URL longue → parse immédiat ──
    if (!isShortUrl(s)) {
      const parsed = parseCoords(s);
      if (parsed) {
        setCoords(parsed); setPlaceName(null); setStatus('idle'); setErrorMsg('');
        return;
      }
    }

    // ── 2. Lien court → résolution via route API Next.js ──
    if (isUrl(s) && isShortUrl(s)) {
      setStatus('loading');
      timerRef.current = setTimeout(async () => {
        try {
          const res  = await fetch(`/api/resolve-url?url=${encodeURIComponent(s)}`);
          const json = await res.json();
          const parsed = parseCoords(json.resolved ?? '');
          if (parsed) {
            setCoords(parsed); setPlaceName(null); setStatus('idle'); setErrorMsg('');
          } else {
            setCoords(null); setStatus('error');
            setErrorMsg(
              'Impossible d\'extraire les coordonnées depuis ce lien raccourci. ' +
              'Sur Google Maps, faites un clic droit sur l\'emplacement → "Copier les coordonnées" et collez-les ici.'
            );
          }
        } catch {
          setCoords(null); setStatus('error');
          setErrorMsg('Erreur lors de la résolution du lien raccourci.');
        }
      }, 300);
      return;
    }

    // ── 3. URL non reconnue ──
    if (isUrl(s)) {
      setCoords(null); setStatus('error');
      setErrorMsg('Format d\'URL non reconnu. Utilisez un lien Google Maps long ou des coordonnées directes.');
      return;
    }

    // ── 4. Texte libre → geocoding Nominatim (OpenStreetMap) ──
    setStatus('loading');
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(s)}&format=json&limit=1&accept-language=fr`,
          { headers: { 'User-Agent': 'Domtek/1.0 (contact@domtek.tn)' } }
        );
        const results = await res.json();
        if (results.length > 0) {
          const { lat, lon, display_name } = results[0];
          setCoords({ lat: parseFloat(lat), lng: parseFloat(lon) });
          setPlaceName(display_name);
          setStatus('idle'); setErrorMsg('');
        } else {
          setCoords(null); setStatus('error');
          setErrorMsg('Lieu introuvable. Essayez d\'être plus précis ou utilisez des coordonnées.');
        }
      } catch {
        setCoords(null); setStatus('error');
        setErrorMsg('Erreur lors de la recherche du lieu.');
      }
    }, 800);
  }, [value]);

  const osmEmbed = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.008},${coords.lat - 0.008},${coords.lng + 0.008},${coords.lat + 0.008}&layer=mapnik&marker=${coords.lat},${coords.lng}`
    : null;
  const osmLink = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`
    : null;

  return (
    <div className="space-y-2">
      {/* ── Champ de saisie ── */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {status === 'loading' ? (
            <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nom, adresse, coordonnées (36.8745, 10.2732) ou lien Google Maps…"
          className="w-full border border-gray-300 rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Erreur ── */}
      {status === 'error' && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {errorMsg}
        </div>
      )}

      {/* ── Aide si champ vide ── */}
      {!value && (
        <p className="text-xs text-gray-400">
          Tapez un nom de lieu, une adresse ou collez des coordonnées
          (ex&nbsp;: <code className="bg-gray-100 px-1 rounded">36.8745, 10.2732</code>).
          Sur Google Maps&nbsp;: clic droit → <strong>Copier les coordonnées</strong>.
        </p>
      )}

      {/* ── Nom du lieu trouvé par geocoding ── */}
      {placeName && status === 'idle' && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 truncate">
          ✓ {placeName}
        </p>
      )}

      {/* ── Aperçu carte ── */}
      {osmEmbed && (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">
              {coords!.lat.toFixed(6)}, {coords!.lng.toFixed(6)}
            </span>
            <a href={osmLink!} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ouvrir dans OpenStreetMap
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <iframe src={osmEmbed} width="100%" height="280"
            style={{ border: 0, display: 'block' }} loading="lazy" title="Localisation" />
        </div>
      )}
    </div>
  );
}
