import React from "react";
import { Award, Star, Sparkles, Trophy, ArrowBigDownDash } from "lucide-react";
import reward from "../../assets/home/reward.jpg";

const WhyUs = () => {
  const awards = [
    {
      title: "World Travel Awards",
      subtitle: "Luxury Travel Operator of the Year",
      year: "2023",
      icon: Award,
      color: "yellow",
      gradient: "from-yellow-400 to-yellow-600",
      shadow: "shadow-yellow-500/10",
    },
    {
      title: "Condé Nast Traveler",
      subtitle: "Top Travel Specialists",
      year: "2023",
      icon: Star,
      color: "purple",
      gradient: "from-purple-500 to-purple-700",
      shadow: "shadow-purple-500/10",
    },
    {
      title: "Travel + Leisure",
      subtitle: "A-List Travel Advisors",
      year: "2023",
      icon: Sparkles,
      color: "pink",
      gradient: "from-pink-500 to-pink-700",
      shadow: "shadow-pink-500/10",
    },
    {
      title: "Luxury Travel Guide",
      subtitle: "Best Luxury Experiences",
      year: "2023",
      icon: Trophy,
      color: "blue",
      gradient: "from-blue-500 to-blue-700",
      shadow: "shadow-blue-500/10",
    },
  ];

  const goDown = () => {
    const section = document.getElementById("airlines");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="awards"
      className="py-24 bg-gradient-to-b from-gray-900 via-black to-black relative overflow-hidden"
    >
      {/* Animated Starry Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-cyan-400 text-sm font-semibold bg-cyan-400/10 px-5 py-2 rounded-full border border-cyan-400/20 hover:bg-cyan-400/20 hover:scale-105 transition-all duration-300 cursor-pointer inline-block mb-4">
            🏆 Our Recognition
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Industry{" "}
            <span className="bg-clip-text text-transparent animate-gradient-x">
              Accolades
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Our commitment to excellence has been recognized by the world's most
            prestigious travel organizations and publications.
          </p>
        </div>

        {/* Awards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {awards.map((award, index) => (
            <div
              key={index}
              className={`group text-center p-8 rounded-3xl bg-gradient-to-b from-gray-800/60 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm transition-all duration-500 hover:border-${award.color}-500/50 hover:shadow-2xl ${award.shadow} hover:shadow-${award.color}-500/20 hover:scale-105 hover:translate-y-[-6px] cursor-default`}
            >
              {/* Icon Circle */}
              <div
                className={`w-16 h-16 bg-gradient-to-br ${award.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform duration-300`}
              >
                <award.icon className="h-8 w-8" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                {award.title}
              </h3>

              {/* Subtitle */}
              <p className="text-gray-400 mb-2 group-hover:text-gray-300 transition-colors duration-300">
                {award.subtitle}
              </p>

              {/* Year */}
              <div
                className={`text-sm font-medium text-${award.color}-400 mt-4`}
              >
                {award.year}
              </div>
            </div>
          ))}
        </div>

        {/* Highlighted Award */}
        <div className="text-center ">
          <div className="inline-block bg-gray-800/40 backdrop-blur-md border border-gray-700/60 rounded-3xl p-8 shadow-2xl transform transition-all duration-500 hover:scale-105 hover:shadow-3xl hover:shadow-cyan-500/20 max-w-2xl">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <img
                src={reward}
                alt="Global Travel Excellence Award"
                className="w-40 h-40 rounded-xl object-cover shadow-lg"
              />
              <div className="text-left">
                <h3 className="text-xl font-bold text-white mb-1">
                  Platinum Award by Flydubai
                </h3>
                <p className="text-gray-300 mb-2">
                  Top Contributor Passenger's Sales.
                </p>
                <div className="flex items-center text-cyan-400 font-medium text-sm">
                  <Star className="h-4 w-4 mr-1" fill="currentColor" />
                  <span>2015</span>
                </div>
              </div>
            </div>
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

export default WhyUs;
