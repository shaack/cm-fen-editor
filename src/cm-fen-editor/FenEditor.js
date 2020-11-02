/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */
import {Chessboard} from "../../lib/cm-chessboard/Chessboard.js"

export class FenEditor {
    constructor(element, props = {}) {
        this.element = element
        this.props = {

        }
        Object.assign(this.props, props)
        this.elements = {
            fenInputOutput: this.element.querySelector("#fenInputOutput"),
            chessboard: this.element.querySelector(".chessboard")
        }
        this.chessboard = new Chessboard(this.elements.chessboard, {
            position: "start",
            sprite: {
                url: "./node_modules/cm-chessboard/assets/images/chessboard-sprite.svg", // pieces and markers are stored es svg in the sprite
            }
        })
    }
}