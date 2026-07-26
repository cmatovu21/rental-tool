export function MapPreview({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="rounded-lg overflow-hidden border border-rule">
      {/* Google Maps supports a keyless embed via output=embed for simple
          pin display. It's undocumented/best-effort rather than an
          official API — the "Open in Google Maps" link below is the
          reliable fallback if it ever stops rendering. */}
      <iframe
        title="Property location"
        width="100%"
        height="220"
        style={{ border: 0 }}
        loading="lazy"
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
      />
      <div className="bg-white px-3 py-2 text-sm border-t border-rule">
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest hover:underline"
        >
          Open in Google Maps ↗
        </a>
      </div>
    </div>
  );
}
