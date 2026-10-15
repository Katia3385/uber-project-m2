import { BookRideUsecase } from "./book-ride.usecase";
import { EstimateRepository } from "../infra/estimate.repository";
import { Clock } from "../domain/clock";
import { Ride } from "../domain/types";

export class BookRideFromEstimateUsecase {
    private estimateRepository: EstimateRepository;
    private bookRide: BookRideUsecase;
    private clock: Clock;

    constructor(estimateRepository: EstimateRepository, bookRide: BookRideUsecase, clock: Clock) {
        this.estimateRepository = estimateRepository;
        this.bookRide = bookRide;
        this.clock = clock;
    }

    // Réserve la course au prix garanti par l'estimation, tant que le token n'a pas expiré.
    // Les règles de réservation (fonds, réservation en attente, Driver bloqué) restent celles de BookRideUsecase.
    async execute(token: string, driverId?: string): Promise<Ride> {
        const estimate = await this.estimateRepository.findByToken(token);
        if (!estimate) throw new Error("Estimate not found");

        if (this.clock.now() > estimate.expiresAt) {
            throw new Error("Estimate expired");
        }

        return this.bookRide.execute({
            riderId: estimate.riderId,
            driverId,
            status: "PENDING",
            price: estimate.price,
            penalty: 0,
            isDriverOnTheWay: false,
        });
    }
}
