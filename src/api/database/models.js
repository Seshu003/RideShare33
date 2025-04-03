import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  driver_phone: { type: String, required: true, unique: true, match: /^\d{10}$/ },
  created_at: { type: Date, default: Date.now }
});

// Ride Schema
const rideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departure_time: { type: Date, required: true },
  available_seats: { type: Number, required: true, min: 1 },
  price_per_seat: { type: Number, required: true, min: 0 },
  vehicle_type: String,
  description: String,
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Ride = mongoose.models.Ride || mongoose.model('Ride', rideSchema);
export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);