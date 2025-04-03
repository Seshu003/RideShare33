import { connectDB } from '../../config/mongodb/connection';
import { Ride } from '../../database/models';

export async function GET() {
  try {
    await connectDB();
    const latestRides = await Ride.find({ status: 'active' })
      .populate('driver')
      .sort({ created_at: -1 })
      .limit(6)
      .lean();      

    return Response.json({ success: true, rides: latestRides });
  } catch (error) {
    console.error('Error fetching latest rides:', error);
    return Response.json({ success: false, error: 'Failed to fetch latest rides' }, { status: 500 });
  }
}