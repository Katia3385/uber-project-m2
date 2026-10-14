import { describe, expect, it } from "vitest";
import { CalculatePriceUsecase } from "../../src/app/calculate-price.usecase";

describe("Calculate Price Usecase", () => {
    it("should return 4.5 euros for a 5km trip inside Paris", () => {
        const usecase = new CalculatePriceUsecase();

        const from = "Par";
        const to =  "Par";
        const distanceKm = 5;

        const price = usecase.execute(from, to, distanceKm);

        expect(price).toBe(4.5);
    });

    it("should return 15 euros for a 10km trip from Paris to Outside Paris", () => {
        const usecase = new CalculatePriceUsecase();
        const from =  "Par";
        const to = "Ext";
        const distanceKm = 10;

        const price = usecase.execute(from, to, distanceKm);

        expect(price).toBe(15);
    });
    it("should return 5 euros for a 10km trip from Outside Paris to Paris", () => {
        const usecase = new CalculatePriceUsecase();

        const from = "Ext";
        const to = "Par";
        const distanceKm = 10;

        const price = usecase.execute(from, to, distanceKm);

        // Prix de base (0€) + (10km * 0.5€) = 5€
        expect(price).toBe(5);
    });
});