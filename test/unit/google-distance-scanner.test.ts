import { describe, expect, it } from "vitest";
import { GoogleDistanceScanner, createGoogleDistanceScanner } from "../../src/infra/google-distance-scanner";

class FakeRoutes {
    apiKey = "";

    async post(_url: string, init: { headers: Record<string, string> }) {
        this.apiKey = init.headers["X-Goog-Api-Key"];
        return {
            ok: true,
            async json() {
                return [{ distanceMeters: 2500, condition: "ROUTE_EXISTS" }];
            },
        };
    }
}

class FakeGoogleClient {
    async geocode() {
        return {
            data: {
                results: [
                    {
                        address_components: [
                            { long_name: "Paris", types: ["locality", "political"] },
                        ],
                    },
                ],
            },
        };
    }
}

describe("GoogleDistanceScanner", () => {
    it("should turn Google meters into kilometers and read the city", async () => {
        const client = new FakeGoogleClient();
        const routes = new FakeRoutes();
        const scanner = new GoogleDistanceScanner(client as never, "test-key", routes);

        const distanceKm = await scanner.distanceKm("Tour Eiffel", "Louvre");
        const city = await scanner.cityOf("Tour Eiffel");

        expect(distanceKm).toBe(2.5);
        expect(city).toBe("Paris");
        expect(routes.apiKey).toBe("test-key");
    });

    it("should refuse to start when the API key is missing", () => {
        const previous = process.env.GOOGLE_MAPS_API_KEY;
        delete process.env.GOOGLE_MAPS_API_KEY;

        expect(() => createGoogleDistanceScanner()).toThrow("GOOGLE_MAPS_API_KEY is missing");

        if (previous !== undefined) {
            process.env.GOOGLE_MAPS_API_KEY = previous;
        }
    });
});
