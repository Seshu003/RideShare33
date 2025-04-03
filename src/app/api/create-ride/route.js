import { NextResponse } from 'next/server';
import { connectDB } from '../../../api/config/mongodb/connection';
import { User, Ride } from '../../../api/database/models/index';

export async function POST(request) {
  try {
    if (request.headers.get('content-type') !== 'application/json') {
      return NextResponse.json(
        { success: false, message: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    await connectDB();
    const data = await request.json();

    // Validate required fields
    const requiredFields = ['driver_phone', 'driver_name', 'origin', 'destination', 'departure_time', 'available_seats', 'price_per_seat', 'vehicle_number'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Find or create user based on driver_phone
    let user = await User.findOne({ driver_phone: data.driver_phone });
    if (!user) {
      user = new User({
        name: data.driver_name,
        driver_phone: data.driver_phone
      });
      await user.save();
    }

    // Create a new ride document
    const ride = new Ride({
      driver: user._id,
      origin: data.origin,
      destination: data.destination,
      departure_time: data.departure_time,
      available_seats: parseInt(data.available_seats),
      price_per_seat: parseFloat(data.price_per_seat),
      vehicle_type: data.vehicle_number,
      description: data.notes || '',
      status: 'active'
    });

    // Save the ride to MongoDB
    await ride.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Ride created successfully',
      ride: ride
    });

  } catch (error) {
    console.error('Error creating ride:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create ride', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}