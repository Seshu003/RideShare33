import { connectDB } from '../../../../api/config/mongodb/connection';
import { Ride } from '../../../../api/database/models/index';

export async function GET() {
  try {
    await connectDB();

    const rides = await Ride.find({ status: 'active' })
      .populate('driver')
      .sort({ departure_time: -1 })
      .limit(5)
      .lean();

    return Response.json({ success: true, rides });
  } catch (error) {
    console.error('Latest rides error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch latest rides' },
      { status: 500 }
    );
  }
}