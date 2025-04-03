const { User, Ride, Booking, connectDB } = require('../config/mongodb/connection');

async function handler(req) {
  await connectDB();
  const { action, data } = req.body;

  switch (action) {
    case "createUser":
      return await createUser(data.driver_phone, data.name);
    case "getUserByPhone":
      return await getUserByPhone(data.driver_phone);
    case "updateUserProfile":
      return await updateUserProfile(data.driver_phone, data);
    case "listUserRides":
      return await listUserRides(data.driver_phone);
    case "createRide":
      return await createRide(data);
    case "getRideById":
      return await getRideById(data.id);
    case "updateRide":
      return await updateRide(data.id, data);
    case "listRides":
      return await listRides(data);
    case "searchRides":
      return await searchRides(data.origin, data.destination, data.date);
    case "createBooking":
      return await createBooking(data.rideId, data.passengerPhone);
    case "getBookingById":
      return await getBookingById(data.id);
    case "updateBookingStatus":
      return await updateBookingStatus(data.id, data.status);
    case "listBookings":
      return await listBookings(data.phone, data.type);
    default:
      return { error: "Invalid action" };
  }
}

async function createUser(driver_phone, name) {
  if (!driver_phone?.match(/^\d{10}$/)) {
    return { error: "Invalid phone number format" };
  }

  try {
    const user = await User.findOneAndUpdate(
      { driver_phone },
      { name },
      { upsert: true, new: true }
    );
    return { success: true, user };
  } catch (error) {
    return { error: "Failed to create/update user" };
  }
}

async function getUserByPhone(driver_phone) {
  try {
    const user = await User.findOne({ driver_phone });
    return { success: true, user };
  } catch (error) {
    return { error: "Failed to fetch user" };
  }
}

async function updateUserProfile(driver_phone, data) {
  try {
    const user = await User.findOneAndUpdate(
      { driver_phone },
      { $set: data },
      { new: true }
    );
    return { success: true, user };
  } catch (error) {
    return { error: "Failed to update user profile" };
  }
}

async function listUserRides(driver_phone) {
  try {
    const user = await User.findOne({ driver_phone });
    if (!user) {
      return { error: "User not found" };
    }
    const rides = await Ride.find({ driver: user._id })
      .sort({ departure_time: -1 });
    return { success: true, rides };
  } catch (error) {
    return { error: "Failed to fetch user rides" };
  }
}

async function createRide(data) {
  try {
    const user = await User.findOne({ driver_phone: data.driver_phone });
    if (!user) {
      return { error: "Driver not found" };
    }
    const ride = await Ride.create({
      ...data,
      driver: user._id
    });
    return { success: true, ride };
  } catch (error) {
    return { error: "Failed to create ride" };
  }
}

async function getRideById(id) {
  try {
    const ride = await Ride.findById(id).populate('driver');
    return { success: true, ride };
  } catch (error) {
    return { error: "Failed to fetch ride" };
  }
}

async function updateRide(id, data) {
  try {
    const ride = await Ride.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).populate('driver');
    return { success: true, ride };
  } catch (error) {
    return { error: "Failed to update ride" };
  }
}

async function listRides(data) {
  try {
    const rides = await Ride.find({
      status: 'active',
      departure_time: { $gt: new Date() }
    })
    .sort({ departure_time: 1 })
    .populate('driver');
    return { success: true, rides };
  } catch (error) {
    return { error: "Failed to list rides" };
  }
}

async function searchRides(origin, destination, date) {
  try {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const rides = await Ride.find({
      status: 'active',
      origin: { $regex: origin, $options: 'i' },
      destination: { $regex: destination, $options: 'i' },
      departure_time: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
    .sort({ departure_time: 1 })
    .populate('driver');
    return { success: true, rides };
  } catch (error) {
    return { error: "Failed to search rides" };
  }
}

async function createBooking(rideId, passengerPhone) {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return { error: "Ride not found" };
    }

    const passenger = await User.findOne({ driver_phone: passengerPhone });
    if (!passenger) {
      return { error: "Passenger not found" };
    }

    if (ride.available_seats < 1) {
      return { error: "No seats available" };
    }

    const booking = await Booking.create({
      ride: rideId,
      passenger: passenger._id
    });

    await Ride.findByIdAndUpdate(rideId, {
      $inc: { available_seats: -1 }
    });

    return { success: true, booking };
  } catch (error) {
    return { error: "Failed to create booking" };
  }
}

async function getBookingById(id) {
  try {
    const booking = await Booking.findById(id)
      .populate('ride')
      .populate('passenger');
    return { success: true, booking };
  } catch (error) {
    return { error: "Failed to fetch booking" };
  }
}

async function updateBookingStatus(id, status) {
  try {
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
    .populate('ride')
    .populate('passenger');

    if (status === 'cancelled') {
      await Ride.findByIdAndUpdate(booking.ride._id, {
        $inc: { available_seats: 1 }
      });
    }

    return { success: true, booking };
  } catch (error) {
    return { error: "Failed to update booking status" };
  }
}

async function listBookings(phone, type) {
  try {
    const user = await User.findOne({ driver_phone: phone });
    if (!user) {
      return { error: "User not found" };
    }

    let query = {};
    if (type === 'passenger') {
      query.passenger = user._id;
    } else {
      const rides = await Ride.find({ driver: user._id });
      query.ride = { $in: rides.map(r => r._id) };
    }

    const bookings = await Booking.find(query)
      .populate('ride')
      .populate('passenger')
      .sort({ created_at: -1 });

    return { success: true, bookings };
  } catch (error) {
    return { error: "Failed to list bookings" };
  }
}

module.exports = handler;