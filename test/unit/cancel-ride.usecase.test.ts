import { describe, expect, it } from "vitest";
import { CancelRideUsecase } from "../../src/app/cancel-ride.usecase";

describe("Cancel Ride Usecase", () => {
    it("should return CANCELLED when a rider cancels a pending ride", () => {
        const usecase = new CancelRideUsecase();
        const riderId = "rider_123";
        const rideId = "ride_456";

        const result = usecase.execute(riderId, rideId);

        expect(result).toBe("CANCELLED");
    });
});