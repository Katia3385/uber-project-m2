import { Location } from "../domain/types";

export class CalculatePriceUsecase {
    execute(from: Location, to: Location, distanceKm: number): number {
        // Règle de base : Paris -> Paris = 2€ + 0.5€ par km
        const basePrice = 2;
        const pricePerKm = 0.5;

        return basePrice + (distanceKm * pricePerKm);
    }
}