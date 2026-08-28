export default function FilterSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/50 z-40" onClick={onClose}>
      <aside
        className="absolute top-0 left-0 h-full w-64 bg-forest text-cream p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm uppercase tracking-wide text-cream/70">Filtros</h2>
          <button onClick={onClose} className="text-cream/70">✕</button>
        </div>
        <p className="text-sm text-cream/60">No hay filtros disponibles</p>
      </aside>
    </div>
  );
}
