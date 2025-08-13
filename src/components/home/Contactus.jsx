import React from "react";
import { Phone, Mail, Video, Clock, ChevronRight } from "lucide-react";

const Contactus = () => {
  return (
    <div>
      {/* Contact Section */}
      <section
        id="contact"
        className="py-24 bg-gradient-to-b from-black to-gray-900 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="text-cyan-400 text-sm font-semibold bg-cyan-400/10 px-5 py-2 rounded-full border border-cyan-400/20 hover:bg-cyan-400/20 hover:scale-105 transition-all duration-300 cursor-pointer inline-block mb-4">
              Begin Your Journey
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent animate-gradient-x">
                Consult With Our
              </span>{" "}
              Travel Experts
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Ready to create your perfect journey? Our travel designers are
              ready to craft a bespoke experience tailored to your desires,
              preferences, and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Get in Touch
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mr-4">
                      <Phone className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Private Consultation
                      </h4>
                      <p className="text-gray-400">
                        Schedule a one-on-one meeting with our travel designers
                      </p>
                      <a
                        href="tel:+18005551234"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 mt-1 inline-block"
                      >
                        +1 (800) 555-1234
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mr-4">
                      <Mail className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Email Us
                      </h4>
                      <p className="text-gray-400">
                        Send us your travel ideas and preferences
                      </p>
                      <a
                        href="mailto:concierge@aethertravel.com"
                        className="text-purple-400 hover:text-purple-300 transition-colors duration-300 mt-1 inline-block"
                      >
                        concierge@aethertravel.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mr-4">
                      <Video className="h-6 w-6 text-pink-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Virtual Meeting
                      </h4>
                      <p className="text-gray-400">
                        Connect via video call at your convenience
                      </p>
                      <a
                        href="#"
                        className="text-pink-400 hover:text-pink-300 transition-colors duration-300 mt-1 inline-block"
                      >
                        Schedule a Call
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-black/50 rounded-xl border border-gray-700">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Clock className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-semibold text-yellow-400">
                        Response Time
                      </h4>
                      <p className="text-sm text-gray-400">
                        We typically respond within 2 business hours during
                        business days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300"
                      placeholder="Your first name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="destination"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Destination of Interest
                  </label>
                  <select
                    id="destination"
                    className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 appearance-none bg-gradient-to-r from-gray-900/70 to-gray-800/70"
                  >
                    <option value="">Select a destination</option>
                    <option value="maldives">Maldives</option>
                    <option value="santorini">Santorini, Greece</option>
                    <option value="kyoto">Kyoto, Japan</option>
                    <option value="safari">African Safari</option>
                    <option value="alaska">Alaska Cruise</option>
                    <option value="custom">Custom Itinerary</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="travelDate"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Preferred Travel Date
                  </label>
                  <input
                    type="date"
                    id="travelDate"
                    className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300"
                  />
                </div>

                <div>
                  <label
                    htmlFor="budget"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Estimated Budget
                  </label>
                  <select
                    id="budget"
                    className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white transition-all duration-300 appearance-none bg-gradient-to-r from-gray-900/70 to-gray-800/70"
                  >
                    <option value="">Select budget range</option>
                    <option value="10k">Under $10,000</option>
                    <option value="25k">$10,000 - $25,000</option>
                    <option value="50k">$25,000 - $50,000</option>
                    <option value="75k">$50,000 - $75,000</option>
                    <option value="100k">Over $75,000</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Additional Details
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 resize-none"
                    placeholder="Number of travelers, special requests, interests, etc."
                  ></textarea>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      id="newsletter"
                      type="checkbox"
                      className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-gray-600 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="newsletter"
                      className="text-sm text-gray-400"
                    >
                      Subscribe to our newsletter for exclusive offers and
                      travel inspiration
                    </label>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-bl from-cyan-300 to-blue-500 text-white py-4 px-8 rounded-xl font-semibold hover:shadow-2xl hover:shadow-cyan-500/25 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                  >
                    <span>Submit Request</span>
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contactus;
