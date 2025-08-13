import React from "react";
import {
  Layout,
  Building2,
  Headphones,
  MapPin,
  Leaf,
  Car,
  ArrowDown,
  ArrowBigDownDash,
} from "lucide-react";

// Smooth scroll helper
const goDown = () => {
  const section = document.getElementById("about");
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
};

const Expertise = () => {
  // Expertise data for DRY rendering
  const expertiseData = [
    {
      title: "Bespoke Itineraries",
      description:
        "Every journey is meticulously crafted to match your unique preferences, interests, and pace. No two itineraries are alike.",
      icon: Layout,
      color: "cyan",
      shadow: "shadow-cyan-500/10",
      hoverBorder: "hover:border-cyan-500/50",
      hoverText: "text-cyan-400",
    },
    {
      title: "Luxury Accommodations",
      description:
        "Access to the world's most exclusive properties with VIP treatment, room upgrades, and special amenities.",
      icon: Building2,
      color: "purple",
      shadow: "shadow-purple-500/10",
      hoverBorder: "hover:border-purple-500/50",
      hoverText: "text-purple-400",
    },
    {
      title: "24/7 Concierge",
      description:
        "Round-the-clock support from our travel experts, available to assist with any request or adjustment.",
      icon: Headphones,
      color: "pink",
      shadow: "shadow-pink-500/10",
      hoverBorder: "hover:border-pink-500/50",
      hoverText: "text-pink-400",
    },
    {
      title: "Exclusive Access",
      description:
        "Private viewings, behind-the-scenes tours, and access to experiences unavailable to the general public.",
      icon: MapPin,
      color: "blue",
      shadow: "shadow-blue-500/10",
      hoverBorder: "hover:border-blue-500/50",
      hoverText: "text-blue-400",
    },
    {
      title: "Sustainable Travel",
      description:
        "Eco-conscious journeys that support local communities and minimize environmental impact.",
      icon: Leaf,
      color: "green",
      shadow: "shadow-green-500/10",
      hoverBorder: "hover:border-green-500/50",
      hoverText: "text-green-400",
    },
    {
      title: "Private Transfers",
      description:
        "Seamless airport transfers and private transportation throughout your journey in luxury vehicles.",
      icon: Car,
      color: "yellow",
      shadow: "shadow-yellow-500/10",
      hoverBorder: "hover:border-yellow-500/50",
      hoverText: "text-yellow-400",
    },
  ];

  return (
    <section id="expertise" className="py-24 bg-gradient-to-b from-gray-900 via-black to-black  relative overflow-hidden">
      {/* Subtle Animated Background Gradient */}
      <div className="absolute inset-0 opacity-20 pointer-events-none "></div>

      <div className="max-w-7xl  mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-cyan-400 text-sm font-semibold bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/20 inline-block hover:bg-cyan-400/20 hover:scale-110 hover:shadow-2xl transition-transform duration-500  hover:cursor-pointer tracking-wide mb-4">
            Our Expertise
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Crafting Extraordinary{" "}
            <span
              className="bg-clip-text text-transparent
                  animate-gradient-x"
            >
              Experiences
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Our team of travel connoisseurs combines decades of industry
            expertise with unparalleled access to create journeys that go beyond
            the ordinary.
          </p>
        </div>

        {/* Expertise Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {expertiseData.map((item, index) => {
            const Icon = item.icon;
            const colorClasses = {
              cyan: "bg-cyan-500/20 text-cyan-400",
              purple: "bg-purple-500/20 text-purple-400",
              pink: "bg-pink-500/20 text-pink-400",
              blue: "bg-blue-500/20 text-blue-400",
              green: "bg-green-500/20 text-green-400",
              yellow: "bg-yellow-500/20 text-yellow-400",
            };

            return (
              <div
                key={index}
                className={`group bg-gradient-to-br from-gray-900/80 to-gray-800/60 p-8 rounded-3xl border border-gray-700 backdrop-blur-sm transition-all duration-500 hover:border-${item.color}-500/50 hover:shadow-2xl ${item.shadow} hover:shadow-${item.color}-500/20 hover:scale-105 hover:translate-y-[-4px] cursor-pointer`}
              >
                {/* Icon Circle */}
                <div
                  className={`w-14 h-14 ${
                    colorClasses[item.color]
                  } rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                {/* Title */}
                <h3
                  className={`text-xl font-bold text-white mb-4 transition-colors duration-300 group-hover:${item.hoverText}`}
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 mb-6 transition-colors duration-300 group-hover:text-gray-300">
                  {item.description}
                </p>

                {/* CTA */}
                <div
                  className={`flex items-center font-medium transition-all duration-300 group-hover:translate-x-2 ${item.hoverText}`}
                >
                  <span>Learn more</span>
                  <ArrowDown
                    className="h-5 w-5 ml-1 rotate-90"
                    strokeWidth={2}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll Down Indicator */}

        <div className="group cursor-pointer" onClick={goDown}>
          <div className="flex flex-col items-center hover:scale-150 transition-transform duration-500 ">
            <ArrowBigDownDash className="h-8 w-8 text-yellow-500 animate-bounce hover:cursor-pointer" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Expertise;
