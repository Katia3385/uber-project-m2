import { describe, expect, it, beforeEach } from "vitest";
import { BookRideUsecase } from "../../src/app/book-ride.usecase";
import { Ride, Rider } from "../../src/domain/types";

// 1. On crée de faux Repositories (Mocks)
// Fausse transaction : elle exécute le travail avec les faux repositories et note qu'on est "dans" la transaction
class MockBookingTransaction {
    inTransaction = false;
    constructor(private repositories: { rides: any; riders: any }) {}

    async run<T>(work: (repositories: { rides: any; riders: any }) => Promise<T>): Promise<T> {
        this.inTransaction = true;
        try {
            return await work(this.repositories);
        } finally {
            this.inTransaction = false;
        }
    }
}

class MockRideRepository {
    savedRides: Ride[] = [];
    savedInTransaction: boolean[] = [];
    isInTransaction: () => boolean = () => false;
    awaitingDriverRide: Ride | undefined = undefined;

    async findAwaitingDriverByRiderId(_riderId: string): Promise<Ride | undefined> {
        return this.awaitingDriverRide;
    }

    async save(ride: any) {
        // Simule la base de données qui ajoute un ID
        const saved = { id: "ride_generated_by_db", ...ride };
        this.savedRides.push(saved);
        this.savedInTransaction.push(this.isInTransaction());
        return saved;
    }
}

class MockRiderRepository {
    loyaltyPointsAdded: string[] = [];
    loyaltyPointsInTransaction: boolean[] = [];
    isInTransaction: () => boolean = () => false;
    addLoyaltyPointError: Error | undefined = undefined;

    async addLoyaltyPoint(id: string): Promise<void> {
        if (this.addLoyaltyPointError) throw this.addLoyaltyPointError;
        this.loyaltyPointsAdded.push(id);
        this.loyaltyPointsInTransaction.push(this.isInTransaction());
    }

    rider: Rider | undefined = { id: "rider_123", name: "Test Rider", balance: 100, birthday: "1990-01-01" };

    async findById(_id: string): Promise<Rider | undefined> {
        return this.rider;
    }
}

class MockBlockedDriverRepository {
    blockedDriverIds: string[] = [];

    async isBlocked(_riderId: string, driverId: string): Promise<boolean> {
        return this.blockedDriverIds.includes(driverId);
    }
}

describe("BookRideUsecase (avec DB)", () => {
    let usecase: BookRideUsecase;
    let mockRideRepo: MockRideRepository;
    let mockRiderRepo: MockRiderRepository;
    let mockBlockedDriverRepo: MockBlockedDriverRepository;
    let mockTransaction: MockBookingTransaction;

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
        mockBlockedDriverRepo = new MockBlockedDriverRepository();
        // On injecte les mocks dans le Use Case
        mockTransaction = new MockBookingTransaction({ rides: mockRideRepo, riders: mockRiderRepo });
        mockRideRepo.isInTransaction = () => mockTransaction.inTransaction;
        mockRiderRepo.isInTransaction = () => mockTransaction.inTransaction;
        usecase = new BookRideUsecase(
            mockRideRepo as any,
            mockRiderRepo as any,
            mockBlockedDriverRepo as any,
            mockTransaction as any,
        );
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

    it("should refuse a driver blocked by the rider", async () => {
        mockBlockedDriverRepo.blockedDriverIds = ["driver_456"];

        await expect(usecase.execute(newRideData)).rejects.toThrow("Driver is blocked");
        expect(mockRideRepo.savedRides).toHaveLength(0);
    });

    it("should accept a driver the rider has not blocked", async () => {
        mockBlockedDriverRepo.blockedDriverIds = ["another_driver"];

        const result = await usecase.execute(newRideData);

        expect(result.id).toBe("ride_generated_by_db");
    });

    it("should accept a booking without driver", async () => {
        mockBlockedDriverRepo.blockedDriverIds = ["driver_456"];
        const { driverId, ...rideWithoutDriver } = newRideData;

        const result = await usecase.execute(rideWithoutDriver);

        expect(result.id).toBe("ride_generated_by_db");
    });

    it("should add one loyalty point to the rider for the booked ride", async () => {
        await usecase.execute(newRideData);

        expect(mockRiderRepo.loyaltyPointsAdded).toEqual(["rider_123"]);
    });

    it("should save the ride and add the loyalty point inside the same transaction", async () => {
        await usecase.execute(newRideData);

        expect(mockRideRepo.savedInTransaction).toEqual([true]);
        expect(mockRiderRepo.loyaltyPointsInTransaction).toEqual([true]);
    });

    it("should fail the booking when the loyalty point cannot be added", async () => {
        mockRiderRepo.addLoyaltyPointError = new Error("Rider not found");

        await expect(usecase.execute(newRideData)).rejects.toThrow("Rider not found");
    });

    it("should not add a loyalty point when the booking is refused", async () => {
        mockRiderRepo.rider = { id: "rider_123", name: "Test Rider", balance: 5, birthday: "1990-01-01" };

        await expect(usecase.execute(newRideData)).rejects.toThrow("Insufficient funds");

        expect(mockRiderRepo.loyaltyPointsAdded).toEqual([]);
    });
});
