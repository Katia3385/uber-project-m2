import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";
import { GetRideHistoryUsecase } from "../app/get-ride-history.usecase";

export function createApp(
    bookRide: BookRideUsecase,
    cancelRide: CancelRideUsecase,
    rideHistory: GetRideHistoryUsecase,
) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get("/", (_req, res) => {
        res.status(200).json({
            book: "POST /rides",
            cancel: "POST /rides/:rideId/cancel",
            history: "GET /riders/:riderId/rides",
        });
    });

    app.post("/rides", async (req, res, next) => {
        try {
            const ride = await bookRide.execute(req.body);
            res.status(201).json(ride);
        } catch (error) {
            next(error);
        }
    });

    app.post("/rides/:rideId/cancel", async (req, res, next) => {
        try {
            const result = await cancelRide.execute(String(req.body.riderId), String(req.params.rideId));
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    });

    app.get("/riders/:riderId/rides", async (req, res, next) => {
        try {
            const history = await rideHistory.execute(String(req.params.riderId));
            res.status(200).json(history);
        } catch (error) {
            next(error);
        }
    });

    app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
        const message = error.message || "Unexpected error";
        const status = message === "Ride not found" || message === "Rider not found"
            ? 404
            : message === "Insufficient funds"
                ? 402
                : message === "Ride already cancelled" || message === "Rider already has a pending ride"
                    ? 409
                    : 500;
        res.status(status).json({ error: message });
    });

    return app;
}
