"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import NavigationBar from "../../components/navigation-bar";

function MainComponent() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [rides, setRides] = useState([]);
  const [latestRides, setLatestRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState({
    origin: [],
    destination: [],
  });
  const [sortBy, setSortBy] = useState("departure");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [departureTime, setDepartureTime] = useState("any");
  const [vehicleType, setVehicleType] = useState("any");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [bookingStatus, setBookingStatus] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState(null);

  const originInputRef = useRef();
  const destinationInputRef = useRef();

  const inputRefs = {
    origin: originInputRef,
    destination: destinationInputRef
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestions.origin.length > 0 && !inputRefs.origin.current?.contains(event.target)) {
        setSuggestions(prev => ({ ...prev, origin: [] }));
      }
      if (suggestions.destination.length > 0 && !inputRefs.destination.current?.contains(event.target)) {
        setSuggestions(prev => ({ ...prev, destination: [] }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [suggestions]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchLatestRides();
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
    const interval = setInterval(fetchLatestRides, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatestRides = async () => {
    try {
      const response = await fetch('/api/rides/latest');
      const data = await response.json();
      if (data.success) {
        setLatestRides(data.rides.map(ride => ({
          ...ride,
          departure_time: new Date(ride.departure_time),
          price_per_seat: parseFloat(ride.price_per_seat),
          available_seats: parseInt(ride.available_seats),
          booked_seats: parseInt(ride.booked_seats || 0),
          route_details: ride.route_details || {},
          reviews: ride.reviews || [],
          driver_rating: ride.driver_rating || null,
        })));
      }
    } catch (error) {
      console.error('Error fetching latest rides:', error);
    }
  };

  const fetchPlaceSuggestions = async (input, type) => {
    if (!input || input.length < 2) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }

    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    setSearchDebounceTimeout(
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/places/locationiq?input=${encodeURIComponent(input)}`);
          const data = await response.json();
          if (data.predictions) {
            setSuggestions(prev => ({
              ...prev,
              [type]: data.predictions.map(prediction => ({
                ...prediction,
                display_name: prediction.description || prediction.structured_formatting?.main_text || ''
              }))
            }));
          }
        } catch (err) {
          console.error('Error fetching place suggestions:', err);
          setSuggestions(prev => ({
            ...prev,
            [type]: []
          }));
        }
      }, 500)
    );
  };

  const [seatsPreference, setSeatsPreference] = useState("specific");
  const searchRides = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setRides([]);

    try {
      if (!origin.trim() && !destination.trim()) {
        setError("Please enter at least origin or destination");
        return;
      }

      const searchParams = {
        origin: origin.trim(),
        destination: destination.trim(),
        date: searchDate,
        time,
        seats: seatsPreference === "specific" ? parseInt(seats) : null,
        price_range: priceRange,
        departure_time: departureTime,
        vehicle_type: vehicleType,
        include_nearby: true,
        radius: 50,
        flexible_seats: seatsPreference === "off"
      };
  
      if (searchParams.date) {
        const searchDateObj = new Date(searchParams.date);
        if (searchDateObj < new Date().setHours(0, 0, 0, 0)) {
          setError("Please select a future date");
          return;
        }
      }
  
      const response = await fetch("/api/rides/search", {
        method: "POST",
        body: JSON.stringify(searchParams),
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to search rides");
      }
  
      const formattedRides = (data.rides || []).map((ride) => ({
        ...ride,
        departure_time: new Date(ride.departure_time),
        price_per_seat: parseFloat(ride.price_per_seat),
        available_seats: parseInt(ride.available_seats),
        booked_seats: parseInt(ride.booked_seats || 0),
        route_details: ride.route_details || {},
        reviews: ride.reviews || [],
        driver_rating: ride.driver_rating || null,
      }));
      
      if (formattedRides.length === 0) {
        setError("No rides found matching your criteria. Try adjusting your search.");
      } else {
        setRides(formattedRides);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err.message || "Could not find rides at this time. Please try again.");
      console.error("Search rides error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  const handleSearch = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchRides();
  };
  const handleRefresh = async () => {
    await searchRides(true);
  };
  const handleBooking = async () => {
    if (!selectedRide || !passengerName || !passengerPhone) {
      setBookingStatus({
        success: false,
        message: "Please fill in all required fields",
      });
      return;
    }

    try {
      const response = await fetch("/api/book-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: selectedRide.id,
          passenger_name: passengerName,
          passenger_phone: passengerPhone,
        }),
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      const data = await response.json();
      if (data.success) {
        setBookingStatus({
          success: true,
          message: "Booking confirmed! Check your phone for details.",
        });
        setTimeout(() => {
          setBookingModalOpen(false);
          searchRides();
        }, 2000);
      } else {
        throw new Error(data.error || "Booking failed");
      }
    } catch (error) {
      setBookingStatus({
        success: false,
        message: error.message || "Failed to book ride. Please try again.",
      });
    }
  };

  const sortedRides = useMemo(() => {
    return [...rides]
      .sort((a, b) => {
        if (sortBy === "latest") {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        switch (sortBy) {
          case "price":
            return a.price_per_seat - b.price_per_seat;
          case "seats":
            return (
              b.available_seats -
              b.booked_seats -
              (a.available_seats - a.booked_seats)
            );
          case "rating":
            return (b.driver_rating || 0) - (a.driver_rating || 0);
          default:
            return a.departure_time - b.departure_time;
        }
      })
      .filter((ride) => {
        const price = ride.price_per_seat;
        const time = ride.departure_time.getHours();
        const type = ride.vehicle_type?.toLowerCase();

        const meetsPrice = price >= priceRange[0] && price <= priceRange[1];
        const meetsVehicleType =
          vehicleType === "any" || type === vehicleType.toLowerCase();

        let meetsTime = true;
        if (departureTime === "morning") meetsTime = time >= 6 && time < 12;
        if (departureTime === "afternoon") meetsTime = time >= 12 && time < 18;
        if (departureTime === "evening") meetsTime = time >= 18 || time < 6;

        return meetsPrice && meetsTime && meetsVehicleType;
      });
  }, [rides, sortBy, priceRange, departureTime, vehicleType]);

  const handleInputBlur = (type) => {
    // Increase timeout to give more time for suggestion clicks
    setTimeout(() => {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
    }, 300);
  };

  const handleInputFocus = (type, value) => {
    if (value.length >= 2) {
      fetchPlaceSuggestions(value, type);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Search Rides</h1>
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative" ref={originInputRef}>
              <input
                type="text"
                placeholder="From"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  fetchPlaceSuggestions(e.target.value, 'origin');
                }}
                onFocus={() => handleInputFocus('origin', origin)}
                onBlur={() => handleInputBlur('origin')}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {suggestions.origin.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {suggestions.origin.map((suggestion, index) => (
                    
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-gray-700 cursor-pointer text-white transition-colors duration-200"
                      style={{ color: 'white' }}
                      onClick={() => {
                        setOrigin(suggestion.display_name);
                        setSuggestions(prev => ({ ...prev, origin: [] }));
                      }}
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={destinationInputRef}>
              <input
                type="text"
                placeholder="To"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  fetchPlaceSuggestions(e.target.value, 'destination');
                }}
                onFocus={() => handleInputFocus('destination', destination)}
                onBlur={() => handleInputBlur('destination')}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {suggestions.destination.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {suggestions.destination.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-gray-700 cursor-pointer text-white transition-colors duration-200"
                      style={{ color: 'white' }}
                      onClick={() => {
                        setDestination(suggestion.display_name);
                        setSuggestions(prev => ({ ...prev, destination: [] }));
                      }}
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Seats"
                value={seats}
                min="1"
                onChange={(e) => setSeats(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-search"></i>
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {sortedRides.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Search Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {sortedRides.map((ride) => (
                <div key={ride._id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 transform transition-all duration-300 hover:scale-102 hover:shadow-xl border border-gray-600/50 animate-fade-in group">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <i className="fas fa-user text-white"></i>
                    </div>
                    <div className="ml-3 md:ml-4 flex-grow">
                      <h3 className="font-semibold text-white flex items-center text-base md:text-lg">
                        <span className="truncate max-w-[80px] md:max-w-[100px]">{ride.origin}</span>
                        <i className="fas fa-arrow-right mx-2 text-green-400 flex-shrink-0"></i>
                        <span className="truncate max-w-[80px] md:max-w-[100px]">{ride.destination}</span>
                      </h3>
                      <p className="text-xs md:text-sm text-gray-400">
                        {ride.departure_time.toLocaleDateString()} at {ride.departure_time.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
                    <div className="flex items-center text-xs md:text-sm text-gray-300">
                      <i className="fas fa-map-marker-alt text-green-400 mr-2"></i>
                      <span className="truncate">{ride.route_details.pickup_point || ride.origin}</span>
                    </div>
                    <div className="flex items-center text-xs md:text-sm text-gray-300">
                      <i className="fas fa-map-marker-alt text-green-400 mr-2"></i>
                      <span className="truncate">{ride.route_details.drop_point || ride.destination}</span>
                    </div>
                    <div className="flex items-center text-xs md:text-sm text-gray-300">
                      <i className="fas fa-users text-green-400 mr-2"></i>
                      <span>{ride.available_seats - (ride.booked_seats || 0)} seats available</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm text-gray-400">Price per seat</span>
                      <span className="text-base md:text-lg font-bold text-green-400">${ride.price_per_seat}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRide(ride);
                        setBookingModalOpen(true);
                      }}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-1 md:space-x-2 transform hover:scale-105 text-xs md:text-sm"
                    >
                      <i className="fas fa-ticket-alt"></i>
                      <span>Book Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {latestRides.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Latest Available Rides</h2>
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-700 transform transition-all duration-300 hover:shadow-3xl relative overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestRides.slice(0, 6).map((ride, index) => (
                  <div key={ride._id} className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 transform transition-all duration-300 hover:scale-102 hover:shadow-xl border ${index === 0 ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-gray-600/50'} animate-fade-in group`}>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <i className="fas fa-user text-white"></i>
                      </div>
                      <div className="ml-4 flex-grow">
                        <h3 className="font-semibold text-white flex items-center text-lg">
                          <span className="truncate max-w-[100px]">{ride.origin}</span>
                          <i className="fas fa-arrow-right mx-2 text-blue-400 flex-shrink-0"></i>
                          <span className="truncate max-w-[100px]">{ride.destination}</span>
                        </h3>
                        <p className="text-sm text-gray-400">
                          {ride.departure_time.toLocaleDateString()} at {ride.departure_time.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center text-sm text-gray-300">
                        <i className="fas fa-map-marker-alt text-blue-400 mr-2"></i>
                        <span className="truncate">{ride.route_details.pickup_point || ride.origin}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <i className="fas fa-map-marker-alt text-green-400 mr-2"></i>
                        <span className="truncate">{ride.route_details.drop_point || ride.destination}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <i className="fas fa-users text-yellow-400 mr-2"></i>
                        <span>{ride.available_seats - (ride.booked_seats || 0)} seats available</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Price per seat</span>
                        <span className="text-lg font-bold text-green-400">${ride.price_per_seat}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRide(ride);
                          setBookingModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
                      >
                        <i className="fas fa-ticket-alt"></i>
                        <span>Book Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default MainComponent;