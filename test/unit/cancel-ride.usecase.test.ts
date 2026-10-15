import { describe, expect, it, beforeEach } from "vitest";
import { CancelRideUsecase } from "../../src/app/cancel-ride.usecase";
import { Ride, Rider } from "../../src/domain/types";
import { Clock } from "../../src/domain/clock";

// Fausse horloge : on fixe la date pour que l'anniversaire ne dépende pas du jour réel
class FakeClock implements Clock {
    now(): Date {
        return new Date("2023-06-15");
    }
}

// 1. On crée de faux Repositories (Mocks) pour simuler la DB avec les bons types de retour
class MockRideRepository {
    async findById(id: string): Promise<Ride | undefined> {
        return undefined;
    }
}

class MockRiderRepository {
    async findById(id: string): Promise<Rider | undefined> {
        return undefined;
    }
}

describe("CancelRideUsecase (avec DB)", () => {
    let usecase: CancelRideUsecase;
    let mockRideRepo: MockRideRepository;
    let mockRiderRepo: MockRiderRepository;

    beforeEach(() => {
        mockRideRepo = new MockRideRepository();
        mockRiderRepo = new MockRiderRepository();
        // On injecte les mocks dans le Use Case
        usecase = new CancelRideUsecase(mockRideRepo as any, mockRiderRepo as any, new FakeClock());
    });

    it("should cancel a ride with 0 penalty normally", async () => {
        // GIVEN : La course existe, driver pas en chemin, pas d'anniversaire
        const mockRide: Ride = {
            id: "ride_1",
            riderId: "rider_1",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: false
        };
        const mockRider: Rider = {
            id: "rider_1",
            name: "Test Rider",
            balance: 100,
            birthday: "1990-01-01"
        };

        mockRideRepo.findById = async () => mockRide;
        mockRiderRepo.findById = async () => mockRider;

        // WHEN
        const result = await usecase.execute("rider_1", "ride_1");

        // THEN
        expect(result).toEqual({ status: "CANCELLED", penalty: 0 });
    });

    it("should apply 5 penalty if driver is on the way", async () => {
        // GIVEN : Le driver est en chemin
        const mockRide: Ride = {
            id: "ride_2",
            riderId: "rider_2",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: true
        };
        const mockRider: Rider = {
            id: "rider_2",
            name: "Test Rider",
            balance: 100,
            birthday: "1990-01-01"
        };

        mockRideRepo.findById = async () => mockRide;
        mockRiderRepo.findById = async () => mockRider;

        // WHEN
        const result = await usecase.execute("rider_2", "ride_2");

        // THEN
        expect(result.penalty).toBe(5);
    });

    it("should throw an error if ride is already cancelled", async () => {
        // GIVEN : La course est déjà annulée
        const mockRide: Ride = {
            id: "ride_3",
            riderId: "rider_3",
            status: "CANCELLED",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: false
        };
        const mockRider: Rider = {
            id: "rider_3",
            name: "Test Rider",
            balance: 100,
            birthday: "1990-01-01"
        };

        mockRideRepo.findById = async () => mockRide;
        mockRiderRepo.findById = async () => mockRider;

        // WHEN & THEN
        await expect(usecase.execute("rider_3", "ride_3")).rejects.toThrow("Ride already cancelled");
    });

    it("should have 0 penalty if it is the rider's birthday, whatever the birth year", async () => {
        // GIVEN : Driver en chemin (normalement 5€), MAIS c'est l'anniversaire aujourd'hui (né en 1990)
        const mockRide: Ride = {
            id: "ride_4",
            riderId: "rider_4",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: true
        };
        const mockRider: Rider = {
            id: "rider_4",
            name: "Test Rider",
            balance: 100,
            birthday: "1990-06-15"
        };

        mockRideRepo.findById = async () => mockRide;
        mockRiderRepo.findById = async () => mockRider;

        // WHEN
        const result = await usecase.execute("rider_4", "ride_4");

        // THEN
        expect(result.penalty).toBe(0);
    });

    it("should apply the penalty the day after the rider's birthday", async () => {
        const mockRide: Ride = {
            id: "ride_5",
            riderId: "rider_5",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: true
        };
        const mockRider: Rider = {
            id: "rider_5",
            name: "Test Rider",
            balance: 100,
            birthday: "1990-06-14"
        };

        mockRideRepo.findById = async () => mockRide;
        mockRiderRepo.findById = async () => mockRider;

        const result = await usecase.execute("rider_5", "ride_5");

        expect(result.penalty).toBe(5);
    });
});
