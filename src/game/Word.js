/*Copyright (C) 2019-2022 The Xanado Project https://github.com/cdot/Xanado
  License MIT. See README.md at the root of this distribution for full copyright
  and license information. Author Crawford Currie http://c-dot.co.uk*/

import { stringify } from "../common/Utils.js";
import { Surface } from "./Surface.js";

/**
 * A Word is a word, owned by a Player. It's
 * a 1D array of Square; a 1-column {@linkcode Surface}
 */
class Word extends Surface {
  // Note that we do NOT use the field syntax for the fields that
  // are serialised. If we do that, then the constructor blows the
  // field away when loading using CBOR.

  /**
   * @param {object.<string,class>} factory object mapping class name to a class
   * @param {Word|object} spec specification of the word, or a word to copy
   * @param {string|Word} spec.id unique id for this word, or a word to copy.
   * The squares and the tiles they carry will be copied as well.
   * @param {number} spec.size word size
   * @param {string?} spec.underlay text string with one character for
   * each cell in UI of the word. This is the SWAP string that
   * underlies the swap word.
   */
  constructor(factory, spec) {
    // The id will be used as the base for generating the id's
    // for the Squares in the underlying Surface. Note that
    // the UI will have Word objects for the player word and
    // the swap word, but will also have words that have no UI
    // for the other players. The ID for these words must be
    // player specific.
    if (spec instanceof Word) {
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

    if (typeof spec.underlay !== "undefined") {
      let idx = 0;
      this.forEachSquare((square) => {
        square.setUnderlay(spec.underlay.charAt(idx++));
        return idx === spec.underlay.length;
      });
    }
  }

  /**
   * Add a Tile to the word
   * @param {Tile} tile the Tile to add, must != null
   * @return {Square?} the square where the tile was placed
   * (undefined if it couldn't be placed)
   */
  addTile(tile) {
    let wordSquare;
    this.forEachEmptySquare((square) => {
      wordSquare = square;
      square.placeTile(tile);
      return true;
    });
    return wordSquare;
  }

  /**
   * Put tiles back on the word.
   * @param {Tile[]} tiles list of tiles
   * @return {Square[]} squares the tiles were placed on
   */
  addTiles(tiles) {
    return tiles.map((tile) => this.addTile(tile));
  }

  /**
   * Get an unsorted list of the letters currently on the word.
   * Blanks are represented by a space.
   * @return {string[]}
   */
  letters() {
    return this.tiles().map((tile) => tile.letter);
  }

  /**
   * Find the Square that contains a Tile that can represent
   * the given letter.
   * If a letter tile can't be found, a blank will be used if there
   * is one.
   * @param {string} letter the letter to find
   * @return {Square} carrying a matching tile, or undefined
   */
  findSquare(letter) {
    let square;
    this.forEachTiledSquare((sq) => {
      if ((!square && sq.tile.isBlank) || sq.tile.letter === letter)
        square = sq;
    });

    return square;
  }

  /**
   * Find and remove a tile from the word.
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
    if (tile.isBlank) tile.letter = letter;
    return tile;
  }

  /**
   * Take tiles out of the word
   * @param {Tile[]} tiles list of tiles
   * @param {Word} word word
   * @return {Tile[]} list of tiles removed
   */
  removeTiles(tiles) {
    const racked = [];
    for (const tile of tiles) {
      const removed = this.removeTile(tile);
      if (!removed) throw Error(`${stringify(tile)} missing from rack`);
      racked.push(removed);
    }
    return racked;
  }

  /* c8 ignore start */

  /**
   * Debug
   */
  stringify() {
    return `[${this.tiles()
      .map((t) => stringify(t))
      .join("")}]`;
  }
  /* c8 ignore stop */
}

export { Word };
