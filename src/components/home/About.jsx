import React from "react";
import logo from "../../assets/logo-dark-am.png"; // Adjust the path as necessary
import { ArrowBigDownDash } from "lucide-react";

const About = () => {
  const scrollToDestinations = () => {
    const section = document.getElementById("destinations");
    if (section) {
      window.scrollTo({
        top: section.offsetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="about"
      className="py-24 bg-gradient-to-b from-gray-900 via-black to-black  relative overflow-hidden"
    >
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 opacity-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Image & Badge */}
          <div className="lg:w-1/2 relative group">
            {/* Floating Glow Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/30 to-purple-600/30 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>

            {/* Main Image Card */}
            <div className="relative bg-gray-800/30 backdrop-blur-xl border border-gray-600/40 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl hover:shadow-cyan-500/20 transition-all duration-500 transform group-hover:scale-105">
              <img
                src={logo}
                alt="Aether Travel Team"
                className="w-full object-cover p-5"
                style={{ height: "auto", maxHeight: "560px" }}
              />
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-8 -left-8 bg-black border border-gray-700 rounded-2xl p-5 shadow-2xl font-bold tracking-wide bg-gradient-to-b from-gray-900 to-black transform transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 hidden lg:block">
              <div className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                25+
              </div>
              <div className="text-sm text-gray-400">Years of Excellence</div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-1/2 space-y-8">
            {/* Badge */}
            <span className="text-cyan-400 text-sm font-semibold bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/20 inline-block hover:bg-cyan-400/20 hover:scale-110 hover:shadow-2xl transition-transform duration-500  hover:cursor-pointer">
              About Al Madaar Travels
            </span>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Redefining{" "}
              <span
                className="bg-clip-text text-transparent
                  animate-gradient-x"
              >
                Luxury
              </span>{" "}
              Travel
            </h2>

            {/* Paragraphs */}
            <p className="text-lg text-gray-300 leading-relaxed">
              Founded in 1998, Aether Travel has been pioneering the luxury
              travel industry with an unwavering commitment to excellence,
              personalized service, and access to the world’s most exclusive
              experiences.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Our team of travel designers combines decades of industry
              expertise with genuine passion to craft journeys that transcend
              expectations. We don’t just plan trips—we create transformative
              experiences that become lifelong memories.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="transform transition-all duration-300 hover:scale-105">
                <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
                  15,000+
                </div>
                <div className="text-gray-400 text-sm md:text-base">
                  Journeys Curated
                </div>
              </div>
              <div className="transform transition-all duration-300 hover:scale-105">
                <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  98%
                </div>
                <div className="text-gray-400 text-sm md:text-base">
                  Client Satisfaction
                </div>
              </div>
            </div>

            {/* CEO Signature */}
            <div className="flex items-center space-x-4 pt-2 group">
              <img
                src="https://scontent.flyp2-1.fna.fbcdn.net/v/t39.30808-6/487735449_9696602003737970_32372907347042338_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEp9kv7918LYGPZdOS-HuHR8yA7dRRWCCPzIDt1FFYII_L5SEcxWb_cjK9in-lAKuD6p2EPpd6WiK2EDipLIVQ2&_nc_ohc=7jUAlvzJhboQ7kNvwF3WXkU&_nc_oc=AdlrwR7MJ8Ry6IyxkiOCyrs3iI2OFenNPu3z18bTLS5rfs4drCQ975rl_c5ML17AHng&_nc_zt=23&_nc_ht=scontent.flyp2-1.fna&_nc_gid=LroN6cmM3hpz5REDhqDHFw&oh=00_AfX5ZeI2Xg-JgUwr7_a1e1Lvs_OcOByduOO94h3lA1Drzg&oe=68A22984"
                alt="Elena Richardson, Founder & CEO"
                className="w-14 h-14 object-cover rounded-full border-2 border-cyan-400/50 shadow-lg group-hover:border-cyan-300 transition-colors duration-300"
              />
              <div>
                <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">
                  Mudassar Javed (MJ)
                </div>
                <div className="text-sm text-gray-400">Founder & CEO</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="flex flex-col items-center mt-16 cursor-pointer group"
          onClick={scrollToDestinations}
        >
          <div className="flex flex-col items-center text-yellow-500 hover:text-yellow-400 transition-all duration-300">
            <ArrowBigDownDash
              className="h-8 w-8 animate-bounce opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-300"
              strokeWidth={2}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
