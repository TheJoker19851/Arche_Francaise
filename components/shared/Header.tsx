export default function Header() {
  return (
    <header className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-gray-900/60 to-gray-900" />
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 to-purple-900/30" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
          Arche Française
        </h1>
        <p className="mt-2 text-lg sm:text-xl text-gray-300 font-light">
          Suivi saisonnier des combats
        </p>
      </div>
    </header>
  );
}
