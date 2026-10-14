export class BookRideUsecase {
    execute(riderBalance: number, ridePrice: number,hasPendingRide: boolean = false): string {
        if (hasPendingRide) {
            throw new Error("Rider already has a pending ride");
        }
        if (riderBalance < ridePrice) {
            throw new Error("Insufficient funds");
        }
        return "SUCCESS";
    }
}