import { Clock } from "../../../src/domain/clock";
import { Estimate } from "../../../src/domain/types";

// Horloge pilotable : les tests avancent le temps pour faire expirer une estimation
export class TestClock implements Clock {
    current = new Date("2023-06-15T12:00:00Z");

    now(): Date {
        return this.current;
    }

    advanceMinutes(minutes: number): void {
        this.current = new Date(this.current.getTime() + minutes * 60 * 1000);
    }
}

// Faux scanner de trajet : Paris -> Paris sur 10 km (prix de base 2€ + 5€ = 7€)
export class StubScanTrip {
    async execute(origin: string, destination: string) {
        return {
            distanceKm: 10,
            from: { address: origin, isInsideParis: true },
            to: { address: destination, isInsideParis: true },
        };
    }
}

export class InMemoryEstimateRepository {
    estimates: Estimate[] = [];

    async save(estimate: Estimate): Promise<Estimate> {
        const saved = { ...estimate, token: `token-${this.estimates.length + 1}`, used: false };
        this.estimates.push(saved);
        return saved;
    }

    async findByToken(token: string): Promise<Estimate | undefined> {
        return this.estimates.find((estimate) => estimate.token === token);
    }

    async markAsUsed(token: string): Promise<void> {
        const estimate = this.estimates.find((e) => e.token === token);
        if (estimate) estimate.used = true;
    }
}
