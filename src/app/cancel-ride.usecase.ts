export class CancelRideUsecase {
    execute(riderId: string, rideId: string): string {
        return "CANCELLED";
    }
}