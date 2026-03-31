import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

interface GeocodingResult {
  formattedAddress: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  // If no Google Maps API key, use coordinates directly (demo mode)
  if (!env.GOOGLE_MAPS_API_KEY) {
    return { formattedAddress: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` };
  }

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 5000,
      }
    );

    const results = response.data.results;
    if (results && results.length > 0) {
      return { formattedAddress: results[0].formatted_address };
    }

    return { formattedAddress: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` };
  } catch (err) {
    logger.warn({ err, latitude, longitude }, "Geocoding failed, using coordinates");
    return { formattedAddress: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` };
  }
}
