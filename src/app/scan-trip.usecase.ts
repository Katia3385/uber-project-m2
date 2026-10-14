import { DistanceScanner } from "../domain/distance-scanner";
import { Location } from "../domain/types";

export type ScannedTrip = {
    distanceKm: number;
    from: Location;
    to: Location;
};

export class ScanTripUsecase {
    private scanner: DistanceScanner;

    // La distance et la ville viennent du scanner, plus d'une saisie à la main.
    constructor(scanner: DistanceScanner) {
        this.scanner = scanner;
    }

    async execute(origin: string, destination: string): Promise<ScannedTrip> {
        const distanceKm = await this.scanner.distanceKm(origin, destination);
        const fromCity = await this.scanner.cityOf(origin);
        const toCity = await this.scanner.cityOf(destination);

        return {
            distanceKm,
            from: { address: origin, isInsideParis: this.isParis(fromCity) },
            to: { address: destination, isInsideParis: this.isParis(toCity) },
        };
    }

    private isParis(city: string): boolean {
        return city.trim().toLowerCase() === "paris";
    }
}
