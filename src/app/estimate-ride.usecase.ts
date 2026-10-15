import { ScanTripUsecase } from "./scan-trip.usecase";
import { CalculatePriceUsecase } from "./calculate-price.usecase";
import { RiderRepository } from "../infra/rider.repository";
import { EstimateRepository } from "../infra/estimate.repository";
import { Clock } from "../domain/clock";

const ESTIMATE_VALIDITY_MS = 5 * 60 * 1000;

export type RideEstimate = {
    price: number;
    token: string;
    expiresAt: Date;
};

export class EstimateRideUsecase {
    private scanTrip: ScanTripUsecase;
    private calculatePrice: CalculatePriceUsecase;
    private riderRepository: RiderRepository;
    private estimateRepository: EstimateRepository;
    private clock: Clock;

    constructor(
        scanTrip: ScanTripUsecase,
        calculatePrice: CalculatePriceUsecase,
        riderRepository: RiderRepository,
        estimateRepository: EstimateRepository,
        clock: Clock,
    ) {
        this.scanTrip = scanTrip;
        this.calculatePrice = calculatePrice;
        this.riderRepository = riderRepository;
        this.estimateRepository = estimateRepository;
        this.clock = clock;
    }

    // Retourne le prix estimé (tous modificateurs inclus) sans créer de Ride :
    // seule l'estimation est enregistrée, avec un token valable 5 minutes.
    async execute(riderId: string, origin: string, destination: string, isUberX: boolean = false): Promise<RideEstimate> {
        const rider = await this.riderRepository.findById(riderId);
        if (!rider) throw new Error("Rider not found");

        const trip = await this.scanTrip.execute(origin, destination);
        const price = this.calculatePrice.execute(trip.from, trip.to, trip.distanceKm, isUberX, rider.birthday);

        const expiresAt = new Date(this.clock.now().getTime() + ESTIMATE_VALIDITY_MS);
        const saved = await this.estimateRepository.save({ riderId, price, expiresAt });

        return { price, token: saved.token!, expiresAt };
    }
}
