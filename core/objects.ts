import type { Cell } from "./mod.ts";
import { isPassable, noise, terrainAt } from "./mod.ts";

export type Gatherable = {
  name: string;
  amount: number;
  icon: `./assets/${string}`;
};

/** The item placeholder for empty inventory slots */
export const EMPTY_ITEM: Gatherable = {
  name: "Empty",
  icon: "./assets/blank.png",
  amount: -1,
};

export const rat: Gatherable = {
  name: "rat",
  amount: 1,
  icon: "./assets/rat.png",
};
export const cheeseTree: Gatherable = {
  name: "cheeseTree",
  amount: 1,
  icon: "./assets/cheeseTree.png",
};

export const rodentia: Gatherable = {
  name: "rodentia",
  amount: 1,
  icon: "./assets/rodentia.png",
};
export const bread: Gatherable = {
  name: "bread",
  amount: 1,
  icon: "./assets/bread.png",
};
export const tomato: Gatherable = {
  name: "tomato",
  amount: 1,
  icon: "./assets/tomato.png",
};
export const cheeseItem: Gatherable = {
  name: "cheese",
  amount: 1,
  icon: "./assets/cheese.png",
};
export const ratvioliItem: Gatherable = {
  name: "ratvioli",
  amount: 1,
  icon: "./assets/ratvioli.png",
};
export const ratPotionItem: Gatherable = {
  name: "ratPotion",
  amount: 1,
  icon: "./assets/ratPotion.png",
};
export const ratBurgerItem: Gatherable = {
  name: "ratBurger",
  amount: 1,
  icon: "./assets/ratBurger.png",
};

interface objectTable {
  object: Gatherable;
  x: number;
  y: number;
}

export const objectPos: objectTable[] = [];

export function createObjectPositions(seed: number, items: Gatherable[]) {
  let counter = 0;
  for (let xPos = -100; xPos < 100; xPos++) {
    counter++;
    for (let yPos = -100; yPos < 100; yPos++) {
      if (
        isPassable(terrainAt(seed, xPos, yPos)) &&
        hasGatherable(seed, xPos, yPos)
      ) {
        const { x, y }: Cell = cellCenter({ x: xPos, y: yPos });
        objectPos.push(
          {
            object: items[counter % items.length],
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
