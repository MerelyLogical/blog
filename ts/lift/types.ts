export type Dir = -1 | 1;
export type Phase = 'moving' | 'stopped';
export type Place = 'waiting' | 'boarding' | 'riding' | 'leaving' | 'fading';
export type Action = 'alight' | 'board';
export type Algo = 'bounce' | 'nearest' | 'popular';

export type Move = {
    floor: number;
    dir: Dir;
    stop: boolean;
};

export type Step = {
    riders: Rider[];
    acted: boolean;
    action: Action;
    floorWait?: number;
    liftWait?: number;
    trip?: boolean;
};

export type Rider = {
    id: number;
    floor: number;
    dest: number;
    place: Place;
    spawnedAt: number;
    boardedAt?: number;
    slot?: number;
    walkUntil?: number;
    fadeAt?: number;
    removeAt?: number;
};

export type Sample = {
    time: number;
    waiting: number;
    load: number;
};

export type Event = {
    time: number;
    value: number;
};
