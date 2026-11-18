// The only folder allowed to import Phaser, and for one job: drawing the grid.
// Input, the HUD, sound, and the order of events all live outside it.
import Phaser from "phaser";
import type {
  Cell,
  GameEvent,
  GameState,
  Gatherable,
  Terrain,
} from "../../core/mod.ts";
import {
  cheeseTree,
  createObjectPositions,
  inventoryAdd,
  objectPos,
  rat,
  rodentia,
  terrainAt,
} from "../../core/mod.ts";
export const CELL_SIZE = 32;
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;
const WALK_MS = 120;
const BUMP_MS = 60;

const _TERRAIN_COLORS: Record<Terrain, number> = {
  "grass": 0xada639,
  "cheese forest": 0x0dde83, // Was getting a weird error here about cheese forest not existing. I think it was mad that the rest weren't also strings
  "water": 0xfabf2a,
  "rock": 0x6e6a66,
};

const TERRAIN_TEXTURES: Record<Terrain, string> = {
  "grass": "grass",
  "cheese forest": "cheeseForest",
  "water": "cheeseRiver",
  "rock": "blueCheese",
};

import grassUrl from "../../assets/grass.png";
import cheeseFURL from "../../assets/cheeseForest.png";
import waterURL from "../../assets/cheeseRiver.png";
import rockURL from "../../assets/blueCheese.png";
import ratURL from "../../assets/rat.png";
import rodentiaURL from "../../assets/rodentia.png";
import treeURL from "../../assets/cheeseTree.png";
import playerURL from "../../assets/player.png";

const ASSET_URLS = {
  grass: grassUrl,
  cheeseForest: cheeseFURL,
  cheeseRiver: waterURL,
  blueCheese: rockURL,
  rat: ratURL,
  rodentia: rodentiaURL,
  cheeseTree: treeURL,
  player: playerURL,
};

// Enough cells to cover the view, plus a margin so that the camera can lag behind
// the player without showing an unpainted edge.
const CELLS_ACROSS = 16;
const CELLS_DOWN = 13;

export function cellCenter({ x, y }: Cell): Cell {
  return {
    x: x * CELL_SIZE + CELL_SIZE / 2,
    y: y * CELL_SIZE + CELL_SIZE / 2,
  };
}

const items: Gatherable[] = [rat, cheeseTree, rodentia];
// One output of the presenter. It shows events; it decides nothing.
// Humble Object: http://xunitpatterns.com/Humble%20Object.html
export class GridView extends Phaser.Scene {
  private readonly seed: number;
  private readonly start: Cell;
  private readonly startState: GameState;
  private ground!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Image;

  constructor(state: GameState) {
    super("grid");
    this.seed = state.seed;
    this.start = { ...state.player };
    this.startState = state;
  }
  preload(): void {
    for (const [name, url] of Object.entries(ASSET_URLS)) {
      this.load.image(name, url);
    }
  }

  create() {
    this.ground = this.add.graphics();
    const { x, y } = cellCenter(this.start);
    this.marker = this.add.image(x, y, "player");
    this.cameras.main.startFollow(this.marker, true, 0.2, 0.2);
    createObjectPositions(this.seed, items);
    this.drawCellsAround(this.start, this.startState);
    this.fitToDisplay();
  }

  // Phaser has no device-pixel setting of its own. So the canvas backing store is
  // CSS size times devicePixelRatio, the CSS size stays put, and a camera zoom lets
  // all drawing stay in logical pixels. The media query fires when the ratio changes:
  // a move to another monitor, or browser zoom. The view's CSS size is fixed, so plain
  // window resizes need nothing here.
  private fitToDisplay() {
    const ratio = globalThis.devicePixelRatio || 1;
    this.scale.resize(
      Math.round(VIEW_WIDTH * ratio),
      Math.round(VIEW_HEIGHT * ratio),
    );
    this.scale.canvas.style.width = `${VIEW_WIDTH}px`;
    this.scale.canvas.style.height = `${VIEW_HEIGHT}px`;
    this.cameras.main.setZoom(ratio);
    matchMedia(`(resolution: ${ratio}dppx)`).addEventListener(
      "change",
      () => this.fitToDisplay(),
      { once: true },
    );
  }

