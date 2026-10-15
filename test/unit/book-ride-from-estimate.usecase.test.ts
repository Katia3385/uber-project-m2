import { describe, expect, it, beforeEach } from "vitest";
import { BookRideFromEstimateUsecase } from "../../src/app/book-ride-from-estimate.usecase";
import { Clock } from "../../src/domain/clock";
import { Estimate, Ride } from "../../src/domain/types";

class FakeClock implements Clock {
    constructor(private date: Date) {}
    now(): Date {
        return this.date;
    }
}

class MockEstimateRepository {
    estimate: Estimate | undefined = {
        token: "token_1",
        riderId: "rider_1",
        price: 12.5,
        expiresAt: new Date("2023-06-15T12:05:00Z"),
    };

    async findByToken(_token: string): Promise<Estimate | undefined> {
        return this.estimate;
    }
}

class MockBookRideUsecase {
    booked: Omit<Ride, "id">[] = [];

    async execute(rideData: Omit<Ride, "id">): Promise<Ride> {
        this.booked.push(rideData);
        return { id: "ride_1", ...rideData };
    }
}

describe("BookRideFromEstimateUsecase", () => {
    let estimateRepo: MockEstimateRepository;
    let bookRide: MockBookRideUsecase;

    function usecaseAt(date: string) {
        return new BookRideFromEstimateUsecase(
            estimateRepo as any,
            bookRide as any,
            new FakeClock(new Date(date)),
        );
    }

    beforeEach(() => {
        estimateRepo = new MockEstimateRepository();
        bookRide = new MockBookRideUsecase();
    });

    it("should book the ride at the estimated price", async () => {
        const ride = await usecaseAt("2023-06-15T12:04:00Z").execute("token_1");

        expect(ride.price).toBe(12.5);
        expect(bookRide.booked).toEqual([
            { riderId: "rider_1", driverId: undefined, status: "PENDING", price: 12.5, penalty: 0, isDriverOnTheWay: false },
        ]);
    });

    it("should book the ride with the given driver", async () => {
        await usecaseAt("2023-06-15T12:04:00Z").execute("token_1", "driver_1");

        expect(bookRide.booked[0].driverId).toBe("driver_1");
    });

    it("should refuse an expired estimate", async () => {
        await expect(usecaseAt("2023-06-15T12:06:00Z").execute("token_1")).rejects.toThrow("Estimate expired");
        expect(bookRide.booked).toHaveLength(0);
    });

    it("should refuse an unknown token", async () => {
        estimateRepo.estimate = undefined;

        await expect(usecaseAt("2023-06-15T12:04:00Z").execute("unknown")).rejects.toThrow("Estimate not found");
        expect(bookRide.booked).toHaveLength(0);
    });
});
