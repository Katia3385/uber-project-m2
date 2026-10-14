import { Location } from "../domain/types";

export class CalculatePriceUsecase {
    execute(from: Location, to: Location, distanceKm: number, rideDate: Date = new Date(), isUberX: boolean = false,
    isBirthday: boolean = false): number {
        let basePrice = 0;
        const pricePerKm = 0.5;

        if (from.isInsideParis && to.isInsideParis) {
            basePrice = 2;
        }
        else if (from.isInsideParis && !to.isInsideParis) {
            basePrice = 10;
        }

        let totalPrice = basePrice + (distanceKm * pricePerKm);

        //  Jour de Noël (25 décembre) -> Prix doublé
        if (rideDate.getMonth() === 11 && rideDate.getDate() === 25) {
            totalPrice = totalPrice * 2;
        }

        //  Supplément UberX (+5€), SAUF si c'est l'anniversaire du Rider
        if (isUberX && !isBirthday) {
            totalPrice += 5;
        }
        return totalPrice
    }
}