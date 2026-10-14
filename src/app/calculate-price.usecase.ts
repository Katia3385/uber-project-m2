import { Location } from "../domain/types";

export class CalculatePriceUsecase {
    execute(from: Location, to: Location, distanceKm: number): number {
        let basePrice = 0;
        const pricePerKm = 0.5;

        if (from.isInsideParis && to.isInsideParis) {
            basePrice = 2;
        }
        else if (from.isInsideParis && !to.isInsideParis) {
            basePrice = 10;
        }

        return basePrice + (distanceKm * pricePerKm);
    }
}