export type Gatherable = "rat" | "rodentia";

interface objectTable {
  object: string;
  x: number;
  y: number;
}

export const objectPos: objectTable[] = [{
  object: "rat",
  x: 49,
  y: 49,
}, {
  object: "rat",
  x: 80,
  y: 80,
}];

/*export function collide({ x, y }: position) {
  //if object on x, y return true
}*/
