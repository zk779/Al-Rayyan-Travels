import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Emirates from "../../assets/home/airlines/emirates.png";
import AirAsia from "../../assets/home/airlines/airasia.png";
import Etihad from "../../assets/home/airlines/etihad.png";
import FlyDubai from "../../assets/home/airlines/Flyduba.png";
import FlyAdeel from "../../assets/home/airlines/flyadeel.jpg";
import FlyNas from "../../assets/home/airlines/flynas.jpg";
import Qatar from "../../assets/home/airlines/qatar.png";
import Saudi from "../../assets/home/airlines/saudi.png";
import Turkish from "../../assets/home/airlines/turkish.png";
import { ArrowBigDownDash } from "lucide-react";

const Airlines = () => {
  const airlineImages = [
    { src: Emirates, alt: "Emirates" },
    { src: AirAsia, alt: "AirAsia" },
    { src: Etihad, alt: "Etihad" },
    { src: FlyDubai, alt: "FlyDubai" },
    { src: FlyAdeel, alt: "FlyAdeel" },
    { src: FlyNas, alt: "FlyNas" },
    { src: Qatar, alt: "Qatar Airways" },
    { src: Saudi, alt: "Saudi Airlines" },
    { src: Turkish, alt: "Turkish Airlines" },
  ];

  // items per view by breakpoint
  const [itemsPerView, setItemsPerView] = useState(3); // phones default

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w >= 1024) setItemsPerView(7); // lg+
      else if (w >= 768) setItemsPerView(5); // md
      else setItemsPerView(3); // sm & below
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // chunk into pages
  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < airlineImages.length; i += itemsPerView) {
      out.push(airlineImages.slice(i, i + itemsPerView));
    }
    return out.length ? out : [airlineImages];
  }, [airlineImages, itemsPerView]);

  const totalPages = pages.length;

  const [page, setPage] = useState(0);
  const timerRef = useRef(null);

  const startAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPage((p) => (p + 1) % totalPages);
    }, 3000);
  }, [totalPages]);

  const stopAuto = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAuto();
    const onVis = () => (document.hidden ? stopAuto() : startAuto());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopAuto();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [startAuto, stopAuto]);

  // keep page in range if itemsPerView changes
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const goTo = (idx) => setPage(idx);

  const goDown = () => {
    const section = document.getElementById("awards");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="airlines"
      className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 via-black to-black border-t border-gray-800"
      aria-label="Airline partners"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-cyan-400 text-xs sm:text-sm font-semibold bg-cyan-400/10 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-cyan-400/20 hover:bg-cyan-400/20 hover:scale-105 transition-all duration-300 inline-block mb-3 sm:mb-4">
            Preferred Partners
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            <span>Exclusive </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400">
              Airline Partnerships
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-3xl mx-auto">
            Our strategic partnerships with the world's leading airlines ensure
            our clients receive preferential treatment, upgrades, and access to
            private terminals.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative overflow-hidden py-6 sm:py-8"
          onMouseEnter={stopAuto}
          onMouseLeave={startAuto}
        >
          {/* Track */}
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {pages.map((group, gi) => (
              <div
                key={`page-${gi}`}
                className="w-full flex-shrink-0 px-1 sm:px-2"
                aria-roledescription="slide"
                aria-label={`Page ${gi + 1} of ${totalPages}`}
              >
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 sm:gap-6 items-center">
                  {group.map(({ src, alt }, idx) => (
                    <div
                      key={`${alt}-${idx}`}
                      className="flex items-center justify-center"
                    >
                      <div className="relative group">
                        <img
                          src={src}
                          alt={alt}
                          className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                          loading={gi === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                        <div className="hidden sm:block absolute inset-0 rounded-md bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Edge fades */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-12 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-12 bg-gradient-to-l from-black/60 to-transparent" />
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-6 sm:mt-8 gap-2.5 sm:gap-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to page ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                page === i
                  ? "bg-cyan-400 scale-125"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>

        {/* Scroll down */}
        <div className="mt-8 sm:mt-10 flex justify-center">
          <button
            type="button"
            onClick={goDown}
            className="group outline-none transition-transform duration-300 hover:scale-110"
            aria-label="Scroll to awards"
          >
            <ArrowBigDownDash className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Airlines;
