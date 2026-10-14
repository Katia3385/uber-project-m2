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