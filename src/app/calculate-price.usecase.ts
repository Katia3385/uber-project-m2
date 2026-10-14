import { Location } from "../domain/types";
import { Clock } from "../domain/clock";

export class CalculatePriceUsecase {
    private clock: Clock;

    constructor(clock: Clock) {
        this.clock = clock;
    }

    execute(
        from: Location,
        to: Location,
        distanceKm: number,
        isUberX: boolean = false,
        riderBirthday?: string // Format YYYY-MM-DD (ex: "1990-12-25")
    ): number {
        let basePrice = 0;
        const pricePerKm = 0.5;

        if (from.isInsideParis && to.isInsideParis) {
            basePrice = 2;
        } else if (from.isInsideParis && !to.isInsideParis) {
            basePrice = 10;
        }

        let totalPrice = basePrice + (distanceKm * pricePerKm);

        // On demande la date à notre Clock (plus de new Date() en dur !)
        const today = this.clock.now();

        // Règle 1 : Jour de Noël (25 décembre) -> Prix doublé
        if (today.getMonth() === 11 && today.getDate() === 25) {
            totalPrice = totalPrice * 2;
        }

        // Règle 2 : Supplément UberX (+5€), SAUF si c'est l'anniversaire du Rider
        const todayString = today.toISOString().split('T')[0];
        const isBirthday = riderBirthday === todayString;

        if (isUberX && !isBirthday) {
            totalPrice += 5;
        }

        return totalPrice;
    }
}