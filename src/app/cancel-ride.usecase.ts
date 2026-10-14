export class CancelRideUsecase {
    execute(riderId: string, rideId: string, isDriverOnTheWay: boolean = false,currentStatus: string = "",isBirthday: boolean = false): { status: string; penalty: number } {
        if (currentStatus === "CANCELLED") {
            throw new Error("Ride already cancelled");
        }
        let penalty = 0;
        if (isBirthday) {
            penalty = 0;
        }
        else if (isDriverOnTheWay) {
            penalty = 5;
        }
        return {
            status: "CANCELLED",
            penalty: penalty
        };
    }
}