async function handler(req) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return { success: false, error: "No data provided" };
    }

    const data = req.body;

    const requiredFields = [
      "driver_phone",
      "driver_name",
      "origin",
      "destination",
      "departure_time",
      "available_seats",
      "price_per_seat",
      "vehicle_number",
    ];

    const missingFields = requiredFields.filter(
      (field) => !data[field] && data[field] !== 0
    );
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    const phone = data.driver_phone.replace(/\D/g, "");
    if (phone.length !== 10) {
      return {
        success: false,
        error: "Phone number must be exactly 10 digits",
      };
    }

    const departureTime = new Date(data.departure_time);
    const now = new Date();
    if (isNaN(departureTime)) {
      return {
        success: false,
        error: "Invalid departure time format",
      };
    }

    if (departureTime <= now) {
      return {
        success: false,
        error: "Departure time must be in the future",
      };
    }

    const seats = parseInt(data.available_seats);
    if (isNaN(seats) || seats < 1 || seats > 8) {
      return {
        success: false,
        error: "Available seats must be between 1 and 8",
      };
    }

    const price = parseFloat(data.price_per_seat);
    if (isNaN(price) || price <= 0) {
      return {
        success: false,
        error: "Price per seat must be a positive number",
      };
    }

    const existingRideQuery =
      "SELECT id FROM rides WHERE driver_id IN (SELECT id FROM users WHERE driver_phone = $1) AND departure_time = $2 AND status = $3";
    const [existingRide] = await sql(existingRideQuery, [
      phone,
      departureTime,
      "active",
    ]);

    if (existingRide) {
      return {
        success: false,
        error: "You already have an active ride scheduled for this time",
      };
    }

    const results = await sql.transaction((txn) => [
      txn("SELECT id, name, driver_phone FROM users WHERE driver_phone = $1", [
        phone,
      ]),

      txn(
        "INSERT INTO users (name, driver_phone) VALUES ($1, $2) ON CONFLICT (driver_phone) DO UPDATE SET name = EXCLUDED.name RETURNING id, name, driver_phone",
        [data.driver_name, phone]
      ),

      txn(
        `INSERT INTO rides 
          (driver_id, origin, destination, departure_time, available_seats, 
           price_per_seat, description, status, vehicle_number) 
          SELECT u.id, $1, $2, $3, $4, $5, $6, $7, $8 
          FROM users u 
          WHERE u.driver_phone = $9 
          RETURNING *`,
        [
          data.origin.trim(),
          data.destination.trim(),
          departureTime,
          seats,
          price,
          (data.notes || "").trim(),
          "active",
          data.vehicle_number.trim(),
          phone,
        ]
      ),
    ]);

    const [existingUser, updatedUser, newRide] = results;

    if (!newRide[0]) {
      throw new Error("Failed to create ride");
    }

    const driver = existingUser[0] || updatedUser[0];

    if (!driver) {
      throw new Error("Failed to create or find driver");
    }

    return {
      success: true,
      data: {
        ride: {
          ...newRide[0],
          departure_time: newRide[0].departure_time.toISOString(),
        },
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.driver_phone,
        },
      },
    };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A ride with these exact details already exists",
      };
    }

    return {
      success: false,
      error: "Failed to create ride. Please try again.",
    };
  }
}