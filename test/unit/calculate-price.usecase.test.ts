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
});