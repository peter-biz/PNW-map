import { NextResponse } from "next/server";
import https from "https";

export async function GET() {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "";
    // Hammond, IN coordinates
    const lat = 41.583;
    const lng = -87.5;

    // Using Node.js https module instead of axios to avoid certain issues
    const url = `https://api.tomtom.com/traffic/services/4/incidentDetails?key=${API_KEY}&bbox=${
      lng - 0.1
    },${lat - 0.1},${lng + 0.1},${
      lat + 0.1
    }&fields={incidents{type,geometry,properties{iconCategory}}}`;

    const data = await new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = "";

          // A chunk of data has been received
          res.on("data", (chunk) => {
            data += chunk;
          });

          // The whole response has been received
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              // If we can't parse JSON, just return the raw data
              resolve({ incidents: [] });
            }
          });
        })
        .on("error", (err) => {
          console.error("HTTPS request error:", err);
          reject(err);
        });
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic data" },
      { status: 500 }
    );
  }
}
