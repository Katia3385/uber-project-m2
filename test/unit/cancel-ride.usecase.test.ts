import { describe, expect, it } from "vitest";
import { CancelRideUsecase } from "../../src/app/cancel-ride.usecase";

describe("Cancel Ride Usecase", () => {
    it("should return CANCELLED when a rider cancels a pending ride", () => {
        const usecase = new CancelRideUsecase();
        const riderId = "rider_123";
        const rideId = "ride_456";

        const result = usecase.execute(riderId, rideId);

        expect(result).toEqual({ status: "CANCELLED", penalty: 0 });
    });
    it("should charge a 5 euros penalty if the driver is already on the way", () => {
        const usecase = new CancelRideUsecase();
        const riderId = "rider_123";
        const rideId = "ride_456";
        const isDriverOnTheWay = true;

        const result = usecase.execute(riderId, rideId, isDriverOnTheWay);

        expect(result).toEqual({ status: "CANCELLED", penalty: 5 });
    });
    it("should throw an error if the ride is already cancelled", () => {
        const usecase = new CancelRideUsecase();
        const riderId = "rider_123";
        const rideId = "ride_456";
        const isDriverOnTheWay = false;
        const currentStatus = "CANCELLED";

        expect(() => usecase.execute(riderId, rideId, isDriverOnTheWay, currentStatus)).toThrow("Ride already cancelled");
    });
    it("should have 0 penalty if it is the rider's birthday, even if driver is on the way", () => {
        const usecase = new CancelRideUsecase();
        const riderId = "rider_123";
        const rideId = "ride_456";
        const isDriverOnTheWay = true;
        const currentStatus = "PENDING";
        const isBirthday = true;

        const result = usecase.execute(riderId, rideId, isDriverOnTheWay, currentStatus, isBirthday);

        expect(result.penalty).toBe(0);
        expect(result.status).toBe("CANCELLED");
    });
});