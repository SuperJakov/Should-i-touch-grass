"use server";

import { z } from "zod";

// Zod Schema for validating the OpenWeatherMap Weather API response
const WeatherDataSchema = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  weather: z.array(
    z.object({
      main: z.string(),
    }),
  ),
  main: z.object({
    temp: z.number(),
  }),
  name: z.string(),
  sys: z.object({
    country: z.string(),
  }),
});

// Zod Schema for validating the OpenWeatherMap Air Pollution API response
const AqiDataSchema = z.object({
  list: z.array(
    z.object({
      main: z.object({
        aqi: z.number().min(1).max(5),
      }),
    }),
  ),
});

// Infer types from Zod schemas for internal use, ensuring type safety
type WeatherData = z.infer<typeof WeatherDataSchema>;
type AqiData = z.infer<typeof AqiDataSchema>;

// Define the structure for the data returned by the server action
export interface VerdictResponse {
  verdict: "Yes" | "No";
  message: string;
  city: string;
  country: string;
  countryFlag: string;
  weather: string;
  aqi: string;
  temp: string;
}

// Helper function to map AQI index to a readable string
const getAqiString = (aqi: number): string => {
  switch (aqi) {
    case 1:
      return "Good";
    case 2:
      return "Fair";
    case 3:
      return "Moderate";
    case 4:
      return "Poor";
    case 5:
      return "Very Poor";
    default:
      return "Unknown";
  }
};

/**
 * Maps country codes to their corresponding flag emojis.
 * Uses regional indicator symbols: 🇦🇧🇨...🇿
 */
const getCountryFlag = (countryCode: string): string => {
  if (countryCode.length !== 2) return "🏳️"; // Default

  const upperCaseCode = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upperCaseCode)) return "🏳️"; // Default

  const offset = 127397; // Unicode offset for regional indicators
  const codePoints = Array.from(upperCaseCode).map(
    (c) => c.charCodeAt(0) + offset,
  );
  return String.fromCodePoint(...codePoints);
};

/**
 * Core decision logic to determine the verdict based on weather and AQI data.
 * This function is shared by both server actions to avoid code duplication.
 * It uses weather conditions, ambient temperature, and air quality index data to determine the verdict.
 * @param weatherData Validated weather data.
 * @param aqiData Validated air quality data.
 * @returns {VerdictResponse} The final verdict and associated data.
 */
function determineVerdict(
  weatherData: WeatherData,
  aqiData: AqiData,
): VerdictResponse {
  const weatherCondition = weatherData.weather[0]?.main ?? "Unknown";
  const temperature = weatherData.main.temp;
  const aqiIndex = aqiData.list[0]?.main.aqi;
  const aqiString = aqiIndex ? getAqiString(aqiIndex) : "Unknown";
  const countryCode = weatherData.sys.country;
  const countryFlag = getCountryFlag(countryCode);

  let shouldTouchGrass = true;
  let message = "The conditions are great. Go enjoy the outdoors!";

  const badWeatherConditions = [
    "Rain",
    "Snow",
    "Thunderstorm",
    "Drizzle",
    "Mist",
    "Smoke",
    "Haze",
    "Fog",
  ]; // The order of these checks is important, as each can overwrite the previous message.
  // We check for conditions that most strongly suggest staying indoors last.

  if (badWeatherConditions.includes(weatherCondition)) {
    shouldTouchGrass = false;
    message = `It's currently ${weatherCondition.toLowerCase()}, not ideal for going out.`;
  }

  if (aqiIndex && aqiIndex > 2) {
    // "Moderate", "Poor", or "Very Poor"
    shouldTouchGrass = false;
    message = `The air quality is ${aqiString.toLowerCase()}, best to stay inside.`;
  }

  if (temperature < 0) {
    shouldTouchGrass = false;
    message = "It's freezing outside! Better to stay warm.";
  } else if (temperature > 35) {
    shouldTouchGrass = false;
    message = "It's too hot outside right now. Stay cool indoors!";
  }

  return {
    verdict: shouldTouchGrass ? "Yes" : "No",
    message,
    city: weatherData.name,
    country: countryCode,
    countryFlag: countryFlag,
    weather: weatherCondition,
    aqi: aqiString,
    temp: `${Math.round(temperature)}°C`,
  };
}

/**
 * A Next.js Server Action to get the "Should I Touch Grass?" verdict for a given city.
 * It fetches and validates weather and air quality data from OpenWeatherMap.
 * @param cityName The name of the city to check.
 * @returns {Promise<VerdictResponse>} An object containing the full verdict and data.
 */
