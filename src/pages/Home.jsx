import React, { useState, useEffect } from "react";
import { ArrowBigUpDash } from "lucide-react"; // Import the Go Up icon
import Hero from "../components/home/Hero";
import Expertise from "../components/home/Expertise";
import About from "../components/home/About";
import Whyus from "../components/home/Awards";
import Airlines from "../components/home/Airlines";
import Footer from "../components/home/Footer";
import Contactus from "../components/home/Contactus";
import Header from "../components/home/Header";
import TopDestinations from "../components/home/TopDestinations";

const App = () => {
  const [showGoUp, setShowGoUp] = useState(false);

  // Handle scroll event to show/hide the "Go Up" button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowGoUp(true); // Show the "Go Up" button when scrolled 200px down
      } else {
        setShowGoUp(false); // Hide the "Go Up" button when at the top
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Scroll to top when "Go Up" button is clicked
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="font-sans overflow-x-hidden">
      <Header />
      <Hero />
      <Expertise />
      <About />
      <TopDestinations />
      <Whyus />
      <Airlines />
      <Contactus />
      <Footer />

      {/* Go Up Button */}
      {showGoUp && (
        <div
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 cursor-pointer p-3 bg-gradient-to-bl from-cyan-300 to-blue-500 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
        >
          <ArrowBigUpDash className="h-8 w-8 text-white animate-bounce" />
        </div>
      )}
    </div>
  );
};

export default App;
