
import { useEffect, useState } from 'react';
import { getPrendas, type Prenda } from '../features/browse/api/prendas';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderActions from '../components/HeaderActions';
import PostCard from '../features/browse/components/postCard';
import FilterSidebar, { type Filtros } from '../features/browse/components/filterSideBar';
import CreatePostModal from '../features/browse/components/createPostModal';

const filtrosIniciales: Filtros = {
  tipoPrenda: '',
  precioMin: '',
  precioMax: '',
  talle: '',
  marca: '',
  estado: '',
  genero: '',
};

export default function Browser() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales);
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

  const prendasFiltradas = prendas.filter((prenda) => {
    if (filtros.tipoPrenda &&
      prenda.tipoPrenda?.toLowerCase() !== filtros.tipoPrenda.toLowerCase()) {
      return false;
    }

    if (filtros.precioMin !== '' &&
      prenda.precio < Number(filtros.precioMin)) {
      return false;
    }

    if (filtros.precioMax !== '' &&
      prenda.precio > Number(filtros.precioMax)) {
      return false;
    }

    if (filtros.talle &&
      prenda.talle?.toLowerCase() !== filtros.talle.toLowerCase()) {
      return false;
    }

    if (filtros.marca &&
      !prenda.marca?.toLowerCase().includes(filtros.marca.toLowerCase())) {
      return false;
    }

    if (filtros.estado &&
      prenda.estado?.toLowerCase() !== filtros.estado.toLowerCase()) {
      return false;
    }

    if (filtros.genero &&
      prenda.genero?.toLowerCase() !== filtros.genero.toLowerCase()) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header
        actions={
          <HeaderActions
            onFilters={() => setFiltersOpen(true)}
            onCreate={() => setModalOpen(true)}
          />
        }
      />

      <main className="flex-1 p-4">

        {cargando ? (
          <p className="text-umber/60 text-sm py-12 text-center">
            Cargando prendas...
          </p>
        ) : error ? (
          <p className="text-red-600 text-sm py-12 text-center">
            {error}
          </p>
        ) : prendas.length === 0 ? (
          <p className="text-umber/60 text-sm py-12 text-center">
            Todavía no hay prendas publicadas. Tocá el + para cargar la primera.
          </p>
        ) : prendasFiltradas.length === 0 ? (
          <p className="text-umber/60 text-sm py-12 text-center">
            No encontramos prendas que coincidan con los filtros.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
