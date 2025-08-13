import React, { useState } from "react";
import { Key, LockKeyhole, Menu, X } from "lucide-react"; // Import icons from lucide-react
import logo from "../../assets/home/logo.png"; // Adjust the path as necessary
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed w-full bg-gray-900/50 backdrop-blur-md z-50 border-b border-gray-800 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="border border-white rounded-md shadow-lg p-1 bg-gray-800/50 backdrop-blur-sm">
                  <img src={logo} width={50} alt="Al Rayyan Travels" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white bg-clip-text">
                    Al Rayyan
                  </div>
                  <span className="text-gray-400 text-sm">
                    Travel & Tourism
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:space-x-8 ml-10">
              {[
                "Home",
                "Expertise",
                "Destinations",
                "About",
                "Awards",
                "Airlines",
                "Contact",
              ].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-300 hover:text-cyan-400 px-1 py-2 text-sm font-medium transition-colors duration-300 relative group"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}
            </div>
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:block">
            <Link
              to="/dashboard"
              className="bg-gradient-to-bl flex items-center from-cyan-300 to-blue-500 text-white hover:bg-cyan-600 px-6 py-2 text-sm rounded-md transition-all duration-300"
            >
              Agent Login <LockKeyhole className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-cyan-400 hover:bg-gray-800 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" /> // Close icon from lucide-react
              ) : (
                <Menu className="h-6 w-6" /> // Menu icon from lucide-react
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800/95 backdrop-blur-md">
            {[
              "Home",
              "Expertise",
              "Destinations",
              "About",
              "Awards",
              "Airlines",
              "Contact",
            ].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
                className="block text-gray-300 hover:text-cyan-400 px-3 py-2 text-base font-medium transition-colors duration-300"
              >
                {item}
              </a>
            ))}
            {/* Mobile Login Button */}
            <a
              href="#login"
              className="block text-center bg-cyan-500 text-white hover:bg-cyan-600 px-6 py-2 rounded-md mt-4"
            >
              Login
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
