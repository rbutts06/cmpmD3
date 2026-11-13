import type { Cell } from "./mod.ts";
import { isPassable, noise, terrainAt } from "./mod.ts";
export type Gatherable = "rat" | "rodentia";

interface objectTable {
  object: string;
  x: number;
  y: number;
}

export const objectPos: objectTable[] = [];

export function createObjectPositions(seed: number) {
  for (let xPos = -100; xPos < 100; xPos++) {
    for (let yPos = -100; yPos < 100; yPos++) {
      if (
        isPassable(terrainAt(seed, xPos, yPos)) && noise(seed, xPos, yPos, 3) &&
        Math.random() * 100 > 99
      ) {
        const { x, y }: Cell = cellCenter({ x: xPos, y: yPos });
        objectPos.push(
          {
            object: "rat",
            x: x,
            y: y,
          },
        );
      }
    }
  }
}

export function cellCenter({ x, y }: Cell): Cell {
  return {
    x: x * 32 + 32 / 2,
    y: y * 32 + 32 / 2,
  };
}
