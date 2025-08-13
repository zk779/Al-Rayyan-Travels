import React, { useState, useEffect } from "react";
import {
  ArrowBigDownDash,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const TopDestinations = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Cleaned and realistic destination data
  const destinations = [
    {
      id: 1,
      name: "The Maldives",
      region: "Indian Ocean",
      price: "$8,999",
      image:
        "https://media.istockphoto.com/id/482206266/photo/kaaba-in-mecca.jpg?s=612x612&w=0&k=20&c=wwzNu3XMQpCRVdAcBbeerUGaew0Fk2nGPQkH98Wj474=",
      description:
        "Overwater villas, crystal-clear lagoons, and unparalleled marine life.",
    },
    {
      id: 2,
      name: "Dubai, UAE",
      region: "Middle East",
      price: "$1,099",
      image:
        "https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg",
      description:
        "Experience luxury and innovation in this modern desert oasis with world-class attractions.",
    },
    {
      id: 3,
      name: "Santorini, Greece",
      region: "Mediterranean",
      price: "$5,499",
      image:
        "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg",
      description:
        "Whitewashed buildings perched on volcanic cliffs offer breathtaking views.",
    },
    {
      id: 4,
      name: "Kyoto, Japan",
      region: "Asia",
      price: "$6,799",
      image: "https://images.pexels.com/photos/315191/pexels-photo-315191.jpeg",
      description:
        "Ancient temples, traditional tea houses, and cherry blossoms create a journey through time.",
    },
  ];

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % destinations.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [destinations.length]);

  const goToSlide = (index) => setCurrentSlide(index);
  const prevSlide = () =>
    setCurrentSlide(
      currentSlide === 0 ? destinations.length - 1 : currentSlide - 1
    );
  const nextSlide = () =>
    setCurrentSlide(
      currentSlide === destinations.length - 1 ? 0 : currentSlide + 1
    );

  const goDown = () => {
    const section = document.getElementById("awards");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="destinations"
      className="py-24 bg-gradient-to-b from-gray-900 via-black to-black  relative overflow-hidden"
    >
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-cyan-400 text-sm font-semibold bg-cyan-400/10 px-5 py-2 rounded-full border border-cyan-400/20 hover:bg-cyan-400/20 hover:scale-105 transition-all duration-300 cursor-pointer inline-block mb-4">
            🌍 Featured Destinations
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Top{" "}
            <span
              className="bg-clip-text text-transparent animate-gradient-x"
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              Destinations
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Discover breathtaking locations around the globe, each offering
            unique experiences and unforgettable memories crafted by our expert
            travel designers.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative group">
          <div className="overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-shadow duration-500 aspect-video">
            <div
              className="flex transition-transform duration-1000 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {destinations.map((dest) => (
                <div key={dest.id} className="w-full flex-shrink-0 relative">
                  <div className="relative h-96 md:h-[600px] lg:h-[640px]">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-in-out"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                      <div className="inline-block mb-4">
                        <span className="text-cyan-300 text-sm font-semibold bg-cyan-400/20 px-4 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-sm">
                          {dest.region}
                        </span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                        {dest.name}
                      </h3>
                      <p className="text-gray-200 text-lg mb-6 max-w-lg drop-shadow">
                        {dest.description}
                      </p>
                      <div className="flex items-center text-cyan-300 font-bold text-xl">
                        <span>{dest.price}</span>
                        <span className="text-gray-400 text-sm ml-2">
                          per person
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center shadow-lg hover:bg-white/30 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
            aria-label="Previous destination"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center shadow-lg hover:bg-white/30 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
            aria-label="Next destination"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Slide Indicators */}
          <div className="flex justify-center mt-8 space-x-3">
            {destinations.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "bg-cyan-400 scale-125 shadow-lg shadow-cyan-400/50"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to destination ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="group cursor-pointer mt-8" onClick={goDown}>
        <div className="flex flex-col items-center hover:scale-150 transition-transform duration-500 ">
          <ArrowBigDownDash className="h-8 w-8 text-yellow-500 animate-bounce hover:cursor-pointer" />
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
