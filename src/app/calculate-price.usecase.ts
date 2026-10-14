
export class CalculatePriceUsecase {
    execute(from: string, to: string, distanceKm: number): number {
        let basePrice = 0;
        const pricePerKm = 0.5;

        // Règle 1 : Paris -> Paris = 2€
        if (from==="Par" && to==="Par") {
            basePrice = 2;
        }
        // Règle 2 : Paris -> Extérieur = 10€
        else if (from === "Par" && to !== "Par") {
            basePrice = 10;
        }
        // Règle 3 : Extérieur -> Paris = 0€ (basePrice reste à 0)

        return basePrice + (distanceKm * pricePerKm);
    }
}