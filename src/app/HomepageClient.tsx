"use client";

import React, { useState, useEffect } from "react";
import { Sun, Cloud, MapPin, Wind, Navigation } from "lucide-react";
import {
  getVerdictForCityAction,
  getVerdictForCoordsAction,
  type VerdictResponse,
} from "./actions";

// Props for the ResultCard component
interface ResultCardProps {
  result: VerdictResponse;
}

// Main Client Component for the Home Page
export default function HomePageClient({
  initialPopularStatuses,
}: {
  initialPopularStatuses: Record<string, VerdictResponse>;
}) {
  const [location, setLocation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerdictResponse | null>(null);
  const [error, setError] = useState<string>("");

  const recommendedCities: string[] = [
    "New York",
    "London",
    "Tokyo",
    "Los Angeles",
    "Paris",
    "Singapore",
  ];
  const [popularStatuses, setPopularStatuses] = useState<
    Record<string, VerdictResponse>
  >(initialPopularStatuses);

  const handleApiCall = async (apiCall: Promise<VerdictResponse>) => {
    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiCall;
      setResult(data);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!location) {
      setError("Please enter a location.");
      return;
    }
    handleApiCall(getVerdictForCityAction(location));
  };

  const handleUseMyLocation = (): void => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleApiCall(getVerdictForCoordsAction(latitude, longitude));
      },
      () => {
        setError(
          "Unable to retrieve your location. Please grant permission or enter it manually.",
        );
      },
    );
  };

  const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
    const isYes = result.verdict === "Yes";
    const cardClasses = isYes
      ? "bg-accent text-foreground"
      : "bg-secondary text-white";

    return (
      <div
        className={`animate-fade-in-up w-full max-w-md transform rounded-2xl p-6 shadow-2xl transition-all duration-500 md:p-8 ${cardClasses}`}
      >
        <div className="text-center">
          <p className="text-xl font-medium opacity-80">{result.city}</p>
          <h2 className="my-4 text-6xl font-bold opacity-90 md:text-8xl">
            {result.verdict}
          </h2>
          <p className="text-lg opacity-90">{result.message}</p>
        </div>
        <div className="mt-8 flex justify-around border-t border-white/20 pt-6 text-center">
          <div className="flex flex-col items-center gap-1">
            <Sun size={24} />
            <span className="font-semibold">{result.weather}</span>
            <span className="text-xs opacity-70">Weather</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Wind size={24} />
            <span className="font-semibold">{result.aqi}</span>
            <span className="text-xs opacity-70">AQI</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Cloud size={24} />
            <span className="font-semibold">{result.temp}</span>
            <span className="text-xs opacity-70">Temp</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md text-center">
        {!result && !isLoading && (
          <div className="animate-fade-in">
            <h1 className="mb-2 text-4xl font-bold md:text-5xl">
              Should I Touch Grass? 🌿
            </h1>
            <p className="text-muted mb-8 text-lg">
              Get a verdict on whether you should go outside.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="relative">
                <MapPin
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your city..."
                  className="border-muted bg-surface w-full rounded-full border-2 py-3 pr-4 pl-12 transition focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="hover:bg-accent-dark w-full rounded-full bg-green-600 px-4 py-3 font-bold text-white transition-transform duration-200 hover:scale-105"
              >
                Check Conditions
              </button>
            </form>
            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="mx-4 flex-shrink text-slate-500">OR</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>
            <button
              onClick={handleUseMyLocation}
              className="hover:bg-secondary-light flex w-full items-center justify-center gap-2 rounded-full bg-slate-700 px-4 py-3 font-bold text-white transition-transform duration-200 hover:scale-105"
            >
              <Navigation size={18} />
              Use My Current Location
            </button>
            <div className="mt-10">
              <h3 className="mb-4 text-slate-400">
                Or try one of these cities:
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {recommendedCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleApiCall(getVerdictForCityAction(city))}
                    className="text-subdued hover:bg-secondary rounded-full bg-slate-800 px-4 py-2 text-sm font-medium transition"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex w-full flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-green-500"></div>
            <p className="text-foreground text-lg">
              Analyzing the outside world...
            </p>
          </div>
        )}
        {error && (
          <p className="animate-fade-in mt-4 rounded-lg bg-red-500/10 p-3 text-red-400">
            {error}
          </p>
        )}
        {result && <ResultCard result={result} />}
        <div className="full-width-section px-4">
          <h3 className="text-foreground mb-4">Popular Cities Status</h3>
          <div className="flex w-full flex-wrap justify-center gap-6">
            {recommendedCities.map((city) => {
              const status = popularStatuses[city];
              return (
                <div key={city} className="w-full sm:w-[240px]">
                  {status ? (
                    <ResultCard result={status} />
                  ) : (
                    <div className="text-foreground flex h-48 w-full items-center justify-center">
                      Loading...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
