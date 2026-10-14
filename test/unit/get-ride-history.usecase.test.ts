import { describe, expect, it, beforeEach } from "vitest";
import { GetRideHistoryUsecase } from "../../src/app/get-ride-history.usecase";

// 1. On crée un faux Repository (Mock) pour simuler la base de données
class MockRideRepository {
    async findHistoryByRiderId(riderId: string) {
        return [];
    }
}

describe("GetRideHistoryUsecase", () => {
    let usecase: GetRideHistoryUsecase;
    let mockRepository: MockRideRepository;

    beforeEach(() => {
        mockRepository = new MockRideRepository();
        usecase = new GetRideHistoryUsecase(mockRepository as any);
    });

    it("should return an empty list if the rider has no rides", async () => {
        // GIVEN : Un rider sans course
        const riderId = "rider_123";

        const history = await usecase.execute(riderId);

        // THEN : La liste doit être vide
        expect(history).toEqual([]);
    });

    it("should return the list of rides with driver names", async () => {
        const riderId = "rider_123";

        // On simule ce que le repository va retourner (données brutes de la DB avec jointure)
        const mockDbData = [
            { rideId: "ride_1", status: "COMPLETED", price: 15.5, driverName: "Pierre" },
            { rideId: "ride_2", status: "CANCELLED", price: 5.0, driverName: "Aucun driver" }
        ];

        // On "espionne" la méthode du mock pour qu'elle retourne nos fausses données
        mockRepository.findHistoryByRiderId = async () => mockDbData;

        const history = await usecase.execute(riderId);

        // THEN : On doit retrouver nos 2 courses avec les bons noms de drivers
        expect(history).toHaveLength(2);
        expect(history[0].driverName).toBe("Pierre");
        expect(history[1].driverName).toBe("Aucun driver");
    });
});