async function handler({ ride_id, passenger_name, passenger_phone }) {
  // Input validation
  if (!ride_id || !passenger_name || !passenger_phone) {
    return { error: "Ride ID, passenger name and phone are required" };
  }

  if (!/^\+?[\d]{10,12}$/.test(passenger_phone)) {
    return {
      error:
        "Invalid phone number format. Must be 10-12 digits with optional + prefix",
    };
  }

  try {
    const results = await sql.transaction((txn) => [
      // Get ride details with FOR UPDATE lock to prevent concurrent modifications
      txn(
        "SELECT r.*, u.driver_phone as driver_phone, (SELECT COUNT(*) FROM bookings WHERE ride_id = $1 AND status = $2) as booked_seats FROM rides r JOIN users u ON r.driver_id = u.id WHERE r.id = $1 AND r.status = $2 FOR UPDATE",
        [ride_id, "active"]
      ),

      // Check for existing booking
      txn(
        "SELECT id, status FROM bookings b JOIN users u ON b.passenger_id = u.id WHERE b.ride_id = $1 AND u.driver_phone = $2 AND b.status != $3",
        [ride_id, passenger_phone, "cancelled"]
      ),

      // Get or create passenger
      txn(
        "INSERT INTO users (name, driver_phone) VALUES ($1, $2) ON CONFLICT (driver_phone) DO UPDATE SET name = $1 RETURNING id, name, driver_phone",
        [passenger_name, passenger_phone]
      ),

      // Create booking
      txn(
        "INSERT INTO bookings (ride_id, passenger_id, status) SELECT $1, (SELECT id FROM users WHERE driver_phone = $2), $3 RETURNING id, ride_id, passenger_id, status, created_at",
        [ride_id, passenger_phone, "pending"]
      ),

      // Update available seats with validation
      txn(
        "UPDATE rides SET available_seats = available_seats - 1 WHERE id = $1 AND available_seats > 0 AND status = $2 RETURNING id, available_seats, price_per_seat, departure_time",
        [ride_id, "active"]
      ),
    ]);

    const [
      rideResults,
      existingBookingResults,
      passengerResults,
      bookingResults,
      updatedRideResults,
    ] = results;
    const ride = rideResults[0];
    const existingBooking = existingBookingResults[0];
    const passenger = passengerResults[0];
    const booking = bookingResults[0];
    const updatedRide = updatedRideResults[0];

    // Validation checks
    if (!ride) {
      return { error: "Ride not found or not active" };
    }

    if (ride.driver_phone === passenger_phone) {
      return { error: "Driver cannot book their own ride" };
    }

    if (existingBooking) {
      return { error: "You already have a booking for this ride" };
    }

    if (ride.booked_seats >= ride.available_seats) {
      return { error: "No seats available" };
    }

    if (!updatedRide) {
      return { error: "Failed to update ride seats" };
    }

    if (!booking) {
      return { error: "Failed to create booking" };
    }

    return {
      success: true,
      data: {
        booking: {
          ...booking,
          created_at: booking.created_at.toISOString(),
        },
        ride: {
          id: updatedRide.id,
          available_seats: updatedRide.available_seats,
          price_per_seat: parseFloat(updatedRide.price_per_seat),
          departure_time: updatedRide.departure_time.toISOString(),
        },
        passenger: {
          id: passenger.id,
          name: passenger.name,
          phone: passenger.driver_phone,
        },
      },
    };
  } catch (error) {
    const errorMessage = error.message || "Failed to process booking";
    if (error.code === "23503") {
      return { error: "Invalid ride or passenger reference" };
    }
    if (error.code === "23505") {
      return { error: "Duplicate booking detected" };
    }
    return { success: false, error: errorMessage };
  }
}