export type Gatherable = "rat" | "rodentia";

interface objectTable {
  object: string;
  x: number;
  y: number;
}

export const objectPos: objectTable[] = [{
  object: "rat",
  x: 32,
  y: 32,
}];

/*export function collide({ x, y }: position) {
  //if object on x, y return true
}*/