export async function getVerdictForCityAction(
  cityName: string,
): Promise<VerdictResponse> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.error("OpenWeatherMap API key is not set.");
    throw new Error("Server configuration error.");
  }

  try {
    // 1. Fetch and validate weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`,
    );

    if (!weatherResponse.ok) {
      if (weatherResponse.status === 404) {
        throw new Error(
          `Could not find city: ${cityName}. Please check the spelling.`,
        );
      }
      console.log(weatherResponse);
      throw new Error("Failed to fetch weather data.");
    }

    const weatherJson = (await weatherResponse.json()) as unknown;
    const validatedWeatherData = WeatherDataSchema.safeParse(weatherJson);

    if (!validatedWeatherData.success) {
      console.error(
        "Zod validation failed for weather data:",
        validatedWeatherData.error.flatten(),
      );
      throw new Error("Received malformed weather data from API.");
    }
    const weatherData = validatedWeatherData.data;
    const { lat, lon } = weatherData.coord; // 2. Fetch and validate air quality data

    const aqiResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
    );

    if (!aqiResponse.ok) {
      throw new Error("Failed to fetch air quality data.");
    }

    const aqiJson = (await aqiResponse.json()) as unknown;
    const validatedAqiData = AqiDataSchema.safeParse(aqiJson);

    if (!validatedAqiData.success) {
      console.error(
        "Zod validation failed for AQI data:",
        validatedAqiData.error.flatten(),
      );
      throw new Error("Received malformed air quality data from API.");
    }
    const aqiData = validatedAqiData.data; // 3. Determine the verdict using the shared logic

    const verdict = determineVerdict(weatherData, aqiData);
    verdict.city = cityName;
    return verdict;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Error in getVerdictForCityAction:", errorMessage); // Re-throw the specific error message to be handled by the client
    throw new Error(errorMessage);
  }
}

// List of randomly selectable cities worldwide for the random functionality
const RANDOM_CITIES = [
  "Tokyo",
  "Jakarta",
  "Delhi",
  "Manila",
  "Shanghai",
  "Sao Paulo",
  "Mumbai",
  "Beijing",
  "Dhaka",
  "Osaka",
  "New York",
  "Karachi",
  "Buenos Aires",
  "Chongqing",
  "Istanbul",
  "Kolkata",
  "Manila",
  "Lagos",
  "Rio de Janeiro",
  "Tianjin",
  "Guangzhou",
  "Los Angeles",
  "Moscow",
  "Shenzhen",
  "Lahore",
  "Bangalore",
  "Paris",
  "Bogota",
  "Jakarta",
  "Chennai",
  "Lima",
  "Bangkok",
  "Seoul",
  "Nagoya",
  "Hyderabad",
  "Chicago",
  "Johannesburg",
  "Wuhan",
  "Kuala Lumpur",
  "Hangzhou",
  "Tongshan",
  "Hong Kong",
  "Quanzhou",
  "Dongguan",
  "Santiago",
  "Shenyang",
  "Madrid",
  "Fuzhou",
  "Xianyang",
  "Luanda",
];

/**
 * A Next.js Server Action to get the "Should I Touch Grass?" verdict for a random city worldwide.
 * It randomly selects from a predefined list of major cities and returns the verdict.
 * @returns {Promise<VerdictResponse>} An object containing the full verdict and data for the random city.
 */
export async function getRandomCityVerdictAction(): Promise<VerdictResponse> {
  // Select a random city from the predefined list
  const randomCity =
    RANDOM_CITIES[Math.floor(Math.random() * RANDOM_CITIES.length)]!;

  // Reuse the existing city verdict logic
  return getVerdictForCityAction(randomCity);
}

/**
 * A Next.js Server Action to get the "Should I Touch Grass?" verdict for given coordinates.","}]}}}
 * It fetches and validates weather and air quality data from OpenWeatherMap.
 * @param latitude The latitude.
 * @param longitude The longitude.
 * @returns {Promise<VerdictResponse>} An object containing the full verdict and data.
 */
export async function getVerdictForCoordsAction(
  latitude: number,
  longitude: number,
): Promise<VerdictResponse> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.error("OpenWeatherMap API key is not set.");
    throw new Error("Server configuration error.");
  }

  try {
    // 1. Fetch and validate weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`,
    );

    if (!weatherResponse.ok) {
      throw new Error(
        "Failed to fetch weather data for the given coordinates.",
      );
    }

    const weatherJson = (await weatherResponse.json()) as unknown;
    const validatedWeatherData = WeatherDataSchema.safeParse(weatherJson);

    if (!validatedWeatherData.success) {
      console.error(
        "Zod validation failed for weather data:",
        validatedWeatherData.error.flatten(),
      );
      throw new Error("Received malformed weather data from API.");
    }
    const weatherData = validatedWeatherData.data;
    const { lat, lon } = weatherData.coord; // 2. Fetch and validate air quality data

    const aqiResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
    );

    if (!aqiResponse.ok) {
      throw new Error("Failed to fetch air quality data.");
    }

    const aqiJson = (await aqiResponse.json()) as unknown;
    const validatedAqiData = AqiDataSchema.safeParse(aqiJson);

    if (!validatedAqiData.success) {
      console.error(
        "Zod validation failed for AQI data:",
        validatedAqiData.error.flatten(),
      );
      throw new Error("Received malformed air quality data from API.");
    }
    const aqiData = validatedAqiData.data; // 3. Determine the verdict using the shared logic

    const verdict = determineVerdict(weatherData, aqiData);
    return verdict;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Error in getVerdictForCoordsAction:", errorMessage); // Re-throw the specific error message to be handled by the client
    throw new Error(errorMessage);
  }
}
