"use client";
import React, { useState } from "react";
import NavigationBar from "../../components/navigation-bar";

function MainComponent() {
  const [formData, setFormData] = useState({
    driver_phone: "",
    driver_name: "",
    origin: "",
    destination: "",
    departure_time: "",
    available_seats: 1,
    price_per_seat: "",
    vehicle_number: "",
    notes: "",
  });
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isTestData, setIsTestData] = useState(false);

  const fillTestData = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    setFormData({
      driver_phone: "9876543210",
      driver_name: "Test Driver",
      origin: "Mumbai Central, Mumbai",
      destination: "Pune Station, Pune",
      departure_time: tomorrow.toISOString().slice(0, 16),
      available_seats: 3,
      price_per_seat: 500,
      vehicle_number: "MH01AB1234",
      notes: "AC Car, comfortable seating",
    });
    setIsTestData(true);
  };

  const validateForm = () => {
    const errors = [];

    if (
      !formData.driver_phone?.trim() ||
      !formData.driver_phone.match(/^\d{10}$/)
    ) {
      errors.push("Valid 10-digit phone number is required");
    }

    if (!formData.driver_name?.trim()) {
      errors.push("Driver name is required");
    } else if (formData.driver_name.trim().length < 2) {
      errors.push("Driver name must be at least 2 characters");
    }

    if (!formData.origin?.trim()) {
      errors.push("Origin location is required");
    }

    if (!formData.destination?.trim()) {
      errors.push("Destination location is required");
    }

    if (!formData.departure_time) {
      errors.push("Departure time is required");
    } else {
      const departureDate = new Date(formData.departure_time);
      const now = new Date();
      if (departureDate <= now) {
        errors.push("Departure time must be in the future");
      }
    }

    if (!formData.vehicle_number?.trim()) {
      errors.push("Vehicle number is required");
    }

    const seats = parseInt(formData.available_seats);
    if (isNaN(seats) || seats < 1 || seats > 8) {
      errors.push("Available seats must be between 1 and 8");
    }

    const price = parseFloat(formData.price_per_seat);
    if (isNaN(price) || price < 0) {
      errors.push("Price per seat must be a positive number");
    }

    return errors;
  };

  const fetchPlaceSuggestions = async (input, setter) => {
    if (!input) {
      setter([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/places/locationiq?input=${encodeURIComponent(input)}&include_manual=true`
      );
      const data = await response.json();
      const suggestions = data.predictions || [];
      
      // Add the manual input as a suggestion if it doesn't match any predictions
      if (input.trim() && !suggestions.some(s => s.description.toLowerCase() === input.toLowerCase())) {
        suggestions.push({
          place_id: 'manual_' + Date.now(),
          description: input,
          display_name: 'Custom location',
          manual_entry: true
        });
      }
      
      setter(suggestions);
    } catch (err) {
      console.error("Error fetching places:", err);
      // Still allow manual input even if API fails
      if (input.trim()) {
        setter([{
          place_id: 'manual_' + Date.now(),
          description: input,
          display_name: 'Custom location',
          manual_entry: true
        }]);
      } else {
        setter([]);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      driver_phone: "",
      driver_name: "",
      origin: "",
      destination: "",
      departure_time: "",
      available_seats: 1,
      price_per_seat: "",
      vehicle_number: "",
      notes: "",
    });
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setSuccess(false);
    setError(null);
    setIsTestData(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join("\n"));
      }

      const requestBody = {
        driver_phone: formData.driver_phone.trim(),
        driver_name: formData.driver_name.trim(),
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        departure_time: new Date(formData.departure_time).toISOString(),
        available_seats: parseInt(formData.available_seats),
        price_per_seat: parseFloat(formData.price_per_seat),
        vehicle_number: formData.vehicle_number.trim(),
        notes: formData.notes.trim(),
      };

      const response = await fetch("/api/create-ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create ride");
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error creating ride:", err);
      setError(err.message || "An unexpected error occurred");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputBlur = (type) => {
    // Use setTimeout to allow click events on suggestions to fire first
    setTimeout(() => {
      if (type === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
    }, 200);
  };

  return (
    <>
      <NavigationBar currentPage="/create-ride" />
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Offer a Ride
          </h1>

          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={fillTestData}
              className="group relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-vial mr-2 text-purple-500"></i>
              <span className="text-gray-700 dark:text-gray-300">
                Fill Test Data
              </span>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Fill form with sample data
              </span>
            </button>
            {isTestData && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <i className="fas fa-flask mr-1"></i>
                Test Data
              </span>
            )}
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <div className="flex items-center mb-4">
                <i className="fas fa-check-circle mr-2 text-xl"></i>
                <h2 className="text-lg font-semibold">
                  Ride Created Successfully!
                </h2>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">From</p>
                    <p className="font-medium">{formData.origin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">To</p>
                    <p className="font-medium">{formData.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {new Date(formData.departure_time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available Seats</p>
                    <p className="font-medium">{formData.available_seats}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price per Seat</p>
                    <p className="font-medium">
                      ₹{parseFloat(formData.price_per_seat).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Number</p>
                    <p className="font-medium">{formData.vehicle_number}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Driver Details</p>
                    <p className="font-medium">
                      {formData.driver_name} ({formData.driver_phone})
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <button
                    onClick={resetForm}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <i className="fas fa-plus mr-2"></i>Create Another Ride
                  </button>
                  <a
                    href="/dashboard"
                    className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800"
                  >
                    <i className="fas fa-tachometer-alt mr-2"></i>Go to
                    Dashboard
                  </a>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-center mb-2">
                <i className="fas fa-exclamation-circle mr-2"></i>
                <strong>Please fix the following errors:</strong>
              </div>
              <ul className="list-disc ml-6">
                {error.split("\n").map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.driver_phone}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 10);
                  setFormData((prev) => ({ ...prev, driver_phone: value }));
                }}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                placeholder="Enter 10-digit phone number"
                pattern="[0-9]{10}"
                required
              />
              <p className="text-sm text-gray-500">
                Enter 10-digit number without spaces or special characters
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Driver Name
              </label>
              <input
                type="text"
                value={formData.driver_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    driver_name: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                placeholder="Enter driver's name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Origin
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      origin: e.target.value,
                    }));
                    fetchPlaceSuggestions(e.target.value, setOriginSuggestions);
                  }}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  placeholder="Enter pickup location"
                  required
                />
                {originSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    {originSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            origin: suggestion.description,
                          }));
                          setOriginSuggestions([]);
                        }}
                      >
                        <div className="font-medium">{suggestion.description}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{suggestion.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Destination
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      destination: e.target.value,
                    }));
                    fetchPlaceSuggestions(
                      e.target.value,
                      setDestinationSuggestions
                    );
                  }}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  placeholder="Enter destination"
                  required
                />
                {destinationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    {destinationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            destination: suggestion.description,
                          }));
                          setDestinationSuggestions([]);
                        }}
                      >
                        <div className="font-medium">{suggestion.description}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{suggestion.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Departure Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.departure_time}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    departure_time: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Vehicle Number
              </label>
              <input
                type="text"
                value={formData.vehicle_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vehicle_number: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                placeholder="Enter vehicle number"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Available Seats
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.available_seats}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      available_seats: parseInt(e.target.value, 10) || "",
                    }))
                  }
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Price per Seat (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_per_seat}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price_per_seat: parseFloat(e.target.value) || "",
                    }))
                  }
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  placeholder="Enter amount in ₹"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: String(e.target.value),
                  }))
                }
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 min-h-[100px]"
                placeholder="Add any additional information about the ride..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-6 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              {loading ? "Creating Ride..." : "Create Ride"}
            </button>

            {Object.keys(formData).length > 0 && !success && (
              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Review Your Ride Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.origin || "(Not set)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.destination || "(Not set)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Date & Time
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.departure_time
                        ? new Date(formData.departure_time).toLocaleString()
                        : "(Not set)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Price per Seat
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.price_per_seat
                        ? `₹${formData.price_per_seat}`
                        : "(Not set)"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

export default MainComponent;