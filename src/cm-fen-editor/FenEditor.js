import {Component} from "../../lib/cm-web-modules/app/Component.js"
import {Chessboard, COLOR, INPUT_EVENT_TYPE, MOVE_INPUT_MODE, PIECE} from "../../lib/cm-chessboard/Chessboard.js"
import {MOVE_CANCELED_REASON} from "../../lib/cm-chessboard/ChessboardMoveInput.js"
import {Chess} from "../../lib/cm-chess/Chess.js"
import {Cookie} from "../../lib/cm-web-modules/cookie/Cookie.js"

export const EDIT_MODE = {
    move: "move",
    erase: "erase",
    wk: "wk", wq: "wq", wr: "wr", wb: "wb", wn: "wn", wp: "wp",
    bk: "bk", bq: "bq", br: "br", bb: "bb", bn: "bn", bp: "bp"
}

// noinspection DuplicatedCode
export class FenEditor extends Component {
    constructor(context, props) {
        props = Object.assign({
            fen: "8/8/8/8/8/8/8/8 w - - 0 1",
            spriteUrl: "./node_modules/cm-chessboard/assets/images/chessboard-sprite.svg",
            // onChange: undefined,
            cookieName: "cfe-fen" // set to null, if you don't want to persist the position
        }, props)
        super(props, {
            mode: EDIT_MODE.move,
            fen: props.fen,
            fenValid: true,
            colorToPlay: COLOR.white,
            castling: ["k", "K", "q", "Q"]
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
                        this.state.castling = fenParts[2].split("")
                        this.chessboard.setPosition(value).then(() => {
                            this.checkAllowedCastlings()
                        })
                        // check for allowed castlings

                    })
                    return value
                },
                parse: (value) => {
                    // console.log(value)
                    try {
                        new Chess(value)
                        this.elements.fenInputOutput.classList.remove("is-invalid")
                        this.elements.fenInputOutput.classList.remove("text-danger")
                        this.state.fenValid = true
                        return value
                    } catch (e) {
                        this.elements.fenInputOutput.classList.add("is-invalid")
                        this.elements.fenInputOutput.classList.add("text-danger")
                        this.state.fenValid = false
                        return value
                    }
                }
            },
            colorToPlay: {
                dom: "#colorToPlay",
                parse: (value) => {
                    this.updateFen()
                    return value
                }
            },
            castling: {
                dom: "input[name='castling']",
                callback: (value) => {
                    setTimeout(() => {
                        this.updateFen()
                        return value
                    })
                }
            }
        }, {
            switchMode: (event) => {
                this.state.mode = event.target.dataset.mode
            }
        }, context)
        this.elements = {
            chessboard: context.querySelector(".chessboard"),
            fenInputOutput: context.querySelector("#fenInputOutput"),
            modeButtons: context.querySelectorAll("button[data-mode]")
        }

        console.log("test", window.location.hash)
        if (window.location.hash) {
            this.state.fen = decodeURIComponent(window.location.hash.substr(1))
        } else if (this.props.cookieName) {
            const fromCookie = Cookie.read(this.props.cookieName)
            if (fromCookie) {
                this.state.fen = fromCookie
            } else {
                this.state.fen = this.props.fen
            }
        } else {
            this.state.fen = this.props.fen
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

    checkAllowedCastlings() {
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
        if (!castleWk) {
            const index = this.state.castling.indexOf("K")
            console.log(index, this.state.castling)
            if (index !== -1) {
                this.state.castling.splice(index, 1)
            }
        }
        if (!castleWq) {
            const index = this.state.castling.indexOf("Q")
            if (index !== -1) {
                this.state.castling.splice(index, 1)
            }
        }
        if (!castleBk) {
            const index = this.state.castling.indexOf("k")
            if (index !== -1) {
                this.state.castling.splice(index, 1)
            }
        }
        if (!castleBq) {
            const index = this.state.castling.indexOf("q")
            if (index !== -1) {
                this.state.castling.splice(index, 1)
            }
        }
    }

    updateFen() {
        clearTimeout(this.debounceFen)
        this.debounceFen = setTimeout(() => {
            if (this.state.fenValid) {
                // console.log(this.state.allowedCastling.length)
                const newFen = this.chessboard.getPosition() + " " +
                    this.state.colorToPlay + " " +
                    (this.state.castling.length > 0 ? this.state.castling.join("") : "-") + " - 0 1"
                if (newFen !== this.state.fen) {
                    this.state.fen = newFen
                    console.log("updateFen", this.state.fen)
                }
                if (this.props.cookieName) {
                    Cookie.write(this.props.cookieName, this.state.fen)
                }
            }
        })
    }
}