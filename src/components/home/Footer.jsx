import React from "react";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react"; // Importing icons from lucide-react
import logo from "../../assets/logo-dark-am.png"; // Adjust the path as necessary

const Footer = () => {
  const links = {
    services: [
      "Bespoke Itineraries",
      "Luxury Accommodations",
      "Private Transfers",
      "Concierge Service",
      "Group Travel",
    ],
    company: ["About Us", "Awards", "Careers", "Press", "Sustainability"],
  };

  const socialIcons = [
    { icon: <Facebook className="h-6 w-6" />, href: "#" },
    { icon: <Instagram className="h-6 w-6" />, href: "#" },
    { icon: <Twitter className="h-6 w-6" />, href: "#" },
    { icon: <Linkedin className="h-6 w-6" />, href: "#" },
  ];

  const renderLinks = (linksArray) => (
    <ul className="space-y-3">
      {linksArray.map((item, index) => (
        <li key={index}>
          <a
            href="#"
            className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
          >
            {item}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="bg-black border-t border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="border border-white rounded-md shadow-lg p-1 bg-gray-800/50 backdrop-blur-sm">
                <img src={logo} width={50} alt="Al Madaar Travels" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white bg-clip-text">
                  Al Madaar
                </div>
                <span className="text-gray-400 text-sm">Travel & Tourism</span>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Creating extraordinary travel experiences since 1998. We
              specialize in luxury, bespoke journeys that transcend expectations
              and create lifelong memories.
            </p>
            <div className="flex space-x-6">
              {socialIcons.map(({ icon, href }, index) => (
                <a
                  key={index}
                  href={href}
                  className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Services</h3>
            {renderLinks(links.services)}
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Company</h3>
            {renderLinks(links.company)}
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Aether Travel. All rights
              reserved.
            </div>
            <div className="flex space-x-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                (item, index) => (
                  <a
                    key={index}
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                  >
                    {item}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
