import { useEffect, useState } from 'react';
import { getPrendas, type Prenda } from '../features/browse/api/prendas';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderActions from '../components/HeaderActions';
import PostCard from '../features/browse/components/postCard';
import FilterSidebar from '../features/browse/components/filterSideBar';
import CreatePostModal from '../features/browse/components/createPostModal';

export default function Browser() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadPrendas() {
    setPrendas(await getPrendas());
  }

  useEffect(() => {
    loadPrendas();
  }, []);

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header
        actions={
          <HeaderActions onFilters={() => setFiltersOpen(true)} onCreate={() => setModalOpen(true)} />
        }
      />

      <main className="flex-1 p-4">
        {prendas.length === 0 ? (
          <p className="text-umber/60 text-sm py-12 text-center">
            Todavía no hay prendas publicadas. Tocá el + para cargar la primera.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {prendas.map((prenda) => (
              <PostCard key={prenda.id} prenda={prenda} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <FilterSidebar open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      {modalOpen && <CreatePostModal onClose={() => setModalOpen(false)} onCreated={loadPrendas} />}
    </div>
  );
}
