import { connectDB } from '../../config/mongodb/connection';
import { Ride } from '../../database/models';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    await connectDB();
    
    if (!request.body) {
      return Response.json(
        { success: false, error: 'No search criteria provided' },
        { status: 400 }
      );
    }
    const { origin, destination, searchDate, time, seats, priceRange, departureTime, vehicleType } = await request.json();

    const query = {
      status: 'active',
      available_seats: { $gte: seats || 1 }
    };

    if (origin) query.origin = new RegExp(origin, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');

    if (searchDate) {
      const startOfDay = new Date(searchDate);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.departure_time = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    if (priceRange) {
      query.price_per_seat = {
        $gte: priceRange[0] || 0,
        $lte: priceRange[1] || 1000
      };
    }

    if (vehicleType && vehicleType !== 'any') {
      query.vehicle_type = vehicleType;
    }

    if (departureTime && departureTime !== 'any') {
      const timeRanges = {
        morning: { $gte: 6, $lt: 12 },
        afternoon: { $gte: 12, $lt: 18 },
        evening: { $gte: 18, $lt: 24 }
      };
      if (timeRanges[departureTime]) {
        query.$expr = {
          $and: [
            { $gte: [{ $hour: '$departure_time' }, timeRanges[departureTime].$gte] },
            { $lt: [{ $hour: '$departure_time' }, timeRanges[departureTime].$lt] }
          ]
        };
      }
    }

    const rides = await Ride.find(query)
      .populate('driver', 'name driver_phone')
      .sort({ departure_time: 1 })
      .lean()
      .exec();

    if (!rides || rides.length === 0) {
      return Response.json({
        success: true,
        rides: [],
        message: 'No rides found matching your criteria'
      });
    }

    return Response.json({
      success: true,
      rides: rides.map(ride => ({
        ...ride,
        departure_time: ride.departure_time.toISOString(),
        price_per_seat: parseFloat(ride.price_per_seat),
        available_seats: parseInt(ride.available_seats)
      }))
    });
  } catch (error) {
    console.error('Search rides error:', error);
    return Response.json(
      { success: false, error: 'Failed to search rides' },
      { status: 500 }
    );
  }
}