  show(event: GameEvent): Promise<void> {
    switch (event.type) {
      case "moved":
        this.drawCellsAround(event.to, event.state);
        return this.walk(event.to);
      case "blocked":
        return this.bump(event.at, event.toward);
      case "gathered":
        return this.collect(event.at, event.item, event.state);
      default:
        // A new event type fails to type-check here until it has a presentation.
        event satisfies never;
        return Promise.resolve();
    }
  }

  private walk(to: Cell): Promise<void> {
    return new Promise((done) => {
      this.tweens.add({
        targets: this.marker,
        ...cellCenter(to),
        duration: WALK_MS,
        onComplete: () => done(),
      });
    });
  }

  private collect(
    at: Cell,
    item: Gatherable,
    state: GameState,
  ): Promise<void> {
    return new Promise((done) => {
      inventoryAdd(state, item);
      destroy(item, at);
      console.log(`gathered \"${item.name}\" at: (${at.x}, ${at.y})`);
      done();
    });
  }

  // Lurch part of the way toward the blocked cell, flash, and come back.
  private bump(at: Cell, toward: Cell): Promise<void> {
    const start = cellCenter(at);
    const target = cellCenter(toward);
    //this.marker.setFillStyle(BUMP_COLOR);
    return new Promise((done) => {
      this.tweens.add({
        targets: this.marker,
        x: start.x + (target.x - start.x) * 0.3,
        y: start.y + (target.y - start.y) * 0.3,
        duration: BUMP_MS,
        yoyo: true,
        onComplete: () => done(),
      });
    });
  }

  private *cellsNearby({ x: centerX, y: centerY }: Cell) {
    for (let y = centerY - CELLS_DOWN; y <= centerY + CELLS_DOWN; y++) {
      for (let x = centerX - CELLS_ACROSS; x <= centerX + CELLS_ACROSS; x++) {
        yield { x, y };
      }
    }
  }

  // Paint only what is near the camera. Asking the core again costs little, and
  // the world itself is never stored.
  private drawCellsAround(cell: Cell, state: GameState) {
    this.ground.clear();

    const oldGatherables = this.children.list.filter((child) =>
      child.name === "gatherable"
    );
    for (const gatherable of oldGatherables) {
      gatherable.destroy();
    }

    for (const object of objectPos) {
      const checkString = "x:" + object.x + ",y:" + object.y;
      if (!state.gatheredCells.includes(checkString)) {
        const image = this.add.image(object.x, object.y, object.object.name);
        image.setName("gatherable");
      }
    }

    const oldGroundTiles = this.children.list.filter((child) =>
      child.name === "groundTile"
    );
    for (const tile of oldGroundTiles) {
      tile.destroy();
    }

    for (const { x, y } of this.cellsNearby(cell)) {
      /*
        this.ground.fillStyle(TERRAIN_COLORS[terrainAt(this.seed, x, y)]);

        this.ground.fillRect(
          x * CELL_SIZE,
          y * CELL_SIZE,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );
        */

      const groundTile = this.add.image(
        x * CELL_SIZE + CELL_SIZE / 2,
        y * CELL_SIZE + CELL_SIZE / 2,
        TERRAIN_TEXTURES[terrainAt(this.seed, x, y)],
      );

      groundTile.setName("groundTile");

      //if we want to change the tints of the tiles, we can use this line
      //groundTile.setTint(TERRAIN_COLORS[terrainAt(this.seed, x, y)]);
      groundTile.setDepth(-1);
      const tileMask = this.ground.createGeometryMask();

      groundTile.setMask(tileMask);
    }
  }
}

export function destroy(item: Gatherable, cell: Cell) {
  const index = objectPos.findIndex((object) =>
    object.x === cell.x && object.y === cell.y && object.object === item
  );
  if (index !== -1) {
    objectPos.splice(index, 1);
  }
}

// Resolves once Phaser has booted and the scene exists. Phaser's input and audio
// are off: this project only asks it to draw.
export function startGridView(
  parent: HTMLElement,
  state: GameState,
): Promise<GridView> {
  return new Promise((ready) => {
    const view = new GridView(state);
    new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      backgroundColor: "#14161a",
      banner: false,
      audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      scene: view,
      callbacks: {
        postBoot: () => ready(view),
      },
    });
  });
}
