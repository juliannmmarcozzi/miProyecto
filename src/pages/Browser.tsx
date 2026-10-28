
import { useEffect, useState } from 'react';
import { getPrendas, type Prenda } from '../features/browse/api/prendas';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderActions from '../components/HeaderActions';
import PostCard from '../features/browse/components/postCard';
import FilterSidebar, {
  type Filtros,
  filtrosIniciales,
} from '../features/browse/components/filterSideBar';
import CreatePostModal from '../features/browse/components/createPostModal';

type Orden = 'relevantes' | 'menorPrecio' | 'mayorPrecio' | 'recientes';

export default function Browser() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<Orden>('relevantes');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  async function loadPrendas() {
    setCargando(true);
    setError('');

    try {
      const datos = await getPrendas();
      setPrendas(datos);
    } catch (error) {
      console.error(error);
      setError('No se pudieron cargar las prendas.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    loadPrendas();
  }, []);

  const prendasFiltradas = prendas
    .filter((prenda) => {
      const texto = busqueda.trim().toLowerCase();

      if (
        texto &&
        ![
          prenda.titulo,
          prenda.marca,
          prenda.descripcion,
        ].some((valor) => valor?.toLowerCase().includes(texto))
      ) {
        return false;
      }

      if (
        filtros.tipoPrenda &&
        prenda.tipoPrenda?.toLowerCase() !== filtros.tipoPrenda.toLowerCase()
      ) {
        return false;
      }

      if (
        filtros.precioMin !== '' &&
        prenda.precio < Number(filtros.precioMin)
      ) {
        return false;
      }

      if (
        filtros.precioMax !== '' &&
        prenda.precio > Number(filtros.precioMax)
      ) {
        return false;
      }

      if (
        filtros.talle &&
        prenda.talle?.toLowerCase() !== filtros.talle.toLowerCase()
      ) {
        return false;
      }

      if (
        filtros.marca &&
        !prenda.marca?.toLowerCase().includes(filtros.marca.toLowerCase())
      ) {
        return false;
      }

      if (
        filtros.estado &&
        prenda.estado?.toLowerCase() !== filtros.estado.toLowerCase()
      ) {
        return false;
      }

      if (
        filtros.genero &&
        prenda.genero?.toLowerCase() !== filtros.genero.toLowerCase()
      ) {
        return false;
      }

      if (
        filtros.color &&
        prenda.color?.toLowerCase() !== filtros.color.toLowerCase()
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (orden === 'menorPrecio') {
        return a.precio - b.precio;
      }

      if (orden === 'mayorPrecio') {
        return b.precio - a.precio;
      }

      if (orden === 'recientes') {
        return (
          new Date(b.fechaPublicacion).getTime() -
          new Date(a.fechaPublicacion).getTime()
        );
      }

      return 0;
    });

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5] flex flex-col">
      <Header
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        actions={
          <HeaderActions
            onFilters={() => setFiltersOpen(true)}
            onCreate={() => setModalOpen(true)}
          />
        }
      />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <p className="text-sm text-[#B4C1D5]">
            {cargando
              ? 'Cargando resultados...'
              : `${prendasFiltradas.length} ${
                  prendasFiltradas.length === 1
                    ? 'resultado'
                    : 'resultados'
                }`}
          </p>

          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="bg-[#10233D] border border-[#284665] text-[#E7ECF5] text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#3B82F6] cursor-pointer"
          >
            <option value="relevantes">Ordenar por: Más relevantes</option>
            <option value="recientes">Más recientes</option>
            <option value="menorPrecio">Menor precio</option>
            <option value="mayorPrecio">Mayor precio</option>
          </select>
        </div>

        {cargando ? (
          <p className="text-[#B4C1D5] text-sm py-12 text-center">
            Cargando prendas...
          </p>
        ) : error ? (
          <p className="text-red-400 text-sm py-12 text-center">
            {error}
          </p>
        ) : prendas.length === 0 ? (
          <p className="text-[#B4C1D5] text-sm py-12 text-center">
            Todavía no hay prendas publicadas. Tocá el + para cargar la primera.
          </p>
        ) : prendasFiltradas.length === 0 ? (
          <p className="text-[#B4C1D5] text-sm py-12 text-center">
            No encontramos prendas que coincidan con tu búsqueda o los filtros.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {prendasFiltradas.map((prenda) => (
              <PostCard key={prenda.id} prenda={prenda} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      <FilterSidebar
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={setFiltros}
      />

      {modalOpen && (
        <CreatePostModal
          onClose={() => setModalOpen(false)}
          onCreated={loadPrendas}
        />
      )}
    </div>
  );
}
