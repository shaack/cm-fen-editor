/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * License: MIT, see file 'LICENSE'
 */

const LibraryManager = require("cm-web-modules/src/LibraryManager.js")
const manager = new LibraryManager(__dirname)

manager.addPackage("cm-web-modules")
manager.addPackage("cm-chessboard")
manager.addPackage("cm-chess")
manager.addPackage("chess.mjs")
manager.addPackage("cm-pgn")
