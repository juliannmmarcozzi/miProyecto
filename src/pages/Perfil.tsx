import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderActions from '../components/HeaderActions';

export default function Perfil() {
  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">

      <Header
        actions={
          <HeaderActions
            onFilters={() => {}}
            onCreate={() => {}}
          />
        }
      />

      <main className="flex-1 p-6">

        <h1 className="text-2xl font-bold text-ink mb-6">
          Mi perfil
        </h1>

        <div className="bg-white rounded-lg p-6 mb-6">

          <div className="flex items-center gap-4">

            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
            </div>

            <div>
              <h2 className="text-xl font-bold text-ink">
                Nombre de usuario
              </h2>

              <p className="text-gray-500">
                usuario@email.com
              </p>
            </div>

          </div>

          <button className="mt-6 bg-clay text-white px-4 py-2 rounded-lg">
            Editar perfil
        </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">

          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-gray-500">Publicaciones</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-gray-500">Seguidores</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-gray-500">Siguiendo</p>
          </div>

        </div>

        <div className="bg-white rounded-lg p-6">

          <h2 className="text-xl font-bold text-ink mb-4">
            Mis publicaciones
          </h2>

        </div>

      </main>

      <Footer />

    </div>
  );
}