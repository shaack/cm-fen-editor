/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */
import {Chessboard} from "../../lib/cm-chessboard/Chessboard.js"
import {SubstitutionBench} from "./SubstitutionBench.js"

export class FenEditor {
    constructor(element, chessboard, props = {}) {
        this.element = element
        this.chessboard = chessboard
        this.props = {

        }
        Object.assign(this.props, props)
        this.elements = {
            fenInputOutput: this.element.querySelector("#fenInputOutput"),
            chessboard: this.element.querySelector(".chessboard"),
            substitutionBench: this.element.querySelector(".substitution-bench")
        }
        this.chessboard = new Chessboard(this.elements.chessboard, {
            position: "start",
            responsive: true,
            sprite: {
                url: "./node_modules/cm-chessboard/assets/images/chessboard-sprite.svg", // pieces and markers are stored es svg in the sprite
            },
            style: {
                aspectRatio: 0.94
            }
        }, () => {
            this.substitutionBench = new SubstitutionBench(this.elements.substitutionBench, {
                sprite: this.chessboard.props.sprite
            })
        })
    }
}