"use client";
import React from "react";
import NavigationBar from "../../components/navigation-bar";

function MainComponent() {
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departure_time: "",
    available_seats: 1,
    price_per_seat: "",
    vehicle_type: "",
    description: "",
  });
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
  const validateForm = () => {
    const newErrors = {};
    const now = new Date();
    const selectedDate = new Date(formData.departure_time);

    if (!formData.origin) newErrors.origin = "Origin is required";
    if (!formData.destination)
      newErrors.destination = "Destination is required";
    if (!formData.departure_time)
      newErrors.departure_time = "Departure time is required";
    if (selectedDate <= now)
      newErrors.departure_time = "Departure time must be in the future";
    if (!formData.available_seats)
      newErrors.available_seats = "Number of seats is required";
    if (formData.available_seats < 1)
      newErrors.available_seats = "Minimum 1 seat required";
    if (!formData.price_per_seat)
      newErrors.price_per_seat = "Price per seat is required";
    if (formData.price_per_seat <= 0)
      newErrors.price_per_seat = "Price must be greater than 0";
    if (formData.price_per_seat > 1000)
      newErrors.price_per_seat = "Price seems unreasonably high";
    if (!formData.vehicle_type)
      newErrors.vehicle_type = "Vehicle type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/create-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          driver_id: "12345",
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        setErrors({ submit: data.error });
      } else {
        setSuccess(true);
        setFormData({
          origin: "",
          destination: "",
          departure_time: "",
          available_seats: 1,
          price_per_seat: "",
          vehicle_type: "",
          description: "",
        });
      }
    } catch (error) {
      console.error("Error creating ride:", error);
      setErrors({ submit: "Failed to create ride. Please try again." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar currentPage="/post-ride" />
      <div className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 font-inter">
            Post a Ride
          </h1>

          {success ? (
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-md mb-6">
              <p className="text-green-800 dark:text-green-200 font-inter">
                Your ride has been posted successfully! Redirecting to
                dashboard...
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">
                    Origin
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => {
                        setFormData({ ...formData, origin: e.target.value });
                        fetchPlaceSuggestions(e.target.value, "origin");
                      }}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
                      placeholder="Enter pickup location"
                    />
                    {originSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md mt-1">
                        {originSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.place_id}
                            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                origin: suggestion.description,
                              });
                              setOriginSuggestions([]);
                            }}
                          >
                            {suggestion.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.origin && (
                    <p className="text-red-600 text-sm mt-1">{errors.origin}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">
                    Destination
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          destination: e.target.value,
                        });
                        fetchPlaceSuggestions(e.target.value, "destination");
                      }}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
                      placeholder="Enter drop-off location"
                    />
                    {destinationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md mt-1">
                        {destinationSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.place_id}
                            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                destination: suggestion.description,
                              });
                              setDestinationSuggestions([]);
                            }}
                          >
                            {suggestion.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.destination && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.destination}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">
                    Departure Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.departure_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure_time: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
                  />
                  {errors.departure_time && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.departure_time}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">
                      Available Seats
                    </label>
                    <input
                      type="number"
                      value={formData.available_seats}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          available_seats: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
                    />
                    {errors.available_seats && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.available_seats}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">
                      Price per Seat ($)
                    </label>
                    <input
                      type="number"
                      value={formData.price_per_seat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_per_seat: parseFloat(e.target.value),
                        })
                      }
                      min="0"
                      step="0.01"
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
                    />
                    {errors.price_per_seat && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.price_per_seat}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicle_type: e.target.value })
                    }
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Select vehicle type</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                  </select>
                  {errors.vehicle_type && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.vehicle_type}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
                    rows="3"
                    placeholder="Add any additional details about the ride"
                  />
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
                  <p className="text-red-800 dark:text-red-200">
                    {errors.submit}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-3 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-inter disabled:opacity-50"
                >
                  {loading ? "Posting..." : "Post Ride"}
                </button>
              </div>
            </form>
          )}

          {formData.origin && formData.destination && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-inter">
                Ride Preview
              </h2>
              <div className="space-y-2">
                <p className="text-gray-700 dark:text-gray-300 font-inter">
                  <span className="font-semibold">From:</span> {formData.origin}
                </p>
                <p className="text-gray-700 dark:text-gray-300 font-inter">
                  <span className="font-semibold">To:</span>{" "}
                  {formData.destination}
                </p>
                {formData.departure_time && (
                  <p className="text-gray-700 dark:text-gray-300 font-inter">
                    <span className="font-semibold">Departure:</span>{" "}
                    {new Date(formData.departure_time).toLocaleString()}
                  </p>
                )}
                <p className="text-gray-700 dark:text-gray-300 font-inter">
                  <span className="font-semibold">Price:</span> $
                  {formData.price_per_seat} per seat
                </p>
                <p className="text-gray-700 dark:text-gray-300 font-inter">
                  <span className="font-semibold">Available Seats:</span>{" "}
                  {formData.available_seats}
                </p>
                {formData.vehicle_type && (
                  <p className="text-gray-700 dark:text-gray-300 font-inter">
                    <span className="font-semibold">Vehicle:</span>{" "}
                    {formData.vehicle_type}
                  </p>
                )}
                {formData.description && (
                  <p className="text-gray-700 dark:text-gray-300 font-inter">
                    <span className="font-semibold">Description:</span>{" "}
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;