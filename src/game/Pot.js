/*Copyright (C) 2019-2022 The Xanado Project https://github.com/cdot/Xanado
  License MIT. See README.md at the root of this distribution for full copyright
  and license information. Author Crawford Currie http://c-dot.co.uk*/

import { stringify } from "../common/Utils.js";
import { Surface } from "./Surface.js";

/**
 * A Rack is a set of tiles that a player can play from. It's
 * a 1D array of Square; a 1-column {@linkcode Surface}
 */
class Pot extends Surface {
  // Note that we do NOT use the field syntax for the fields that
  // are serialised. If we do that, then the constructor blows the
  // field away when loading using CBOR.

  /**
   * @param {object.<string,class>} factory object mapping class name to a class
   * @param {Pot|object} spec specification of the Pot, or a Pot to copy
   * @param {string|Pot} spec.id unique id for this Pot, or a Pot to copy.
   * The squares and the tiles they carry will be copied as well.
   * @param {number} spec.size Pot size
   * @param {string?} spec.underlay text string with one character for
   * each cell in UI of the Pot. This is the SWAP string that
   * underlies the swap Pot.
   */
  constructor(factory, spec) {
    // The id will be used as the base for generating the id's
    // for the Squares in the underlying Surface. Note that
    // the UI will have Pot objects for the player Pot and
    // the swap Pot, but will also have Pots that have no UI
    // for the other players. The ID for these Pots must be
    // player specific.
    if (spec instanceof Pot) {
      // Copy constructor
      // Only used in game simulation. Underlay not supported.
      super(factory, {
        id: spec.id,
        cols: spec.cols,
        rows: 1,
        type: () => "_",
      });
      spec.forEachTiledSquare((square) => {
        this.addTile(new factory.Tile(square.tile));
        return false;
      });
    } else {
      super(factory, {
        id: spec.id,
        cols: spec.size,
        rows: 1,
        type: () => "_",
      });
    }
  }

  /**
   * Add a Tile to the Pot
   * @param {Tile} tile the Tile to add, must != null
   * @return {Square?} the square where the tile was placed
   * (undefined if it couldn't be placed)
   */
  addTile(tile) {
    let potSquare;
    this.forEachEmptySquare((square) => {
      potSquare = square;
      square.placeTile(tile);
      return true;
    });
    return potSquare;
  }

  /**
   * Put tiles back in the Pot.
   * @param {Tile[]} tiles list of tiles
   * @return {Square[]} squares the tiles were placed on
   */
  addTiles(tiles) {
    return tiles.map((tile) => this.addTile(tile));
  }

  /**
   * Get an unsorted list of the letters currently in the Pot.
   * @return {string[]}
   */
  letters() {
    return this.tiles().map((tile) => tile.letter);
  }

  /**
   * Find the Square that contains a Tile that can represent
   * the given letter.
   * @param {string} letter the letter to find
   * @return {Square} carrying a matching tile, or undefined
   */
  findSquare(letter) {
    let square;
    this.forEachTiledSquare((sq) => {
      if (sq.tile.letter === letter) square = sq;
    });

    return square;
  }

  /**
   * Find and remove a tile from the Pot.
   * @param {Tile?} remove if defined, the tile removed must match
   * this tile. If undefined, any tile can be removed.
   * @return {Tile} the removed tile
   */
  removeTile(remove) {
    const letter = remove.letter;
    const square = this.findSquare(letter);
    if (!square) throw Error(`Cannot find '${letter}' on ${this.stringify()}`);
    const tile = square.tile;
    square.unplaceTile();
    return tile;
  }

  /**
   * Take tiles out of the Pot
   * @param {Tile[]} tiles list of tiles
   * @param {Pot} pot Pot
   * @return {Tile[]} list of tiles removed
   */
  removeTiles(tiles) {
    const racked = [];
    for (const tile of tiles) {
      const removed = this.removeTile(tile);
      if (!removed) throw Error(`${stringify(tile)} missing from pot`);
      racked.push(removed);
    }
    return racked;
  }

  /**
   * Shuffle tile positions within the rack
   * @return {Pot} this
   */
  shuffle() {
    const tiles = [];
    let i;
    for (i = 0; i < this.cols; i++) {
      const square = this.at(i);
      if (square.tile) tiles.push(square.unplaceTile());
    }
    for (i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = tiles[i];
      tiles[i] = tiles[j];
      tiles[j] = temp;
    }
    this.addTiles(tiles);

    return this;
  }

  /* c8 ignore start */

  /**
   * Debug
   */
  stringify() {
    return `[${this.tiles()
      .map((t) => stringify(t))
      .join(",")}]`;
  }
  /* c8 ignore stop */
}

export { Pot };
