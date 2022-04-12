/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * License: MIT, see file 'LICENSE'
 */

const ModRator = require("modrator/src/ModRator.js")
const modrator = new ModRator(__dirname)

modrator.addToLibrary("cm-web-modules")
modrator.addToLibrary("cm-chessboard")
modrator.addToLibrary("cm-chess")
modrator.addToLibrary("chess.mjs")
modrator.addToLibrary("bind.mjs")
modrator.addToLibrary("cm-pgn")
