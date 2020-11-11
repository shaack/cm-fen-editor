/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */
import {Chessboard, PIECE, INPUT_EVENT_TYPE, MOVE_INPUT_MODE} from "../../lib/cm-chessboard/Chessboard.js"
import {MOVE_CANCELED_REASON} from "../../lib/cm-chessboard/ChessboardMoveInput.js"
import {Cookie} from "../../lib/cm-web-modules/cookie/Cookie.js"
import {Chess} from "../../lib/cm-chess/Chess.js"

export const STATE = {
    move: "move",
    erase: "erase",
    wk: "wk", wq: "wq", wr: "wr", wb: "wb", wn: "wn", wp: "wp",
    bk: "bk", bq: "bq", br: "br", bb: "bb", bn: "bn", bp: "bp"
}

// TODO separate FenEditorState and FenEditorView in different classes
export class FenEditor {
    constructor(element, props = {}) {
        this.element = element
        this.props = {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            spriteUrl: "./node_modules/cm-chessboard/assets/images/chessboard-sprite.svg",
            onChange: undefined,
            cookieName: "cfe-fen" // set to null, if you don't want to persist the position
        }
        this.valid = true
        Object.assign(this.props, props)
        this.elements = {
            fenInputOutput: this.element.querySelector("#fenInputOutput"),
            positionSelect: this.element.querySelector("select#positionSetUp"),
            chessboard: this.element.querySelector(".chessboard"),
            stateButtons: this.element.querySelectorAll("button[data-state]"),
            colorSelect: this.element.querySelector("select#nextMove"),
            castlingCheckboxes: this.element.querySelectorAll("input[type='checkbox']"),
            inputs: this.element.querySelectorAll(".conditions-inputs select, input")
        }
        this.chessboard = new Chessboard(this.elements.chessboard, {
            position: this.props.fen,
            responsive: true,
            moveInputMode: MOVE_INPUT_MODE.dragPiece,
            sprite: {
                url: this.props.spriteUrl,
            },
            style: {
                aspectRatio: 0.94
            }
        })
        this.state = undefined
        this.setState(STATE.move)
        for (const button of this.elements.stateButtons) {
            button.addEventListener("click", () => {
                this.setState(STATE[button.dataset.state])
            })
        }
        for (const input of this.elements.inputs) {
            input.addEventListener("change", () => {
                this.updateFen()
            })
        }
        this.elements.fenInputOutput.addEventListener("input", () => {
            this.inputChanged()
        })
        this.elements.positionSelect.addEventListener("input", () => {
            if (this.elements.positionSelect.value) {
                this.elements.fenInputOutput.value = this.elements.positionSelect.value
                this.inputChanged()
                this.updateFen()
            }
        })
        setTimeout(() => {
            if (window.location.hash) {
                this.elements.fenInputOutput.value = decodeURIComponent(window.location.hash.substr(1))
            } else if (this.props.cookieName) {
                const fromCookie = Cookie.read(this.props.cookieName)
                if (fromCookie) {
                    this.elements.fenInputOutput.value = fromCookie
                } else {
                    this.elements.fenInputOutput.value = this.props.fen
                }
            } else {
                this.elements.fenInputOutput.value = this.props.fen
            }
            this.inputChanged()
        })

    }

    setState(newState) {
        this.element.dataset.state = newState
        if (this.state !== newState) {
            const previousState = this.state
            this.state = newState
            this.action(previousState, newState)
            this.updateButtons()
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
                    } else if (event.type === INPUT_EVENT_TYPE.moveCanceled && event.reason === MOVE_CANCELED_REASON.movedOutOfBoard) {
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
            let fen = this.chessboard.getPosition() + " " + this.elements.colorSelect.value
            let castling = ""
            // check for castling possible
            let castleWk = true
            let castleWq = true
            let castleBk = true
            let castleBq = true
            if (this.chessboard.getPiece("e1") !== PIECE.wk) {
                castleWk = false
                castleWq = false
            }
            if (this.chessboard.getPiece("h1") !== PIECE.wr) {
                castleWk = false
            }
            if (this.chessboard.getPiece("a1") !== PIECE.wr) {
                castleWq = false
            }
            if (this.chessboard.getPiece("e8") !== PIECE.bk) {
                castleBk = false
                castleBq = false
            }
            if (this.chessboard.getPiece("h8") !== PIECE.br) {
                castleBk = false
            }
            if (this.chessboard.getPiece("a8") !== PIECE.br) {
                castleBq = false
            }
            const $cwk = $("#castle-wk")
            const $cwq = $("#castle-wq")
            const $cbk = $("#castle-bk")
            const $cbq = $("#castle-bq")
            $cwk.prop("disabled", !castleWk)
            if(!castleWk) {
                $cwk.prop("checked", castleWk)
            }
            $cwq.prop("disabled", !castleWq)
            if(!castleWq) {
                $cwq.prop("checked", castleWq)
            }
            $cbk.prop("disabled", !castleBk)
            if(!castleBk) {
                $cbk.prop("checked", castleBk)
            }
            $cbq.prop("disabled", !castleBq)
            if(!castleBq) {
                $cbq.prop("checked", castleBq)
            }
            for (const castlingCheckbox of this.elements.castlingCheckboxes) {
                if (castlingCheckbox.checked) {
                    castling += castlingCheckbox.value
                }
            }
            if (castling === "") {
                castling = "-"
            }
            fen = fen + " " + castling + " - 0 1"
            if (fen !== this.elements.fenInputOutput.value) {
                this.elements.fenInputOutput.value = fen
                this.elements.positionSelect.value = fen
                this.onChange(fen)
            }
        })
    }

    inputChanged() {
        const fen = this.elements.fenInputOutput.value
        // validate
        try {
            new Chess(fen)
            this.elements.fenInputOutput.classList.remove("is-invalid")
            this.elements.fenInputOutput.classList.remove("text-danger")
            this.valid = true
        } catch(e) {
            this.elements.fenInputOutput.classList.add("is-invalid")
            this.elements.fenInputOutput.classList.add("text-danger")
            this.valid = false
        }
        const fenParts = fen.split(" ")
        this.chessboard.setPosition(fenParts[0], false)
        if (fenParts[1]) {
            this.elements.colorSelect.value = fenParts[1]
        }
        if (fenParts[2]) {
            for (const castlingCheckbox of this.elements.castlingCheckboxes) {
                castlingCheckbox.checked = fenParts[2].indexOf(castlingCheckbox.value) !== -1
            }
        }
        this.elements.positionSelect.value = fen
        this.onChange(fen)
    }

    updateButtons() {
        for (const button of this.elements.stateButtons) {
            const state = button.getAttribute("data-state")
            if (this.state === STATE[state]) {
                button.classList.add("active")
            } else {
                button.classList.remove("active")
            }
        }
    }

    onChange(fen) {
        if (fen !== this.props.fen) {
            history.replaceState("", document.title, window.location.pathname + "#" + fen)
        } else {
            history.replaceState("", document.title, window.location.pathname)
        }
        if (this.props.cookieName) {
            Cookie.write(this.props.cookieName, fen)
        }
        if (this.props.onChange) {
            this.props.onChange(fen, this.valid)
        }
    }

    fen() {
        return this.elements.fenInputOutput.value
    }
}