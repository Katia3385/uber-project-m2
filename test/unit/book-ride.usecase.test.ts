import { describe, expect, it } from "vitest";
import { BookRideUsecase } from "../../src/app/book-ride.usecase";

describe("Book Ride Usecase", () => {
    it("should throw an error if the rider does not have enough funds", () => {
        const usecase = new BookRideUsecase();
        const riderBalance = 10;
        const ridePrice = 15;

        expect(() => usecase.execute(riderBalance, ridePrice)).toThrow("Insufficient funds");
    });

    it("should return success if the rider has enough funds", () => {
        const usecase = new BookRideUsecase();
        const riderBalance = 20;
        const ridePrice = 15;

        const result = usecase.execute(riderBalance, ridePrice);

        expect(result).toBe("SUCCESS");
    });
    it("should throw an error if the rider already has a pending ride(Driver not assigned to this ride yet) ", () => {
        const usecase = new BookRideUsecase();
        const riderBalance = 100;
        const ridePrice = 15;
        const hasPendingRide = true;
        expect(() => usecase.execute(riderBalance, ridePrice, hasPendingRide)).toThrow("Rider already has a pending ride");
    });
});