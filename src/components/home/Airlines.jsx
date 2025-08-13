import React, { useState, useRef, useEffect } from "react";
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
  const [airlineSlide, setAirlineSlide] = useState(0);
  const airlineSliderRef = useRef(null);

  // Airline carousel auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setAirlineSlide((prev) => (prev + 1) % airlineImages.length);
    }, 3000); // Adjusted time for better user experience
    return () => clearInterval(interval);
  }, []);

  // Manual slide change for airlines
  const goToAirlineSlide = (index) => {
    setAirlineSlide(index);
  };

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

  const goDown = () => {
    const section = document.getElementById("awards");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="airlines"
      className="py-20 bg-gradient-to-b from-gray-900 via-black to-black border-t border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-cyan-400 text-sm font-semibold bg-cyan-400/10 px-5 py-2 rounded-full border border-cyan-400/20 hover:bg-cyan-400/20 hover:scale-105 transition-all duration-300 cursor-pointer inline-block mb-4">
            Preferred Partners
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            <span className="">Exclusive</span>{" "}
            <span className="bg-clip-text text-transparent animate-gradient-x">
              Airline Partnerships
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Our strategic partnerships with the world's leading airlines ensure
            our clients receive preferential treatment, upgrades, and access to
            private terminals.
          </p>
        </div>

        {/* Carousel Section */}
        <div className="relative overflow-hidden py-8">
          <div
            ref={airlineSliderRef}
            className="flex transition-transform duration-1000 ease-in-out"
            style={{
              transform: `translateX(-${
                airlineSlide * (100 / airlineImages.length)
              }%)`,
            }}
          >
            {[...Array(2)].map((_, index) => (
              <React.Fragment key={index}>
                {airlineImages.map(({ src, alt }, idx) => (
                  <div
                    key={alt}
                    className="flex-shrink-0 w-1/9 px-6 flex items-center justify-center"
                  >
                    <div className="relative group">
                      <img
                        src={src}
                        alt={alt}
                        className="h-16 w-auto transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Subtle gradient overlays on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/50 to-transparent z-10 pointer-events-none"></div>
        </div>

        {/* Carousel Navigation Dots */}
        <div className="flex justify-center mt-8 space-x-3">
          {airlineImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToAirlineSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                airlineSlide === idx
                  ? "bg-cyan-400 scale-150"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
              aria-label={`Go to airline ${idx + 1}`}
            />
          ))}
        </div>

        {/* Scroll Down Arrow */}
        <div className="group cursor-pointer mt-8" onClick={goDown}>
          <div className="flex flex-col items-center hover:scale-150 transition-transform duration-500 ">
            <ArrowBigDownDash className="h-8 w-8 text-yellow-500 animate-bounce hover:cursor-pointer" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Airlines;
