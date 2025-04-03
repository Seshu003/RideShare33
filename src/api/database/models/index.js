import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  driver_phone: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const rideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departure_time: { type: Date, required: true },
  available_seats: { type: Number, required: true, min: 1 },
  price_per_seat: { type: Number, required: true, min: 0 },
  vehicle_type: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Ride = mongoose.models.Ride || mongoose.model('Ride', rideSchema);