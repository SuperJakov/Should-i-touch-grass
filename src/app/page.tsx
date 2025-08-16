import HomePageClient from "./HomepageClient";
import { getVerdictForCityAction, type VerdictResponse } from "./actions";

export default async function HomePage() {
  const recommendedCities = [
    "New York",
    "London",
    "Tokyo",
    "Los Angeles",
    "Paris",
    "Singapore",
  ];
  const statuses = await Promise.all(
    recommendedCities.map((city) => getVerdictForCityAction(city)),
  );
  const initialPopularStatuses: Record<string, VerdictResponse> = {};
  recommendedCities.forEach((city, index) => {
    initialPopularStatuses[city] = statuses[index]!;
  });
  return <HomePageClient initialPopularStatuses={initialPopularStatuses} />;
}
