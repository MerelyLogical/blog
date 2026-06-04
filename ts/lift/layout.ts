import {
    CAR_H,
    CAR_W,
    EDGE,
    EXIT_RIGHT,
    FLOORS,
    GAP,
    RIDER,
    SLOT_COLS,
    SLOT_ROWS,
    SLOT_STEP_X,
    SLOT_STEP_Y,
    TOP,
    WAIT_ROWS,
} from './constants';

export const SLOTS = Array.from({ length: SLOT_ROWS }, (_, row) => (
    Array.from({ length: SLOT_COLS }, (_, col) => ({
        x: (col - (SLOT_COLS - 1) / 2) * SLOT_STEP_X,
        y: ((SLOT_ROWS - 1) / 2 - row) * SLOT_STEP_Y,
    }))
)).flat();

export function y(floor: number) {
    const progress = floor / TOP;
    return `calc(${EDGE}px + ${progress * 100}% - ${progress * EDGE * 2}px)`;
}

export function floorPos(floor: number, row: number) {
    return `calc(${y(floor)} + ${(row - (WAIT_ROWS - 1) / 2) * (RIDER + GAP)}px)`;
}

export function carLeft(space: { x: number }) {
    return `calc(50% + ${space.x}px)`;
}

export function carBottom(floor: number, space: { y: number }) {
    return `calc(${y(floor)} + ${space.y}px)`;
}

export function spaceLeft(space: { x: number }) {
    return carLeft(space);
}

export function spaceBottom(floor: number, space: { y: number }) {
    return carBottom(floor, space);
}

export function exitLeft(col: number) {
    return `calc(100% - ${EXIT_RIGHT + RIDER / 2 + col * (RIDER + GAP)}px)`;
}

export function lanePos(pos: number) {
    const row = pos % WAIT_ROWS;
    const col = Math.floor(pos / WAIT_ROWS);

    return { col, row };
}

export function bandTop(index: number) {
    return `${index * (100 / FLOORS)}%`;
}
