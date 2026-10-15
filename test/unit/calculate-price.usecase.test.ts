import { describe, expect, it } from "vitest";
import { CalculatePriceUsecase } from "../../src/app/calculate-price.usecase";
import { Location } from "../../src/domain/types";
import { Clock } from "../../src/domain/clock";

// Notre fausse horloge pour contrôler le temps dans les tests
class FakeClock implements Clock {
    private fixedDate: Date;
    constructor(date: Date) {
        this.fixedDate = date;
    }
    now(): Date {
        return this.fixedDate;
    }
}

describe("CalculatePriceUsecase", () => {
    const from: Location = { address: "Tour Eiffel", isInsideParis: true };
    const to: Location = { address: "Louvre", isInsideParis: true };
    const distanceKm = 10; // Prix de base : 2€ + (10 * 0.5€) = 7€

    it("should calculate normal price", () => {
        const clock = new FakeClock(new Date("2023-06-15")); // Un jour normal
        const usecase = new CalculatePriceUsecase(clock);
        expect(usecase.execute(from, to, distanceKm)).toBe(7);
    });

    it("should charge 0 euro of base price from outside Paris to Paris", () => {
        const clock = new FakeClock(new Date("2023-06-15"));
        const usecase = new CalculatePriceUsecase(clock);
        const outside: Location = { address: "Lyon Part-Dieu", isInsideParis: false };

        expect(usecase.execute(outside, to, distanceKm)).toBe(5); // 0€ + (10 * 0.5€)
    });

    it("should charge 10 euros of base price from Paris to outside Paris", () => {
        const clock = new FakeClock(new Date("2023-06-15"));
        const usecase = new CalculatePriceUsecase(clock);
        const outside: Location = { address: "Lyon Part-Dieu", isInsideParis: false };

        expect(usecase.execute(from, outside, distanceKm)).toBe(15); // 10€ + (10 * 0.5€)
    });

    it("should double price on Christmas", () => {
        const clock = new FakeClock(new Date("2023-12-25")); // Noël
        const usecase = new CalculatePriceUsecase(clock);
        expect(usecase.execute(from, to, distanceKm)).toBe(14); // 7€ * 2
    });

    it("should double price on Christmas evening", () => {
        const clock = new FakeClock(new Date("2023-12-25T21:00:00")); // Soirée de Noël, hors heures de pointe
        const usecase = new CalculatePriceUsecase(clock);
        expect(usecase.execute(from, to, distanceKm)).toBe(14); // 7€ * 2
    });

    it("should not double price the day before Christmas", () => {
        const clock = new FakeClock(new Date("2023-12-24T12:00:00"));
        const usecase = new CalculatePriceUsecase(clock);
        expect(usecase.execute(from, to, distanceKm)).toBe(7);
    });

    it("should not double price the day after Christmas", () => {
        const clock = new FakeClock(new Date("2023-12-26T12:00:00"));
        const usecase = new CalculatePriceUsecase(clock);
        expect(usecase.execute(from, to, distanceKm)).toBe(7);
    });

    it("should add 5 euros for UberX", () => {
        const clock = new FakeClock(new Date("2023-06-15"));
        const usecase = new CalculatePriceUsecase(clock);
        expect(usecase.execute(from, to, distanceKm, true)).toBe(12); // 7€ + 5€
    });

    it("should offer UberX supplement on rider's birthday", () => {
        const clock = new FakeClock(new Date("2023-06-15"));
        const usecase = new CalculatePriceUsecase(clock);
        const riderBirthday = "2023-06-15"; // C'est son anniversaire aujourd'hui

        // 7€ de base + 0€ de supplément (offert) = 7€
        expect(usecase.execute(from, to, distanceKm, true, riderBirthday)).toBe(7);
    });

    it("should offer UberX supplement on rider's birthday whatever the birth year", () => {
        const clock = new FakeClock(new Date("2023-06-15"));
        const usecase = new CalculatePriceUsecase(clock);
        const riderBirthday = "1990-06-15"; // Né en 1990, anniversaire aujourd'hui

        expect(usecase.execute(from, to, distanceKm, true, riderBirthday)).toBe(7);
    });

    it("should charge UberX supplement the day after the rider's birthday", () => {
        const clock = new FakeClock(new Date("2023-06-15"));
        const usecase = new CalculatePriceUsecase(clock);
        const riderBirthday = "1990-06-14";

        expect(usecase.execute(from, to, distanceKm, true, riderBirthday)).toBe(12); // 7€ + 5€
    });

    it("should add 50 percent during the morning peak", () => {
        const clock = new FakeClock(new Date("2023-06-15T08:30:00"));
        const usecase = new CalculatePriceUsecase(clock);

        expect(usecase.execute(from, to, distanceKm)).toBe(10.5); // 7€ × 1,5
    });

    it("should add 50 percent during the evening peak", () => {
        const clock = new FakeClock(new Date("2023-06-15T19:00:00"));
        const usecase = new CalculatePriceUsecase(clock);

        expect(usecase.execute(from, to, distanceKm)).toBe(10.5);
    });

    it("should stack the peak increase with Christmas and UberX", () => {
        const clock = new FakeClock(new Date("2023-12-25T08:30:00"));
        const usecase = new CalculatePriceUsecase(clock);

        // (7 × 2 + 5) × 1,5 = 28,5
        expect(usecase.execute(from, to, distanceKm, true)).toBe(28.5);
    });
});