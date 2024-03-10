/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */

import {Chessboard, PIECE} from "cm-chessboard/src/Chessboard.js"
import {MARKER_TYPE, Markers} from "cm-chessboard/src/extensions/markers/Markers.js"
import {Chess, FEN} from "cm-chess/src/Chess.js"
import {Cookie} from "cm-web-modules/src/cookie/Cookie.js"
import {PositionEditor} from "cm-chessboard-position-editor/src/PositionEditor.js"
import {Observed} from "cm-web-modules/src/observed/Observed.js"
import {Fen} from "cm-chess/src/Fen.js"
import {DomUtils} from "cm-web-modules/src/utils/DomUtils.js"

// noinspection SillyAssignmentJS
export class FenEditor {
    constructor(context, props) {
        this.props = {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            piecesFile: "pieces/standard.svg",
            assetsUrl: "./node_modules/cm-chessboard/assets/",
            cookieName: "cfe-fen",
            boardTheme: "default",
            onFenChange: undefined,
            onPositionChange: undefined,
            markers: MARKER_TYPE.frame,
            ...props
        }
        this.state = new Observed({
            fen: new Fen(this.props.fen),
            fenIsValid: true
        })
        this.state.addObserver(() => this.onFenChange(), ["fen"])
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
        this.initChessboard()
        this.setEventListeners(context)
        this.setFenFromUrlOrCookie()
    }

    setEventListeners(context) {
        const setStateFromInput = (e) => {
            this.state.fen.parse(e.target.value)
            this.state.fen = this.state.fen
        }
        this.elements.fenInputOutput.addEventListener("change", setStateFromInput)
        this.elements.fenSelect.addEventListener("change", setStateFromInput)
        this.elements.colorToPlay.addEventListener("change", (e) => {
            this.state.fen.colorToPlay = e.target.value
            this.state.fen = this.state.fen
        })
        DomUtils.delegate(context, "change", ".checkbox-castle", this.setCastleState)
    }

    setCastleState = () => {
        this.state.fen.castlings = []
        if (this.elements.castling.wk.checked) {
            this.state.fen.castlings.push("K")
        }
        if (this.elements.castling.wq.checked) {
            this.state.fen.castlings.push("Q")
        }
        if (this.elements.castling.bk.checked) {
            this.state.fen.castlings.push("k")
        }
        if (this.elements.castling.bq.checked) {
            this.state.fen.castlings.push("q")
        }
        this.removeNotAllowedCastlings()
        this.state.fen = this.state.fen
    }

    setFenFromUrlOrCookie() {
        const fenFromCookie = Cookie.read(this.props.cookieName)
        const fenFromURL = new URLSearchParams(window.location.search).get("fen")
        if (fenFromURL) {
            this.state.fen.parse(fenFromURL)
        } else if (this.props.cookieName && fenFromCookie) {
            this.state.fen.parse(fenFromCookie)
        }
        this.state.fen = this.state.fen
    }

    initChessboard() {
        this.chessboard = new Chessboard(this.elements.chessboardContext, {
            position: FEN.empty,
            assetsUrl: this.props.assetsUrl,
            style: {
                aspectRatio: 0.98,
                pieces: {file: this.props.piecesFile},
                cssClass: this.props.boardTheme
            },
            extensions: [{
                class: PositionEditor, props: {
                    autoSpecialMoves: false,
                    onPositionChange: (event) => {
                        this.state.fen.position = event.position
                        this.removeNotAllowedCastlings()
                        this.state.fen = this.state.fen
                        if (this.props.onPositionChange) {
                            this.props.onPositionChange(event)
                        }
                    },
                    markers: {addPiece: {...this.props.markers}}
                }
            }, {class: Markers, props: {autoMarkers: {...this.props.markers}}}],
        })
    }

    onFenChange() {
        try {
            new Chess(this.state.fen.toString())
            this.state.fenIsValid = true
        } catch (e) {
            this.state.fenIsValid = false
        }
        if (this.state.fenIsValid) {
            this.updateValidState()
            if (this.props.onFenChange) {
                this.props.onFenChange({
                    fen: this.state.fen.toString()
                })
            }
        } else {
            this.elements.fenInputOutput.classList.add("is-invalid")
            console.warn("invalid fen", this.state.fen.toString())
            if (this.props.onFenChange) {
                this.props.onFenChange({
                    fen: null
                })
            }
        }
    }

    updateValidState() {
        const fenString = this.state.fen.toString()
        this.chessboard.setPosition(fenString, false).then(() => {
            this.removeNotAllowedCastlings()
            const fenString = this.state.fen.toString()
            this.elements.fenInputOutput.classList.remove("is-invalid")
            this.elements.fenInputOutput.value = fenString
            this.elements.fenSelect.value = fenString
            this.elements.colorToPlay.value = this.state.fen.colorToPlay
            this.elements.castling.wk.checked = this.state.fen.castlings.includes("K")
            this.elements.castling.wq.checked = this.state.fen.castlings.includes("Q")
            this.elements.castling.bk.checked = this.state.fen.castlings.includes("k")
            this.elements.castling.bq.checked = this.state.fen.castlings.includes("q")
            Cookie.write(this.props.cookieName, fenString)
        })
    }

    removeNotAllowedCastlings() {
        const notAllowedCastlings = {
            "e1": [PIECE.wk, ["K", "Q"]],
            "h1": [PIECE.wr, ["K"]],
            "a1": [PIECE.wr, ["Q"]],
            "e8": [PIECE.bk, ["k", "q"]],
            "h8": [PIECE.br, ["k"]],
            "a8": [PIECE.br, ["q"]]
        }
        for (let position in notAllowedCastlings) {
            if (this.chessboard.getPiece(position) !== notAllowedCastlings[position][0]) {
                notAllowedCastlings[position][1].forEach((c) => {
                    this.state.fen.castlings = this.state.fen.castlings.filter((castling) => castling !== c)
                })
            }
        }
    }
}
