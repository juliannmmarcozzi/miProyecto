export default function HeaderActions({
  onFilters,
  onCreate,
}: {
  onFilters: () => void;
  onCreate: () => void;
}) {
  return (
    <>
      <button
        onClick={onFilters}
        className="w-9 h-9 rounded-full bg-cream/10 hover:bg-cream/15 flex items-center justify-center"
        aria-label="Filtros"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
          <line x1="3" y1="6" x2="14" y2="6" />
          <circle cx="17" cy="6" r="2" fill="currentColor" stroke="none" />
          <line x1="3" y1="12" x2="6" y2="12" />
          <circle cx="9" cy="12" r="2" fill="currentColor" stroke="none" />
          <line x1="12" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="12" y2="18" />
          <circle cx="15" cy="18" r="2" fill="currentColor" stroke="none" />
          <line x1="18" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <button
        onClick={onCreate}
        className="w-9 h-9 rounded-full bg-clay hover:bg-clay/90 text-white text-xl leading-none flex items-center justify-center"
        aria-label="Crear publicación"
      >
        +
      </button>

      <button
        className="w-9 h-9 rounded-full bg-cream/10 hover:bg-cream/15 flex items-center justify-center"
        aria-label="Cuenta"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      </button>
    </>
  );
}
