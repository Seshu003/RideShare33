"use client";
import React, { useState } from "react";
import NavigationBar from "../components/navigation-bar";

function MainComponent() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const fetchPlaceSuggestions = async (input, type) => {
    if (!input) {
      type === "origin"
        ? setOriginSuggestions([])
        : setDestinationSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/places/locationiq?input=${encodeURIComponent(input)}`
      );
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      const data = await response.json();
      type === "origin"
        ? setOriginSuggestions(data.predictions || [])
        : setDestinationSuggestions(data.predictions || []);
    } catch (err) {
      console.error("Error fetching places:", err);
    }
  };
  const handleSearch = () => {
    window.location.href = `/search?origin=${origin}&destination=${destination}&date=${date}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <NavigationBar currentPage="/" />

      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-inter">
              Share Rides, Split Costs
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-12 font-inter">
              Find and share rides with trusted people in your community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/search"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-inter"
              >
                Find a Ride
              </a>
              <a
                href="/create-ride"
                className="border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-md hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors font-inter"
              >
                Offer a Ride
              </a>
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-1">
                  <input
                    type="text"
                    placeholder="From"
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      fetchPlaceSuggestions(e.target.value, "origin");
                    }}
                  />
                  {originSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mt-1">
                      {originSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.place_id}
                          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            setOrigin(suggestion.description);
                            setOriginSuggestions([]);
                          }}
                        >
                          {suggestion.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative md:col-span-1">
                  <input
                    type="text"
                    placeholder="To"
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      fetchPlaceSuggestions(e.target.value, "destination");
                    }}
                  />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mt-1">
                      {destinationSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.place_id}
                          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            setDestination(suggestion.description);
                            setDestinationSuggestions([]);
                          }}
                        >
                          {suggestion.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="date"
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <button
                  onClick={handleSearch}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-3 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-inter"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12 font-inter">
              How it Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-inter">
                  Search or Offer
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-inter">
                  Search for a ride or offer one
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-inter">
                  Connect
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-inter">
                  Connect with drivers or passengers
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-inter">
                  Travel Together
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-inter">
                  Travel together and split costs
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a
                href="/about"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-inter"
              >
                About
              </a>
              <a
                href="/contact"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-inter"
              >
                Contact
              </a>
              <a
                href="/terms"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-inter"
              >
                Terms
              </a>
            </div>
            <div className="text-gray-700 dark:text-gray-300 font-inter">
              © 2025 RideShare. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainComponent;