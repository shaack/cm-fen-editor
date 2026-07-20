/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */

import {Chessboard, PIECE} from "cm-chessboard/src/Chessboard.js"
import {MARKER_TYPE, Markers} from "cm-chessboard/src/extensions/markers/Markers.js"
import {Chess, FEN, GAME_VARIANT} from "cm-chess/src/Chess.js"
import {Cookie} from "cm-web-modules/src/cookie/Cookie.js"
import {PositionEditor} from "cm-chessboard-position-editor/src/PositionEditor.js"
import {RightClickAnnotator} from "cm-chessboard/src/extensions/right-click-annotator/RightClickAnnotator.js"
import {Observed} from "cm-web-modules/src/observed/Observed.js"
import {Fen} from "cm-chess/src/Fen.js"
import {DomUtils} from "cm-web-modules/src/utils/DomUtils.js"
import {Chess960} from "chess.mjs/src/Chess960.js"

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
            annotations: false, // right-click markers and arrows (RightClickAnnotator)
            ...props
        }
        this.state = new Observed({
            fen: new Fen(this.props.fen),
            fenIsValid: true,
            chess960Mode: false
        })
        this.state.addObserver(() => this.onFenChange(), ["fen", "chess960Mode"])
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
            },
            chess960Number: context.querySelector("#chess960Number"),
            chess960Mode: context.querySelector(".chess960-mode")
        }
        this.initChessboard()
        this.setEventListeners(context)
        this.setFenFromUrlOrCookie()
    }

    setEventListeners(context) {
        const setStateFromInput = (e) => {
            this.state.fen.parse(e.target.value)
            this.state.makeDirty("fen")
        }
        this.elements.fenInputOutput.addEventListener("change", setStateFromInput)
        this.elements.fenSelect.addEventListener("change", setStateFromInput)
        this.elements.colorToPlay.addEventListener("change", (e) => {
            this.state.fen.colorToPlay = e.target.value
            this.state.makeDirty("fen")
        })
        DomUtils.delegate(context, "change", ".checkbox-castle", this.setCastleState)
        if (this.elements.chess960Number) {
            this.elements.chess960Number.addEventListener("change", (e) => {
                const id = parseInt(e.target.value)
                if (!isNaN(id) && id >= 0 && id <= 959) {
                    this.state.fen.parse(Chess960.generateStartPosition(id))
                    this.state.makeDirty("fen")
                }
            })
        }
        if (this.elements.chess960Mode) {
            this.elements.chess960Mode.addEventListener("change", (e) => {
                this.state.fen.castlings = ["K", "Q", "k", "q"]
                this.state.chess960Mode = e.target.checked
            })
        }
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
        this.state.makeDirty("fen")
    }

    setFenFromUrlOrCookie() {
        const fenFromCookie = Cookie.read(this.props.cookieName)
        const fenFromURL = new URLSearchParams(window.location.search).get("fen")
        if (fenFromURL) {
            this.state.fen.parse(fenFromURL)
        } else if (this.props.cookieName && fenFromCookie) {
            this.state.fen.parse(fenFromCookie)
        }
        this.state.makeDirty("fen")
    }

    initChessboard() {
        const extensions = [{
            class: PositionEditor, props: {
                autoSpecialMoves: false,
                onPositionChange: (event) => {
                    this.state.fen.position = event.position
                    this.removeNotAllowedCastlings()
                    this.state.makeDirty("fen")
                    if (this.props.onPositionChange) {
                        this.props.onPositionChange(event)
                    }
                },
                markers: {addPiece: {...this.props.markers}}
            }
        }, {class: Markers, props: {autoMarkers: {...this.props.markers}}}]
        if (this.props.annotations) {
            // draw markers and arrows with right-click (+ Alt/Shift for colors);
            // read/write them via chessboard.getAnnotations()/setAnnotations()
            extensions.push({class: RightClickAnnotator})
        }
        this.chessboard = new Chessboard(this.elements.chessboardContext, {
            position: FEN.empty,
            assetsUrl: this.props.assetsUrl,
            style: {
                aspectRatio: 0.98,
                pieces: {file: this.props.piecesFile},
                cssClass: this.props.boardTheme
            },
            extensions: extensions,
        })
    }

    onFenChange() {
        try {
            new Chess({
                fen: this.state.fen.toString(),
                gameVariant: this.state.chess960Mode ? GAME_VARIANT.chess960 : GAME_VARIANT.standard
            })
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
            if (this.elements.chess960Number) {
                try {
                    this.elements.chess960Number.value = Chess960.detectStartPosition(fenString)
                } catch (e) {
                    this.elements.chess960Number.value = ""
                }
            }
            Cookie.write(this.props.cookieName, fenString)
        })
    }

    removeNotAllowedCastlings() {
        if (this.state.chess960Mode) {
            this.removeNotAllowedCastlings960()
        } else {
            this.removeNotAllowedCastlingsStandard()
        }
    }

    removeNotAllowedCastlingsStandard() {
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

    removeNotAllowedCastlings960() {
        const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
        const checkRank = (rank, kingPiece, rookPiece, kingSide, queenSide) => {
            let kingFile = -1
            let hasRookLeft = false
            let hasRookRight = false
            for (let i = 0; i < 8; i++) {
                const piece = this.chessboard.getPiece(files[i] + rank)
                if (piece === kingPiece) kingFile = i
                if (piece === rookPiece) {
                    if (kingFile === -1) hasRookLeft = true
                    else hasRookRight = true
                }
            }
            if (kingFile === -1 || !hasRookRight) {
                this.state.fen.castlings = this.state.fen.castlings.filter((c) => c !== kingSide)
            }
            if (kingFile === -1 || !hasRookLeft) {
                this.state.fen.castlings = this.state.fen.castlings.filter((c) => c !== queenSide)
            }
        }
        checkRank("1", PIECE.wk, PIECE.wr, "K", "Q")
        checkRank("8", PIECE.bk, PIECE.br, "k", "q")
    }
}
