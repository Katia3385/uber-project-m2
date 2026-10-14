import { describe, expect, it } from "vitest";
import { CalculatePriceUsecase } from "../../src/app/calculate-price.usecase";
import { Location } from "../../src/domain/types";

describe("Calculate Price Usecase", () => {
    it("should return 4.5 euros for a 5km trip inside Paris", () => {
        const usecase = new CalculatePriceUsecase();
        const from: Location = { address: "Tour Eiffel", isInsideParis: true };
        const to: Location = { address: "Louvre", isInsideParis: true };
        const distanceKm = 5;

        const price = usecase.execute(from, to, distanceKm);
        expect(price).toBe(4.5);
    });

    it("should return 15 euros for a 10km trip from Paris to Outside Paris", () => {
        const usecase = new CalculatePriceUsecase();
        const from: Location = { address: "Gare de Lyon", isInsideParis: true };
        const to: Location = { address: "Disneyland", isInsideParis: false };
        const distanceKm = 10;

        const price = usecase.execute(from, to, distanceKm);
        expect(price).toBe(15);
    });

    it("should return 5 euros for a 10km trip from Outside Paris to Paris", () => {
        const usecase = new CalculatePriceUsecase();
        const from: Location = { address: "Aéroport CDG", isInsideParis: false };
        const to: Location = { address: "Opéra", isInsideParis: true };
        const distanceKm = 10;

        const price = usecase.execute(from, to, distanceKm);
        expect(price).toBe(5);
    });
    it("should double the total price if the ride is on Christmas Day", () => {
        const usecase = new CalculatePriceUsecase();
        const from: Location = { address: "Tour Eiffel", isInsideParis: true };
        const to: Location = { address: "Louvre", isInsideParis: true };
        const distanceKm = 10;

        // On crée une date qui tombe un 25 décembre
        const christmasDate = new Date("2026-12-25");

        // On appelle execute avec la date en 4ème argument
        const price = usecase.execute(from, to, distanceKm, christmasDate);

        expect(price).toBe(14);
    });
    it("should add 5 euros for UberX service, unless it is the rider's birthday", () => {
        const usecase = new CalculatePriceUsecase();
        const from: Location = { address: "Tour Eiffel", isInsideParis: true };
        const to: Location = { address: "Louvre", isInsideParis: true };
        const distanceKm = 10;
        // Prix normal : 2€ (base) + 10 * 0.5€ = 7€.

        // SCÉNARIO 1 : C'est UberX, mais ce n'est PAS l'anniversaire
        // Prix attendu : 7€ + 5€ (supplément) = 12€
        const priceUberX = usecase.execute(from, to, distanceKm, new Date(), true, false);
        expect(priceUberX).toBe(12);

        // SCÉNARIO 2 : C'est UberX, ET c'est l'anniversaire du Rider
        // Prix attendu : 7€ + 0€ (offert) = 7€
        const priceBirthday = usecase.execute(from, to, distanceKm, new Date(), true, true);
        expect(priceBirthday).toBe(7);
    });
});