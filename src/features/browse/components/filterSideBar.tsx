
import { useState } from 'react';

export interface Filtros {
  tipoPrenda: string;
  precioMin: string;
  precioMax: string;
  talle: string;
  marca: string;
  estado: string;
  genero: string;
}

export const filtrosIniciales: Filtros = {
  tipoPrenda: '',
  precioMin: '',
  precioMax: '',
  talle: '',
  marca: '',
  estado: '',
  genero: '',
};

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  onApply: (filtros: Filtros) => void;
}

export default function FilterSidebar({
  open,
  onClose,
  onApply,
}: FilterSidebarProps) {
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales);

  function cambiarFiltro(campo: keyof Filtros, valor: string) {
    setFiltros((anteriores) => ({
      ...anteriores,
      [campo]: valor,
    }));
  }

  function aplicarFiltros() {
    onApply(filtros);
    onClose();
  }

  function limpiarFiltros() {
    setFiltros(filtrosIniciales);
    onApply(filtrosIniciales);
    onClose();
  }

  if (!open) return null;

  const inputClass =
    'w-full bg-cream text-ink rounded-lg px-3 py-2 text-sm outline-none';

  return (
    <div
      className="fixed inset-0 bg-ink/50 z-40"
      onClick={onClose}
    >
      <aside
        className="absolute top-0 left-0 h-full w-72 bg-forest text-cream p-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold">
            Filtros
          </h2>

          <button onClick={onClose} className="text-cream/70">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5">

          <div>
            <label className="block text-sm mb-2">
              Tipo de prenda
            </label>
            <select
              value={filtros.tipoPrenda}
              onChange={(e) => cambiarFiltro('tipoPrenda', e.target.value)}
              className={inputClass}
            >
              <option value="">Todos</option>
              <option value="Remera">Remera</option>
              <option value="Pantalón">Pantalón</option>
              <option value="Campera">Campera</option>
              <option value="Buzo">Buzo</option>
              <option value="Vestido">Vestido</option>
              <option value="Zapatillas">Zapatillas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Precio
            </label>

            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Mínimo"
                value={filtros.precioMin}
                onChange={(e) => cambiarFiltro('precioMin', e.target.value)}
                className={inputClass + ' min-w-0'}
              />

              <input
                type="number"
                min="0"
                placeholder="Máximo"
                value={filtros.precioMax}
                onChange={(e) => cambiarFiltro('precioMax', e.target.value)}
                className={inputClass + ' min-w-0'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Talle
            </label>
            <select
              value={filtros.talle}
              onChange={(e) => cambiarFiltro('talle', e.target.value)}
              className={inputClass}
            >
              <option value="">Todos</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Marca
            </label>
            <input
              placeholder="Buscar marca"
              value={filtros.marca}
              onChange={(e) => cambiarFiltro('marca', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => cambiarFiltro('estado', e.target.value)}
              className={inputClass}
            >
              <option value="">Todos</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Usado">Usado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Género
            </label>
            <select
              value={filtros.genero}
              onChange={(e) => cambiarFiltro('genero', e.target.value)}
              className={inputClass}
            >
              <option value="">Todos</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>

          <button
            onClick={aplicarFiltros}
            className="bg-clay text-white rounded-lg py-2.5 font-medium hover:bg-clay/90"
          >
            Aplicar filtros
          </button>

          <button
            onClick={limpiarFiltros}
            className="border border-cream/30 rounded-lg py-2.5 text-sm hover:bg-cream/10"
          >
            Limpiar filtros
          </button>

        </div>
      </aside>
    </div>
  );
}
