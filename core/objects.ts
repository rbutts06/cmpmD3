import type { Cell } from "./mod.ts";
import { isPassable, noise, terrainAt } from "./mod.ts";

export type Gatherable = {
  name: string;
  amount: number;
  icon: `./assets/${string}`;
};

const rat: Gatherable = { name: "rat", amount: 1, icon: "./assets/rat.png" };

// deno-lint-ignore no-unused-vars
const rodentia: Gatherable = {
  name: "rodentia",
  amount: 1,
  icon: "./assets/rodentia.png",
};

interface objectTable {
  object: Gatherable;
  x: number;
  y: number;
}

export const objectPos: objectTable[] = [];

export function createObjectPositions(seed: number) {
  for (let xPos = -100; xPos < 100; xPos++) {
    for (let yPos = -100; yPos < 100; yPos++) {
      if (
        isPassable(terrainAt(seed, xPos, yPos)) &&
        hasGatherable(seed, xPos, yPos)
      ) {
        const { x, y }: Cell = cellCenter({ x: xPos, y: yPos });
        objectPos.push(
          {
            object: rat,
            x: x,
            y: y,
          },
        );
      }
    }
  }
}

const SPAWN_CHANCE_RANGE = {
  high: 0.7,
  low: 0.69,
};

export function hasGatherable(
  seed: number,
  x: number,
  y: number,
): boolean {
  const raw = noise(seed, x, y, 3);
  return (raw <= SPAWN_CHANCE_RANGE.high && raw >= SPAWN_CHANCE_RANGE.low);
}

export function itemAt(
  seed: number,
  xPos: number,
  yPos: number,
): Gatherable | null {
  if (hasGatherable(seed, xPos, yPos) == false) return (null);

  const { x, y }: Cell = cellCenter({ x: xPos, y: yPos });

  for (let i = 0; i < objectPos.length; i++) {
    const item = objectPos[i];
    if (item.x == x && item.y == y) {
      return item.object;
    }
  }

  return (null);
}

export function cellCenter({ x, y }: Cell): Cell {
  return {
    x: x * 32 + 32 / 2,
    y: y * 32 + 32 / 2,
  };
}

export function destroy(item: Gatherable, cell: Cell) {
  const index = objectPos.findIndex((object) =>
    object.x === cell.x && object.y === cell.y && object.object === item
  );
  if (index !== -1) {
    objectPos.splice(index, 1);
  }
}
