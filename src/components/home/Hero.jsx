import React from "react";
import hero from "../../assets/home/hero.jpg"; // Adjust the path as necessary
import {
  ArrowBigDown,
  ArrowBigDownDash,
  ArrowDown,
  CheckCircle,
  Globe,
  UserCheck,
} from "lucide-react"; // Import Lucide Icons

const Hero = () => {
  const goDown = () => {
    const section = document.getElementById("expertise");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <div>
      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center pt-24 overflow-hidden"
      >
        {/* Animated Gradient Background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-black "
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1540544660406-6a69dacb2804?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHRyYXZlbCUyMGFnZW5jeXxlbnwwfHwwfHx8MA%3D%3D')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.5) contrast(1.1)",
            animation: "gradientShift 15s ease infinite",
          }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-transparent"></div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            {/* Text Content */}
            <div className="lg:w-1/2 lg:pr-16 mb-12 lg:mb-0">
              {/* Badge */}
              <div className="inline-block mb-6 group">
                <span
                  className="text-cyan-300 text-sm font-semibold bg-gradient-to-r from-cyan-500/20 to-transparent px-4 py-2 rounded-full border border-cyan-500/30 backdrop-blur-sm
                  group-hover:from-cyan-500/30 group-hover:border-cyan-400/50 transition-all duration-300"
                >
                  ✨ Luxury Travel Redefined
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
                Journey Beyond the
                <br />
                <span
                  className="bg-clip-text text-transparent
                  animate-gradient-x"
                  style={{
                    backgroundSize: "200% 200%",
                  }}
                >
                  Extraordinary
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-xl">
                Crafted for discerning travelers. We design bespoke luxury
                journeys that blend adventure, elegance, and unforgettable
                moments across the globe.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <a
                  href="#destinations"
                  className="group bg-gradient-to-bl from-cyan-300 to-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-center
                  hover:shadow-2xl hover:shadow-cyan-500/30 transform hover:scale-105 hover:-translate-y-1
                  transition-all duration-300 ease-out"
                >
                  <span className="relative z-10">Explore Destinations</span>
                </a>
                <a
                  href="#contact"
                  className="group border-2 border-gray-500 text-gray-200 px-8 py-4 rounded-2xl font-bold text-center
                  hover:border-cyan-400 hover:text-cyan-300 hover:shadow-lg hover:shadow-cyan-500/10
                  transition-all duration-300 backdrop-blur-sm bg-black/10"
                >
                  Speak to an Expert
                </a>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap mt-12 gap-x-8 gap-y-4 text-sm text-gray-400">
                <div className="flex items-center group">
                  <Globe className="h-5 w-5 text-cyan-400 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span>15,000+ Journeys</span>
                </div>
                <div className="flex items-center group">
                  <UserCheck className="h-5 w-5 text-purple-400 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span>98% Satisfaction</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-5 w-5 text-pink-400 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span>25+ Countries</span>
                </div>
              </div>
            </div>

            {/* Image Card */}
            <div className="lg:w-1/2 mt-10 lg:mt-0">
              <div className="relative group">
                {/* Floating Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/40 to-purple-600/40 blur-xl opacity-0 group-hover:opacity-75 transition-opacity duration-500 scale-110"></div>

                {/* Main Image Container */}
                <div className="relative bg-gray-800/30 backdrop-blur-xl border border-gray-600/40 rounded-3xl p-2 shadow-2xl hover:shadow-3xl hover:shadow-cyan-500/20 transition-all duration-500 transform group-hover:scale-105">
                  <img
                    src={hero}
                    alt="Luxury Travel Experience"
                    className="rounded-2xl w-full object-cover"
                    style={{ height: "auto", maxHeight: "520px" }}
                  />

                  {/* Floating Badge */}
                  <div className="absolute -bottom-6 -right-6 bg-gradient-to-bl from-cyan-300 to-blue-500 text-white px-6 py-3 rounded-2xl shadow-lg font-bold tracking-wide transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <div className="text-2xl">25+</div>
                    <div className="text-xs opacity-90">
                      Years of Excellence
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20 hover:scale-150 transition-transform duration-500 hover:cursor-pointer">
          <ArrowBigDownDash
            className="h-8 w-8 text-yellow-500"
            onClick={() => goDown()}
          />
        </div>
      </section>
    </div>
  );
};

export default Hero;
