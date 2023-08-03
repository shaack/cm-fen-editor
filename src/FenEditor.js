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
import {DomUtils} from "cm-web-modules/src/utils/DomUtils.js"

// noinspection SillyAssignmentJS
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
            colorToPlay: context.querySelector(".color-to-play"),
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
            this.state.fen.parse(e.target.value)
            this.state.fen = this.state.fen // to trigger the observer
        })
        this.elements.fenSelect.addEventListener("change", (e) => {
            this.state.fen.parse(e.target.value)
            this.state.fen = this.state.fen // to trigger the observer
        })
        this.elements.colorToPlay.addEventListener("change", (e) => {
            this.state.fen.colorToPlay = e.target.value
            this.state.fen = this.state.fen // to trigger the observer
        })
        DomUtils.delegate(context, "change", ".checkbox-castle", (e) => {
            if (e.target.checked) {
                this.state.fen.castlings = []
                if(this.elements.castling.wk.checked) {
                    this.state.fen.castlings.push("K")
                }
                if(this.elements.castling.wq.checked) {
                    this.state.fen.castlings.push("Q")
                }
                if(this.elements.castling.bk.checked) {
                    this.state.fen.castlings.push("k")
                }
                if(this.elements.castling.bq.checked) {
                    this.state.fen.castlings.push("q")
                }
            } else {
                this.state.fen.castlings = this.state.fen.castlings.filter((c) => c !== e.target.value)
            }
            this.state.fen = this.state.fen // to trigger the observer
        })

        const fenFromURL = new URLSearchParams(window.location.search).get("fen")
        if (fenFromURL) {
            this.state.fen.parse(fenFromURL)
        } else if (this.props.cookieName) {
            const fromCookie = Cookie.read(this.props.cookieName)
            if (fromCookie) {
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
    }

    onFenChanged() {
        try {
            new Chess(this.state.fen.toString())
            this.state.fenIsValid = true
        } catch (e) {
            this.state.fenIsValid = false
        }
        if (this.state.fenIsValid) {
            const fenString = this.state.fen.toString()
            this.elements.fenInputOutput.classList.remove("is-invalid")
            this.elements.fenInputOutput.value = fenString
            this.elements.fenSelect.value = fenString
            this.elements.colorToPlay.value = this.state.fen.colorToPlay
            this.elements.castling.wk.checked = this.state.fen.castlings.includes("K")
            this.elements.castling.wq.checked = this.state.fen.castlings.includes("Q")
            this.elements.castling.bk.checked = this.state.fen.castlings.includes("k")
            this.elements.castling.bq.checked = this.state.fen.castlings.includes("q")
            this.chessboard.setPosition(fenString, false).then(() => {
            })
            Cookie.write(this.props.cookieName, fenString)
            if (this.props.onChange) {
                this.props.onChange({
                    fen: this.state.fen.toString()
                })
            }
            this.updateAllowedCastlings()
        } else {
            this.elements.fenInputOutput.classList.add("is-invalid")
        }
    }

    updateAllowedCastlings() {
        if (this.chessboard.getPiece("e1") !== PIECE.wk) {
            this.elements.castling.wk.checked = false
            this.elements.castling.wq.checked = false
        }
        if (this.chessboard.getPiece("h1") !== PIECE.wr) {
            this.elements.castling.wk.checked = false
        }
        if (this.chessboard.getPiece("a1") !== PIECE.wr) {
            this.elements.castling.wq.checked = false
        }
        if (this.chessboard.getPiece("e8") !== PIECE.bk) {
            this.elements.castling.bk.checked = false
            this.elements.castling.bq.checked = false
        }
        if (this.chessboard.getPiece("h8") !== PIECE.br) {
            this.elements.castling.bk.checked = false
        }
        if (this.chessboard.getPiece("a8") !== PIECE.br) {
            this.elements.castling.bq.checked = false
        }
    }
}
