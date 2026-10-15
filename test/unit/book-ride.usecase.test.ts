import { describe, expect, it, beforeEach } from "vitest";
import { BookRideUsecase } from "../../src/app/book-ride.usecase";
import { Ride, Rider } from "../../src/domain/types";

// 1. On crée de faux Repositories (Mocks)
class MockRideRepository {
    savedRides: Ride[] = [];
    awaitingDriverRide: Ride | undefined = undefined;

    async findAwaitingDriverByRiderId(_riderId: string): Promise<Ride | undefined> {
        return this.awaitingDriverRide;
    }

    async save(ride: any) {
        // Simule la base de données qui ajoute un ID
        const saved = { id: "ride_generated_by_db", ...ride };
        this.savedRides.push(saved);
        return saved;
    }
}

class MockRiderRepository {
    rider: Rider | undefined = { id: "rider_123", name: "Test Rider", balance: 100, birthday: "1990-01-01" };

    async findById(_id: string): Promise<Rider | undefined> {
        return this.rider;
    }
}

describe("BookRideUsecase (avec DB)", () => {
    let usecase: BookRideUsecase;
    let mockRideRepo: MockRideRepository;
    let mockRiderRepo: MockRiderRepository;

    const newRideData = {
        riderId: "rider_123",
        driverId: "driver_456",
        status: "PENDING",
        price: 15.5,
        penalty: 0,
        isDriverOnTheWay: false
    };

    beforeEach(() => {
        mockRideRepo = new MockRideRepository();
        mockRiderRepo = new MockRiderRepository();
        // On injecte les mocks dans le Use Case
        usecase = new BookRideUsecase(mockRideRepo as any, mockRiderRepo as any);
    });

    it("should save a new ride into the database", async () => {
        const result = await usecase.execute(newRideData);

        expect(result.id).toBe("ride_generated_by_db");
        expect(result.price).toBe(15.5);
    });

    it("should refuse the booking if the rider does not have enough funds", async () => {
        mockRiderRepo.rider = { id: "rider_123", name: "Test Rider", balance: 5, birthday: "1990-01-01" };

        await expect(usecase.execute(newRideData)).rejects.toThrow("Insufficient funds");
        expect(mockRideRepo.savedRides).toHaveLength(0);
    });

    it("should accept the booking if the balance is exactly the price", async () => {
        mockRiderRepo.rider = { id: "rider_123", name: "Test Rider", balance: 15.5, birthday: "1990-01-01" };

        const result = await usecase.execute(newRideData);

        expect(result.id).toBe("ride_generated_by_db");
    });

    it("should refuse the booking if the rider does not exist", async () => {
        mockRiderRepo.rider = undefined;

        await expect(usecase.execute(newRideData)).rejects.toThrow("Rider not found");
        expect(mockRideRepo.savedRides).toHaveLength(0);
    });

    it("should refuse a new booking while the previous ride has no driver assigned", async () => {
        mockRideRepo.awaitingDriverRide = {
            id: "ride_previous",
            riderId: "rider_123",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: false
        };

        await expect(usecase.execute(newRideData)).rejects.toThrow("Rider already has a pending ride");
        expect(mockRideRepo.savedRides).toHaveLength(0);
    });

    it("should accept a new booking once the previous ride was cancelled", async () => {
        // Une course annulée n'est plus en attente de Driver : le repository ne la renvoie plus
        mockRideRepo.awaitingDriverRide = undefined;

        const result = await usecase.execute(newRideData);

        expect(result.id).toBe("ride_generated_by_db");
    });
});
