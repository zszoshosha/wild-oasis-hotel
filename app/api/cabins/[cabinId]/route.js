import { getBookedDatesByCabinId, getCabin } from "@/app/_lib/data-service";

export async function GET(request, { params }) {
  const { cabinId } = params;

  const [cabin, bookedDates] = await Promise.all([
    getCabin(cabinId),
    getBookedDatesByCabinId(cabinId),
  ]);

  if (!cabin) {
    return Response.json({ message: "Cabin not found" }, { status: 404 });
  }

  return Response.json({ cabin, bookedDates });
}

// export async function POST() {}
