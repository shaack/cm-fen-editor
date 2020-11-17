import {Component} from "../../lib/cm-web-modules/app/Component.js"
import {Chessboard, COLOR, INPUT_EVENT_TYPE, MOVE_INPUT_MODE} from "../../lib/cm-chessboard/Chessboard.js"
import {MOVE_CANCELED_REASON} from "../../lib/cm-chessboard/ChessboardMoveInput.js"

export const EDIT_MODE = {
    move: "move",
    erase: "erase",
    wk: "wk", wq: "wq", wr: "wr", wb: "wb", wn: "wn", wp: "wp",
    bk: "bk", bq: "bq", br: "br", bb: "bb", bn: "bn", bp: "bp"
}

export class FenEditor extends Component {
    constructor(context, props) {
        props = Object.assign({
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            spriteUrl: "./node_modules/cm-chessboard/assets/images/chessboard-sprite.svg",
            onChange: undefined,
            cookieName: "cfe-fen" // set to null, if you don't want to persist the position
        }, props)
        super(props, {
            mode: EDIT_MODE.move,
            fen: props.fen,
            colorToPlay: COLOR.white,
            allowedCastling: ["k", "K", "q", "Q"]
        }, {
            mode: {
                callback: (value) => {
                    setTimeout(() => {
                        for (const button of this.elements.modeButtons) {
                            if (this.state.mode === button.dataset.mode) {
                                button.classList.add("active")
                            } else {
                                button.classList.remove("active")
                            }
                        }
                        this.switchMode(this.state.mode)
                    })
                }
            },
            fen: {
                dom: ".fen-input-output",
                transform: (value) => {
                    setTimeout(() => {
                        const fenParts = value.split(" ")
                        this.state.colorToPlay = fenParts[1]
                        this.chessboard.setPosition(value)
                    })
                    return value
                }
            },
            colorToPlay: {
                dom: "#colorToPlay",
                parse: (value) => {
                    this.updateFen()
                    return value
                }
            },
            allowedCastling: "input[name='castling']"
        }, {
            switchMode: (event) => {
                this.state.mode = event.target.dataset.mode
            }
        }, context)
        this.elements = {
            chessboard: context.querySelector(".chessboard"),
            modeButtons: context.querySelectorAll("button[data-mode]")
        }
        this.chessboard = new Chessboard(this.elements.chessboard, {
            position: this.props.fen,
            responsive: true,
            moveInputMode: MOVE_INPUT_MODE.dragPiece,
            sprite: {
                url: this.props.spriteUrl
            },
            style: {
                aspectRatio: 0.94
            }
        })
    }

    switchMode(toMode) {
        this.chessboard.disableMoveInput()
        this.chessboard.disableBoardClick()
        switch (toMode) {
            case EDIT_MODE.move:
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
            case EDIT_MODE.erase:
                this.chessboard.enableMoveInput((event) => {
                    if (event.type === INPUT_EVENT_TYPE.moveStart) {
                        this.chessboard.setPiece(event.square, null)
                        this.updateFen()
                    }
                    return false
                })
                break
            default: // the pieces buttons
                this.chessboard.enableBoardClick((event) => {
                    this.chessboard.setPiece(event.square, this.state.mode)
                    this.updateFen()
                })
                break
        }
    }

    updateFen() {
        setTimeout(() => {
            this.state.fen = this.chessboard.getPosition() + " " + this.state.colorToPlay + " KQkq - 0 1"
            console.log("updateFen", this.state.fen)
        })
    }
}