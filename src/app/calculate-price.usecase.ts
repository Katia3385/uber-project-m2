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
        // On compare seulement le mois et le jour (MM-DD) : l'année de naissance ne compte pas
        const todayMonthDay = today.toISOString().slice(5, 10);
        const isBirthday = riderBirthday?.slice(5, 10) === todayMonthDay;

        if (isUberX && !isBirthday) {
            totalPrice += 5;
        }

        // Règle 3 : heures de pointe, +50 % sur le total, cumulé avec Noël et UberX.
        // 8h inclus jusqu'à 9h exclu, 18h inclus jusqu'à 20h exclu.
        if (this.isPeakHour(today)) {
            totalPrice = totalPrice * 1.5;
        }

        return totalPrice;
    }

    private isPeakHour(date: Date): boolean {
        const hour = date.getHours();
        return (hour >= 8 && hour < 9) || (hour >= 18 && hour < 20);
    }
}