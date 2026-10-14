export type Location = {
    address: string;
    isInsideParis: boolean;
};

export type Rider = {
    id?: string;
    name: string;
    balance: number;
    birthday: string;
};

export type Driver = {
    id?: string;
    name: string;
    isAvailable: boolean;
    currentLocation?: string;
};
export type Ride = {
    id?: string;
    riderId: string;
    driverId?: string;
    status: string;
    price: number;
    penalty: number;
    isDriverOnTheWay: boolean;
};