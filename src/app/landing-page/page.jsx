"use client";
import React, { useState, useEffect } from "react";
import NavigationBar from "../../components/navigation-bar";

function MainComponent() {
  const [content, setContent] = useState({
    hero: "",
    howItWorks: [],
    benefits: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [rides, setRides] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [placeResults, setPlaceResults] = useState({
    origin: [],
    destination: [],
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch("/integrations/google-gemini/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content:
                  "Generate content for a ridesharing platform landing page including: 1. A hero section tagline, 2. Three how-it-works steps, 3. Four key benefits",
              },
            ],
            json_schema: {
              name: "landing_page_content",
              schema: {
                type: "object",
                properties: {
                  heroTagline: { type: "string" },
                  howItWorks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                  },
                  benefits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["heroTagline", "howItWorks", "benefits"],
                additionalProperties: false,
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }

        const data = await response.json();
        const generatedContent = JSON.parse(data.choices[0].message.content);
        setContent(generatedContent);

        const ridesResponse = await fetch("/api/search-rides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: new Date().toISOString() }),
        });

        if (ridesResponse.ok) {
          const { rides } = await ridesResponse.json();
          setRides(rides || []);
        }
      } catch (err) {
        setError("Failed to load content");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleSearch = async () => {
    try {
      const response = await fetch("/api/search-rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, date }),
      });

      if (response.ok) {
        const { rides } = await response.json();
        setSearchResults(rides);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };
  const handlePlaceSearch = async (input, type) => {
    try {
      const response = await fetch(
        `/integrations/google-place-autocomplete/autocomplete/json?input=${encodeURIComponent(
          input
        )}&radius=500`
      );
      const data = await response.json();
      setPlaceResults((prev) => ({
        ...prev,
        [type]: data.predictions || [],
      }));
    } catch (err) {
      console.error("Place search failed:", err);
    }
  };

  if (error) {
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <p className="text-red-500 font-inter mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <NavigationBar
        currentPage="/"
        brandName="RideShare"
        onSignIn={() => (window.location.href = "/login")}
      />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="py-20 text-center">
            <h1 className="text-5xl md:text-6xl font-bold font-inter text-gray-900 dark:text-white mb-8">
              Share Your Journey
            </h1>
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
          </section>
          <section className="py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="From"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md font-inter"
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      handlePlaceSearch(e.target.value, "origin");
                    }}
                  />
                  {placeResults.origin.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md mt-1">
                      {placeResults.origin.map((place, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => {
                            setOrigin(place.description);
                            setPlaceResults((prev) => ({
                              ...prev,
                              origin: [],
                            }));
                          }}
                        >
                          {place.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="To"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md font-inter"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      handlePlaceSearch(e.target.value, "destination");
                    }}
                  />
                  {placeResults.destination.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md mt-1">
                      {placeResults.destination.map((place, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => {
                            setDestination(place.description);
                            setPlaceResults((prev) => ({
                              ...prev,
                              destination: [],
                            }));
                          }}
                        >
                          {place.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md font-inter"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 font-inter"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16">
            <h2 className="text-3xl font-bold font-inter text-gray-900 dark:text-white text-center mb-12">
              Available Rides
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(searchResults.length > 0 ? searchResults : rides).map(
                (ride, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold font-inter text-gray-900 dark:text-white">
                          {ride.origin} → {ride.destination}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                          {new Date(ride.departure_time).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(ride.departure_time).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white font-inter">
                          ${ride.price_per_seat}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                          {ride.available_seats} seats left
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center mb-4">
                      <img
                        src={
                          ride.driver_profile_picture || "/default-avatar.png"
                        }
                        alt="Driver"
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <span className="font-inter text-gray-900 dark:text-white">
                        {ride.driver_name}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        (window.location.href = `/book-ride/${ride.id}`)
                      }
                      className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 font-inter"
                    >
                      Book Now
                    </button>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="py-16">
            <h2 className="text-3xl font-bold font-inter text-gray-900 dark:text-white text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {isLoading
                ? [...Array.from({ length: 3 })].map((_, i) => (
                    <div
                      key={i}
                      className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"
                    ></div>
                  ))
                : content.howItWorks.map((step, index) => (
                    <div
                      key={index}
                      className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-bold font-inter text-gray-900 dark:text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 font-inter">
                        {step.description}
                      </p>
                    </div>
                  ))}
            </div>
          </section>
          <section className="py-16">
            <h2 className="text-3xl font-bold font-inter text-gray-900 dark:text-white text-center mb-12">
              Benefits
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {isLoading
                ? [...Array.from({ length: 4 })].map((_, i) => (
                    <div
                      key={i}
                      className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"
                    ></div>
                  ))
                : content.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <h3 className="text-xl font-bold font-inter text-gray-900 dark:text-white mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 font-inter">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
