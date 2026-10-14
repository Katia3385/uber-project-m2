import { describe, expect, it, beforeEach } from "vitest";
import { BookRideUsecase } from "../../src/app/book-ride.usecase";

// 1. On crée un faux Repository (Mock)
class MockRideRepository {
    async save(ride: any) {
        // Simule la base de données qui ajoute un ID
        return { id: "ride_generated_by_db", ...ride };
    }
}

describe("BookRideUsecase (avec DB)", () => {
    let usecase: BookRideUsecase;
    let mockRideRepo: MockRideRepository;

    beforeEach(() => {
        mockRideRepo = new MockRideRepository();
        // On injecte le mock dans le Use Case
        usecase = new BookRideUsecase(mockRideRepo as any);
    });

    it("should save a new ride into the database", async () => {
        // GIVEN : Les données d'une nouvelle course
        const newRideData = {
            riderId: "rider_123",
            driverId: "driver_456",
            status: "PENDING",
            price: 15.5,
            penalty: 0,
            isDriverOnTheWay: false
        };

        const result = await usecase.execute(newRideData);

        expect(result.id).toBe("ride_generated_by_db");
        expect(result.price).toBe(15.5);
    });
});