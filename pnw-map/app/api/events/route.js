import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://mypnwlife.pnw.edu/ical/pnw/ical_pnw.ics"
    );
    const data = await response.text();

    return new NextResponse(data, {
      headers: {
        "Content-Type": "text/calendar",
      },
    });
  } catch (error) {
    console.error("Error fetching ICS feed:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch events" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
