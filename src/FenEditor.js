/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */

import {Chessboard, PIECE} from "cm-chessboard/src/Chessboard.js"
import {Markers} from "cm-chessboard/src/extensions/markers/Markers.js"
import {Chess, FEN} from "cm-chess/src/Chess.js"
import {Cookie} from "cm-web-modules/src/cookie/Cookie.js"
import {PositionEditor} from "cm-chessboard-position-editor/src/PositionEditor.js"
import {Observed} from "cm-web-modules/src/observed/Observed.js"
import {Fen} from "cm-chess/src/Fen.js"

export class FenEditor {
    // noinspection SillyAssignmentJS
    constructor(context, props) {
        this.props = Object.assign({
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            piecesFile: "pieces/standard.svg",
            assetsUrl: "../node_modules/cm-chessboard/assets/",
            onChange: undefined,
            cookieName: "cfe-fen" // set to null, if you don't want to persist the position
        }, props)
        Object.assign(this.props, props)
        this.state = new Observed({
            fen: new Fen(this.props.fen),
            fenIsValid: true,
            // colorToPlay: COLOR.white,
            // castling: ["k", "K", "q", "Q"]
        })
        this.elements = {
            chessboardContext: context.querySelector(".chessboard"),
            fenInputOutput: context.querySelector(".fen-input-output"),
            fenSelect: context.querySelector(".fen-select"),
            colorToPlay: context.querySelector(".colo-to-play"),
            castling: {
                wk: context.querySelector(".checkbox-castle-wk"),
                wq: context.querySelector(".checkbox-castle-wq"),
                bk: context.querySelector(".checkbox-castle-bk"),
                bq: context.querySelector(".checkbox-castle-bq")
            }
        }
        this.state.addObserver(() => {
            this.onFenChanged()
        }, ["fen"])
        this.elements.fenInputOutput.addEventListener("change", (e) => {
            console.log("change input", e.target.value)
            this.state.fen.parse(e.target.value)
            // noinspection SillyAssignmentJS
            this.state.fen = this.state.fen // to trigger the observer
            e.preventDefault()
        })
        this.elements.fenSelect.addEventListener("change", (e) => {
            console.log("change select", e.target.value)
            this.state.fen.parse(e.target.value)
            // noinspection SillyAssignmentJS
            this.state.fen = this.state.fen // to trigger the observer
            e.preventDefault()
        })
        const fenFromURL = new URLSearchParams(window.location.search).get("fen")
        if (fenFromURL) {
            this.state.fen.parse(fenFromURL)
        } else if (this.props.cookieName) {
            const fromCookie = Cookie.read(this.props.cookieName)
            if (fromCookie) {
                console.log("reading from cookie", fromCookie)
                this.state.fen.parse(fromCookie)
            } else {
                this.state.fen.parse(this.props.fen)
            }
        }
        this.chessboard = new Chessboard(this.elements.chessboardContext, {
            position: FEN.empty,
            assetsUrl: this.props.assetsUrl,
            style: {
                aspectRatio: 0.94,
                pieces: {file: this.props.piecesFile}
            },
            extensions: [{
                class: PositionEditor, props: {
                    autoSpecialMoves: false,
                    onPositionChanged: (event) => {
                        this.state.fen.position = event.position
                        // noinspection SillyAssignmentJS
                        this.state.fen = this.state.fen // to trigger the observer
                    }
                }
            }, {class: Markers}],
        })
        this.chessboard.initialized.then(() => {
            this.onFenChanged()
        })

        /*
        this.state = Bind({
            fen: props.fen,
            fenValid: true,
            colorToPlay: COLOR.white,
            castling: ["k", "K", "q", "Q"]
        }, {
            fen: {
                dom: ".fen-input-output",
                transform: (value) => {
                    setTimeout(() => {
                        const fenParts = value.split(" ")
                        this.state.colorToPlay = fenParts[1]
                        this.state.castling = fenParts[2].split("")
                        this.chessboard.setPosition(value, false).then(() => {
                            this.checkAllowedCastlings()
                        })
                        if (this.props.onChange) {
                            clearTimeout(this.onChangeDebounce)
                            this.onChangeDebounce = setTimeout(() => {
                                if (this.lastChangedValue !== value) {
                                    this.props.onChange(value, this.state.fenValid)
                                    this.lastChangedValue = value
                                }
                            }, 100)
                        }
                    })
                    return value
                },
                parse: (value) => {
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
        })
*/
    }

    onFenChanged() {
        // console.log("onFenChanged", this.state.fen)
        try {
            new Chess(this.state.fen.toString())
            this.state.fenIsValid = true
        } catch (e) {
            this.state.fenIsValid = false
        }
        if (this.state.fenIsValid) {
            const fenString = this.state.fen.toString()
            this.elements.fenInputOutput.value = fenString
            this.elements.fenSelect.value = fenString
            this.chessboard.setPosition(fenString, false).then(() => {
            })
            Cookie.write(this.props.cookieName, fenString)
            if (this.props.onChange) {
                this.props.onChange({
                    fen: this.state.fen.toString()
                })
            }
            this.elements.fenInputOutput.classList.remove("is-invalid")
        } else {
            this.elements.fenInputOutput.classList.add("is-invalid")
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

    /*
        updateFen() {
            clearTimeout(this.debounceFen)
            this.debounceFen = setTimeout(() => {
                if (this.state.fenValid) {
                    const newFen = this.chessboard.getPosition() + " " +
                        this.state.colorToPlay + " " +
                        (this.state.castling.length > 0 ? this.state.castling.join("") : "-") + " - 0 1"
                    if (newFen !== this.state.fen) {
                        this.state.fen = newFen
                    }
                    if (this.props.cookieName) {
                        Cookie.write(this.props.cookieName, this.state.fen)
                    }
                }
            })
        }

     */
}
