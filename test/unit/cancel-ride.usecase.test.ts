import { describe, expect, it, beforeEach } from "vitest";
import { CancelRideUsecase } from "../../src/app/cancel-ride.usecase";

// 1. On crée de faux Repositories (Mocks) pour simuler la DB
class MockRideRepository {
    async findById(id: string) { return null; }
}
class MockRiderRepository {
    async findById(id: string) { return null; }
}

describe("CancelRideUsecase (avec DB)", () => {
    let usecase: CancelRideUsecase;
    let mockRideRepo: MockRideRepository;
    let mockRiderRepo: MockRiderRepository;

    beforeEach(() => {
        mockRideRepo = new MockRideRepository();
        mockRiderRepo = new MockRiderRepository();
        // On injecte les mocks dans le Use Case (le 'as any' est une astuce TypeScript rapide)
        usecase = new CancelRideUsecase(mockRideRepo as any, mockRiderRepo as any);
    });

    it("should cancel a ride with 0 penalty normally", async () => {
        // GIVEN : La course existe, driver pas en chemin, pas d'anniversaire
        mockRideRepo.findById = async () => ({ id: "ride_1", status: "PENDING", isDriverOnTheWay: false });
        mockRiderRepo.findById = async () => ({ id: "rider_1", birthday: "1990-01-01" });

        // WHEN
        const result = await usecase.execute("rider_1", "ride_1");

        // THEN
        expect(result).toEqual({ status: "CANCELLED", penalty: 0 });
    });

    it("should apply 5 penalty if driver is on the way", async () => {
        // GIVEN : Le driver est en chemin
        mockRideRepo.findById = async () => ({ id: "ride_2", status: "PENDING", isDriverOnTheWay: true });
        mockRiderRepo.findById = async () => ({ id: "rider_2", birthday: "1990-01-01" });

        // WHEN
        const result = await usecase.execute("rider_2", "ride_2");

        // THEN
        expect(result.penalty).toBe(5);
    });

    it("should throw an error if ride is already cancelled", async () => {
        // GIVEN : La course est déjà annulée
        mockRideRepo.findById = async () => ({ id: "ride_3", status: "CANCELLED", isDriverOnTheWay: false });
        mockRiderRepo.findById = async () => ({ id: "rider_3", birthday: "1990-01-01" });

        // WHEN & THEN
        await expect(usecase.execute("rider_3", "ride_3")).rejects.toThrow("Ride already cancelled");
    });

    it("should have 0 penalty if it is the rider's birthday", async () => {
        // GIVEN : Driver en chemin (normalement 5€), MAIS c'est l'anniversaire aujourd'hui
        mockRideRepo.findById = async () => ({ id: "ride_4", status: "PENDING", isDriverOnTheWay: true });
        mockRiderRepo.findById = async () => ({ id: "rider_4", birthday: new Date().toISOString().split('T')[0] }); // Date d'aujourd'hui

        // WHEN
        const result = await usecase.execute("rider_4", "ride_4");

        // THEN
        expect(result.penalty).toBe(0);
    });
});