
import { useState } from 'react';

export interface Filtros {
  tipoPrenda: string;
  precioMin: string;
  precioMax: string;
  talle: string;
  marca: string;
  estado: string;
  genero: string;
  color?: string;
}

export const filtrosIniciales: Filtros = {
  tipoPrenda: '',
  precioMin: '',
  precioMax: '',
  talle: '',
  marca: '',
  estado: '',
  genero: '',
  color: '',
};

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  onApply: (filtros: Filtros) => void;
}

const tiposPrenda = [
  'Remera',
  'Buzo',
  'Pantalón',
  'Campera',
  'Jean',
  'Camisa',
  'Zapatillas',
  'Short',
  'Vestido',
];

const talles = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const colores = [
  { nombre: 'Blanco', codigo: '#F4F4F4' },
  { nombre: 'Negro', codigo: '#111111' },
  { nombre: 'Gris', codigo: '#808B9A' },
  { nombre: 'Rojo', codigo: '#E11D48' },
  { nombre: 'Amarillo', codigo: '#FACC15' },
  { nombre: 'Azul', codigo: '#2563EB' },
  { nombre: 'Verde', codigo: '#3F702D' },
];

export default function FilterSidebar({
  open,
  onClose,
  onApply,
}: FilterSidebarProps) {
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales);

  function cambiarFiltro(campo: keyof Filtros, valor: string) {
    setFiltros((anteriores) => ({
      ...anteriores,
      [campo]: anteriores[campo] === valor ? '' : valor,
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
    'w-full bg-[#10233D] border border-[#294563] text-[#E6EDF7] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4B83D5]';

  const sectionClass = 'border-b border-[#263A54] pb-5';

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40"
      onClick={onClose}
    >
      <aside
        className="absolute top-0 left-0 h-full w-[310px] max-w-[90vw] bg-[#0A1729] text-[#DCE7F5] p-5 overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-white">
            Filtros
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-[#A9BAD0] hover:text-white text-xl cursor-pointer"
            aria-label="Cerrar filtros"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold mb-3">
              Tipo de prenda
            </h3>

            <div className="flex flex-col gap-2.5">
              {tiposPrenda.map((tipo) => (
                <label
                  key={tipo}
                  className="flex items-center gap-2.5 text-sm cursor-pointer text-[#B9C9DC]"
                >
                  <input
                    type="radio"
                    name="tipoPrenda"
                    checked={filtros.tipoPrenda === tipo}
                    onChange={() => cambiarFiltro('tipoPrenda', tipo)}
                    className="accent-[#3B82F6] w-4 h-4"
                  />
                  {tipo}
                </label>
              ))}
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-semibold mb-3">
              Marca
            </h3>

            <input
              placeholder="Todas las marcas"
              value={filtros.marca}
              onChange={(e) =>
                setFiltros((anteriores) => ({
                  ...anteriores,
                  marca: e.target.value,
                }))
              }
              className={inputClass}
            />
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-semibold mb-3">
              Talle
            </h3>

            <div className="flex flex-wrap gap-2">
              {talles.map((talle) => (
                <button
                  key={talle}
                  type="button"
                  onClick={() => cambiarFiltro('talle', talle)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors cursor-pointer ${
                    filtros.talle === talle
                      ? 'bg-[#2563EB] border-[#60A5FA] text-white'
                      : 'bg-[#10233D] border-[#294563] text-[#B9C9DC] hover:border-[#4B83D5]'
                  }`}
                >
                  {talle}
                </button>
              ))}
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-semibold mb-3">
              Precio
            </h3>

            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Mínimo"
                value={filtros.precioMin}
                onChange={(e) =>
                  setFiltros((anteriores) => ({
                    ...anteriores,
                    precioMin: e.target.value,
                  }))
                }
                className={inputClass + ' min-w-0'}
              />

              <input
                type="number"
                min="0"
                placeholder="Máximo"
                value={filtros.precioMax}
                onChange={(e) =>
                  setFiltros((anteriores) => ({
                    ...anteriores,
                    precioMax: e.target.value,
                  }))
                }
                className={inputClass + ' min-w-0'}
              />
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-semibold mb-3">
              Color
            </h3>

            <div className="flex flex-wrap gap-3">
              {colores.map((color) => (
                <button
                  key={color.nombre}
                  type="button"
                  title={color.nombre}
                  aria-label={`Filtrar por color ${color.nombre}`}
                  aria-pressed={filtros.color === color.nombre}
                  onClick={() => cambiarFiltro('color', color.nombre)}
                  className={`w-7 h-7 rounded-full border-2 p-[3px] cursor-pointer ${
                    filtros.color === color.nombre
                      ? 'border-[#60A5FA]'
                      : 'border-[#66809F]'
                  }`}
                >
                  <span
                    className="block w-full h-full rounded-full"
                    style={{ backgroundColor: color.codigo }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-semibold mb-3">
              Estado de la prenda
            </h3>

            <div className="flex flex-col gap-2">
              {['Nuevo', 'Usado'].map((estado) => (
                <label
                  key={estado}
                  className="flex gap-2.5 items-center text-sm text-[#B9C9DC] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filtros.estado === estado}
                    onChange={() => cambiarFiltro('estado', estado)}
                    className="w-4 h-4 accent-[#2563EB]"
                  />
                  {estado}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">
              Género
            </h3>

            <select
              value={filtros.genero}
              onChange={(e) =>
                setFiltros((anteriores) => ({
                  ...anteriores,
                  genero: e.target.value,
                }))
              }
              className={inputClass}
            >
              <option value="">Todos</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>

          <button
            type="button"
            onClick={aplicarFiltros}
            className="bg-[#2563EB] text-white rounded-lg py-3 font-medium hover:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            Aplicar filtros
          </button>

          <button
            type="button"
            onClick={limpiarFiltros}
            className="border border-[#36506D] rounded-lg py-3 text-sm hover:bg-white/5 transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      </aside>
    </div>
  );
}
