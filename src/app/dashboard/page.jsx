"use client";
import React, { useState, useEffect } from "react";
import NavigationBar from "../../components/navigation-bar";

function MainComponent() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [userRides, setUserRides] = useState({ offered: [], booked: [] });
  const [stats, setStats] = useState({
    earnings: 0,
    seatsBooked: 0,
    totalRides: 0,
    commonRoutes: [],
    totalBookings: 0,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await fetch("/api/database-operations", {
          method: "POST",
          body: JSON.stringify({
            action: "listUserRides",
            data: { driver_phone: phoneNumber },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch rides");
        }

        const data = await response.json();

        // Split rides into offered and booked
        const offered = data.rides || [];

        const bookingsResponse = await fetch("/api/database-operations", {
          method: "POST",
          body: JSON.stringify({
            action: "listBookings",
            data: { phone: phoneNumber, type: "passenger" },
          }),
        });

        if (!bookingsResponse.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const bookingsData = await bookingsResponse.json();
        const booked = bookingsData.bookings || [];

        // Calculate stats
        const completedRides = offered.filter((r) => r.status === "completed");
        const totalEarnings = completedRides.reduce(
          (sum, ride) =>
            sum +
            ride.price_per_seat * (ride.available_seats - ride.seats_left),
          0
        );
        const totalSeatsBooked = completedRides.reduce(
          (sum, ride) => sum + (ride.available_seats - ride.seats_left),
          0
        );

        // Calculate common routes
        const routes = offered.reduce((acc, ride) => {
          const route = `${ride.origin} to ${ride.destination}`;
          acc[route] = (acc[route] || 0) + 1;
          return acc;
        }, {});

        const commonRoutes = Object.entries(routes)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([route]) => route);

        setUserRides({ offered, booked });
        setStats({
          earnings: totalEarnings,
          seatsBooked: totalSeatsBooked,
          totalRides: offered.length,
          commonRoutes,
          totalBookings: booked.length,
        });
      } catch (err) {
        setError("Could not load your rides");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (isVerified) {
      fetchRides();
    }
  }, [isVerified]);

  const handleStatusUpdate = async (rideId, status) => {
    try {
      const response = await fetch("/api/update-ride-status", {
        method: "POST",
        body: JSON.stringify({ rideId, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ride status");
      }

      fetchRides();
    } catch (err) {
      setError("Could not update ride status");
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const RideCard = ({ ride, type }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
          {ride.driver_profile_picture ? (
            <img
              src={ride.driver_profile_picture}
              alt={ride.driver_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>
        <div className="ml-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {ride.driver_name || "Anonymous"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(ride.departure_time)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="ml-2 text-gray-700 dark:text-gray-300">{ride.origin}</p>
        </div>
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="ml-2 text-gray-700 dark:text-gray-300">
            {ride.destination}
          </p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="ml-2 text-gray-700 dark:text-gray-300">
              {ride.available_seats - ride.booked_seats} seats left
            </p>
          </div>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            ${parseFloat(ride.price_per_seat).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {type === "offered" ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {ride.booked_seats}/{ride.available_seats} seats booked
              </span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                ${(ride.price_per_seat * ride.booked_seats).toFixed(2)} earned
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusUpdate(ride.id, "completed")}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark Complete
              </button>
              <button
                onClick={() => handleStatusUpdate(ride.id, "cancelled")}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Booking Status: <span className="font-semibold">{ride.status}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && isVerified) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Enter Your Phone Number
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsVerified(true);
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="1234567890"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar currentPage="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-700 dark:text-gray-300">
              Welcome back, {phoneNumber}
            </p>
          </div>
          <div className="flex space-x-4">
            <a
              href="/create-ride"
              className="mt-4 md:mt-0 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-inter"
            >
              Create New Ride
            </a>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            {["upcoming", "history", "profile", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 text-sm font-inter ${
                  activeTab === tab
                    ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Earnings
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${stats.earnings.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Seats Filled
            </h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.seatsBooked}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Rides
            </h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalRides}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Bookings
            </h3>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalBookings}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {activeTab === "upcoming" && (
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Rides You're Offering
              </h2>
              {userRides.offered.filter((r) => r.status === "active").length >
              0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {userRides.offered
                    .filter((r) => r.status === "active")
                    .map((ride) => (
                      <RideCard key={ride.id} ride={ride} type="offered" />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    No rides being offered
                  </p>
                  <a
                    href="/create-ride"
                    className="mt-4 px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors font-inter inline-block"
                  >
                    Offer a Ride
                  </a>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Rides You've Booked
              </h2>
              {userRides.booked.filter((r) => r.status === "active").length >
              0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {userRides.booked
                    .filter((r) => r.status === "active")
                    .map((ride) => (
                      <RideCard key={ride.id} ride={ride} type="booked" />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    No upcoming bookings
                  </p>
                  <a
                    href="/search"
                    className="mt-4 px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors font-inter inline-block"
                  >
                    Find a Ride
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Past Rides Offered
              </h2>
              {userRides.offered.filter((r) => r.status !== "active").length >
              0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {userRides.offered
                    .filter((r) => r.status !== "active")
                    .map((ride) => (
                      <RideCard key={ride.id} ride={ride} type="offered" />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    No past rides
                  </p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Past Rides Booked
              </h2>
              {userRides.booked.filter((r) => r.status !== "active").length >
              0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {userRides.booked
                    .filter((r) => r.status !== "active")
                    .map((ride) => (
                      <RideCard key={ride.id} ride={ride} type="booked" />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    No past bookings
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Analytics Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Most Common Routes
                  </h3>
                  {stats.commonRoutes.length > 0 ? (
                    <ul className="space-y-2">
                      {stats.commonRoutes.map((route, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-700 dark:text-gray-300"
                        >
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-2">
                            {index + 1}
                          </span>
                          {route}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No routes yet
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Completion Rate
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {userRides.offered.length
                          ? `${Math.round(
                              (userRides.offered.filter(
                                (r) => r.status === "completed"
                              ).length /
                                userRides.offered.length) *
                                100
                            )}%`
                          : "0%"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Average Rating
                      </p>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-yellow-500">
                          4.8
                        </span>
                        <div className="ml-2 flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className="w-5 h-5 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-inter text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </h3>
                  <p className="text-gray-900 dark:text-white">{phoneNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-inter text-gray-700 dark:text-gray-300 mb-1">
                    Member Since
                  </h3>
                  <p className="text-gray-900 dark:text-white">January 2025</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;