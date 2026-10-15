import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";
import { GetRideHistoryUsecase } from "../app/get-ride-history.usecase";
import { EstimateRideUsecase } from "../app/estimate-ride.usecase";
import { BookRideFromEstimateUsecase } from "../app/book-ride-from-estimate.usecase";

const ERROR_STATUS: Record<string, number> = {
    "Ride not found": 404,
    "Rider not found": 404,
    "Estimate not found": 404,
    "Driver is blocked": 403,
    "Insufficient funds": 402,
    "Ride already cancelled": 409,
    "Rider already has a pending ride": 409,
    "Estimate already used": 409,
    "Estimate expired": 410,
};

export function createApp(
    bookRide: BookRideUsecase,
    cancelRide: CancelRideUsecase,
    rideHistory: GetRideHistoryUsecase,
    estimateRide: EstimateRideUsecase,
    bookFromEstimate: BookRideFromEstimateUsecase,
) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get("/", (_req, res) => {
        res.status(200).json({
            book: "POST /rides",
            estimate: "POST /rides/estimate",
            bookFromEstimate: "POST /rides/book",
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

    app.post("/rides/estimate", async (req, res, next) => {
        try {
            const { riderId, from, to, isUberX } = req.body;
            if (!from || !to) {
                res.status(400).json({ error: "from and to are required" });
                return;
            }
            const estimate = await estimateRide.execute(String(riderId), String(from), String(to), Boolean(isUberX));
            res.status(200).json(estimate);
        } catch (error) {
            next(error);
        }
    });

    app.post("/rides/book", async (req, res, next) => {
        try {
            const ride = await bookFromEstimate.execute(String(req.body.token), req.body.driverId);
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
        const status = ERROR_STATUS[message] ?? 500;
        res.status(status).json({ error: message });
    });

    return app;
}
