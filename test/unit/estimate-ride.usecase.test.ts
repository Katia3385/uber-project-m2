import { describe, expect, it, beforeEach } from "vitest";
import { EstimateRideUsecase } from "../../src/app/estimate-ride.usecase";
import { CalculatePriceUsecase } from "../../src/app/calculate-price.usecase";
import { Clock } from "../../src/domain/clock";
import { Estimate, Rider } from "../../src/domain/types";

class FakeClock implements Clock {
    constructor(private date: Date) {}
    now(): Date {
        return this.date;
    }
}

// Faux scanner de trajet : Paris -> Paris sur 10 km (prix de base 2€ + 5€ = 7€)
class StubScanTrip {
    async execute(origin: string, destination: string) {
        return {
            distanceKm: 10,
            from: { address: origin, isInsideParis: true },
            to: { address: destination, isInsideParis: true },
        };
    }
}

class MockRiderRepository {
    rider: Rider | undefined = { id: "rider_1", name: "Test Rider", balance: 100, birthday: "1990-01-01" };

    async findById(_id: string): Promise<Rider | undefined> {
        return this.rider;
    }
}

class MockEstimateRepository {
    saved: Estimate[] = [];

    async save(estimate: Estimate): Promise<Estimate> {
        const saved = { token: "token_generated_by_db", ...estimate };
        this.saved.push(saved);
        return saved;
    }
}

describe("EstimateRideUsecase", () => {
    let riderRepo: MockRiderRepository;
    let estimateRepo: MockEstimateRepository;

    function usecaseAt(date: string) {
        const clock = new FakeClock(new Date(date));
        return new EstimateRideUsecase(
            new StubScanTrip() as any,
            new CalculatePriceUsecase(clock),
            riderRepo as any,
            estimateRepo as any,
            clock,
        );
    }

    beforeEach(() => {
        riderRepo = new MockRiderRepository();
        estimateRepo = new MockEstimateRepository();
    });

    it("should return the estimated price with a token", async () => {
        const result = await usecaseAt("2023-06-15T12:00:00Z").execute("rider_1", "Tour Eiffel", "Louvre");

        expect(result.price).toBe(7);
        expect(result.token).toBe("token_generated_by_db");
    });

    it("should expire the estimate after 5 minutes", async () => {
        const result = await usecaseAt("2023-06-15T12:00:00Z").execute("rider_1", "Tour Eiffel", "Louvre");

        expect(result.expiresAt).toEqual(new Date("2023-06-15T12:05:00Z"));
    });

    it("should save the estimate for the rider with its price and expiration", async () => {
        await usecaseAt("2023-06-15T12:00:00Z").execute("rider_1", "Tour Eiffel", "Louvre");

        expect(estimateRepo.saved).toEqual([
            {
                token: "token_generated_by_db",
                riderId: "rider_1",
                price: 7,
                expiresAt: new Date("2023-06-15T12:05:00Z"),
            },
        ]);
    });

    it("should include the UberX, Christmas and peak hour modifiers", async () => {
        const result = await usecaseAt("2023-12-25T08:30:00").execute("rider_1", "Tour Eiffel", "Louvre", true);

        expect(result.price).toBe(28.5); // (7 × 2 + 5) × 1,5
    });

    it("should offer the UberX supplement on the rider's birthday", async () => {
        riderRepo.rider = { id: "rider_1", name: "Test Rider", balance: 100, birthday: "1990-06-15" };

        const result = await usecaseAt("2023-06-15T12:00:00Z").execute("rider_1", "Tour Eiffel", "Louvre", true);

        expect(result.price).toBe(7);
    });

    it("should refuse to estimate for an unknown rider", async () => {
        riderRepo.rider = undefined;

        await expect(usecaseAt("2023-06-15T12:00:00Z").execute("rider_1", "Tour Eiffel", "Louvre"))
            .rejects.toThrow("Rider not found");
        expect(estimateRepo.saved).toHaveLength(0);
    });
});
