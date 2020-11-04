/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */
import {Chessboard} from "../../lib/cm-chessboard/Chessboard.js"

export const STATE = {
    move: "move",
    duplicate: "duplicate",
    erase: "erase",
    wk: "wk", wq: "wq", wr: "wr", wb: "wb", wn: "wn", wp: "wp",
    bk: "bk", bq: "bq", br: "br", bb: "bb", bn: "bn", bp: "bp"
}

export class FenEditor {
    constructor(element, chessboard, props = {}) {
        this.element = element
        this.chessboard = chessboard
        this.props = {}
        Object.assign(this.props, props)
        this.elements = {
            fenInputOutput: this.element.querySelector("#fenInputOutput"),
            chessboard: this.element.querySelector(".chessboard"),
            buttons: this.element.querySelectorAll("button")
        }
        this.state = undefined
        this.setState(STATE.move)
        for (const button of this.elements.buttons) {
            button.addEventListener("click", () => {
                this.setState(STATE[button.dataset.state])
            })
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
        })
    }

    setState(newState) {
        console.log("setState", this.state, newState)
        const previousState = this.state
        this.state = newState
        this.action(previousState, newState)
        this.updateUserInterface()
    }

    action(fromState, toState) {
        switch(toState) {
            case STATE.move:
                break
        }
    }

    updateUserInterface() {
        for (const button of this.elements.buttons) {
            const state = button.getAttribute("data-state")
            if(this.state === STATE[state]) {
                button.classList.add("active")
            } else {
                button.classList.remove("active")
            }
        }
    }
}