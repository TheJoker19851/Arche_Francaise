import Image from "next/image";

export default function Header() {
  return (
    <header className="relative w-full h-32 sm:h-48 md:h-56 lg:h-64 overflow-hidden bg-gray-900">
      <Image
        src="/Entete l'arche.webp"
        alt="Arche Française"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-gray-900/50 to-gray-900" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
          Arche Française
        </h1>
        <p className="mt-1 sm:mt-2 text-base sm:text-lg text-gray-200 font-light drop-shadow">
          Suivi saisonnier des combats
        </p>
      </div>
    </header>
  );
}
