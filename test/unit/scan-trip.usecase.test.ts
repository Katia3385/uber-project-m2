import { describe, expect, it } from "vitest";
import { ScanTripUsecase } from "../../src/app/scan-trip.usecase";
import { DistanceScanner } from "../../src/domain/distance-scanner";
import { CalculatePriceUsecase } from "../../src/app/calculate-price.usecase";
import { Clock } from "../../src/domain/clock";

class FakeScanner implements DistanceScanner {
    constructor(
        private readonly distance: number,
        private readonly cities: Record<string, string>,
    ) {}

    async distanceKm(): Promise<number> {
        return this.distance;
    }

    async cityOf(address: string): Promise<string> {
        const city = this.cities[address];
        if (!city) {
            throw new Error("City not stubbed");
        }
        return city;
    }
}

class FakeClock implements Clock {
    now(): Date {
        return new Date("2023-06-15");
    }
}

describe("ScanTripUsecase", () => {
    it("should read the distance and the cities from the scanner", async () => {
        const scanner = new FakeScanner(10, {
            "Tour Eiffel": "Paris",
            "Lyon Part-Dieu": "Lyon",
        });
        const usecase = new ScanTripUsecase(scanner);

        const trip = await usecase.execute("Tour Eiffel", "Lyon Part-Dieu");

        expect(trip.distanceKm).toBe(10);
        expect(trip.from).toEqual({ address: "Tour Eiffel", isInsideParis: true });
        expect(trip.to).toEqual({ address: "Lyon Part-Dieu", isInsideParis: false });
    });

    it("should price the trip with the scanned distance instead of a hand-written one", async () => {
        const scanner = new FakeScanner(10, {
            "Tour Eiffel": "Paris",
            "Lyon Part-Dieu": "Lyon",
        });
        const trip = await new ScanTripUsecase(scanner).execute("Tour Eiffel", "Lyon Part-Dieu");

        const price = new CalculatePriceUsecase(new FakeClock()).execute(
            trip.from,
            trip.to,
            trip.distanceKm,
        );

        // Paris -> extérieur, 10 km : 10 + (10 × 0,5) = 15
        expect(price).toBe(15);
    });
});
