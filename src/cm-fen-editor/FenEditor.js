/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */
import {Chessboard, INPUT_EVENT_TYPE, MOVE_INPUT_MODE} from "../../lib/cm-chessboard/Chessboard.js"

export const STATE = {
    move: "move",
    erase: "erase",
    wk: "wk", wq: "wq", wr: "wr", wb: "wb", wn: "wn", wp: "wp",
    bk: "bk", bq: "bq", br: "br", bb: "bb", bn: "bn", bp: "bp"
}

export class FenEditor {
    constructor(element, props = {}) {
        this.element = element
        this.props = {}
        Object.assign(this.props, props)
        this.elements = {
            fenInputOutput: this.element.querySelector("#fenInputOutput"),
            chessboard: this.element.querySelector(".chessboard"),
            buttons: this.element.querySelectorAll("button")
        }
        this.state = undefined
        this.chessboard = new Chessboard(this.elements.chessboard, {
            position: "start",
            responsive: true,
            moveInputMode: MOVE_INPUT_MODE.dragPiece,
            sprite: {
                url: "./node_modules/cm-chessboard/assets/images/chessboard-sprite.svg", // pieces and markers are stored es svg in the sprite
            },
            style: {
                aspectRatio: 0.94
            }
        })
        this.setState(STATE.move)
        for (const button of this.elements.buttons) {
            button.addEventListener("click", () => {
                this.setState(STATE[button.dataset.state])
            })
        }
    }

    setState(newState) {
        console.log("setState", this.state, newState)
        this.element.dataset.state = newState
        if (this.state !== newState) {
            const previousState = this.state
            this.state = newState
            this.action(previousState, newState)
            this.updateButtons()
            this.updateFen()
        }
    }

    action(fromState, toState) {
        this.chessboard.disableMoveInput()
        this.chessboard.disableBoardClick()
        switch (toState) {
            case STATE.move:
                this.chessboard.enableMoveInput((event) => {
                    if (event.type === INPUT_EVENT_TYPE.moveStart) {
                        this.moveStartEvent = event
                        this.moveStartEvent.piece = this.chessboard.getPiece(event.square)
                    } else if (event.type === INPUT_EVENT_TYPE.moveCanceled) {
                        this.chessboard.setPiece(this.moveStartEvent.square, null)
                    }
                    this.updateFen()
                    return true
                })
                break
            case STATE.erase:
                this.chessboard.enableMoveInput((event) => {
                    if (event.type === INPUT_EVENT_TYPE.moveStart) {
                        this.chessboard.setPiece(event.square, null)
                        this.updateFen()
                    }
                    return false
                })
                break
            default:
                // the pieces buttons
                this.chessboard.enableBoardClick((event) => {
                    this.chessboard.setPiece(event.square, this.state)
                    this.updateFen()
                })
                break
        }
    }

    updateFen() {
        setTimeout(() => {
            this.elements.fenInputOutput.value = this.chessboard.getPosition()
        })
    }

    updateButtons() {
        for (const button of this.elements.buttons) {
            const state = button.getAttribute("data-state")
            if (this.state === STATE[state]) {
                button.classList.add("active")
            } else {
                button.classList.remove("active")
            }
        }
    }
}