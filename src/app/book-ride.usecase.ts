import { RideRepository } from "../infra/ride.repository";
import { RiderRepository } from "../infra/rider.repository";
import { BlockedDriverRepository } from "../infra/blocked-driver.repository";
import { BookingTransaction } from "../infra/booking-transaction";
import { Ride } from "../domain/types";

export class BookRideUsecase {
    private rideRepository: RideRepository;
    private riderRepository: RiderRepository;
    private blockedDriverRepository: BlockedDriverRepository;
    private bookingTransaction: BookingTransaction;

    // Le constructeur reçoit les Repositories (Injection de Dépendances)
    constructor(
        rideRepository: RideRepository,
        riderRepository: RiderRepository,
        blockedDriverRepository: BlockedDriverRepository,
        bookingTransaction: BookingTransaction,
    ) {
        this.rideRepository = rideRepository;
        this.riderRepository = riderRepository;
        this.blockedDriverRepository = blockedDriverRepository;
        this.bookingTransaction = bookingTransaction;
    }

    // La méthode devient async car elle doit attendre la réponse de la DB
    async execute(rideData: Omit<Ride, "id">): Promise<Ride> {
        const rider = await this.riderRepository.findById(rideData.riderId);
        if (!rider) throw new Error("Rider not found");

        // Règle : un Driver bloqué par le Rider ne peut pas lui être assigné
        if (rideData.driverId && await this.blockedDriverRepository.isBlocked(rideData.riderId, rideData.driverId)) {
            throw new Error("Driver is blocked");
        }

        // Règle : le Rider doit avoir assez de fonds pour réserver la course
        if (rider.balance < rideData.price) {
            throw new Error("Insufficient funds");
        }

        // Règle : tant qu'un Driver n'est pas assigné à sa réservation en cours,
        // le Rider ne peut pas en faire une autre (il doit d'abord l'annuler)
        const awaitingDriverRide = await this.rideRepository.findAwaitingDriverByRiderId(rideData.riderId);
        if (awaitingDriverRide) {
            throw new Error("Rider already has a pending ride");
        }

        // Bonus : un point de fidélité par course. La course et le point sont enregistrés dans
        // une même transaction : si le point ne s'ajoute pas, la course n'est pas sauvegardée.
        const savedRide = await this.bookingTransaction.run(async ({ rides, riders }) => {
            const ride = await rides.save(rideData as Ride);
            await riders.addLoyaltyPoint(rideData.riderId);
            return ride;
        });

        return savedRide;
    }
}