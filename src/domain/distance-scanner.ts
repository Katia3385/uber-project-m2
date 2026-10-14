export interface DistanceScanner {
    distanceKm(origin: string, destination: string): Promise<number>;
    cityOf(address: string): Promise<string>;
}
