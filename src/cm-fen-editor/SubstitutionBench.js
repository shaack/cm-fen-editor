/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-fen-editor
 * License: MIT, see file 'LICENSE'
 */

import {Svg} from "../../lib/cm-web-modules/svg/Svg.js"

export class SubstitutionBench {

    constructor(element, props) {
        this.element = element
        this.props = props
        this.createSvg()
        this.drawPieces()
    }

    createSvg() {
        this.svg = Svg.createSvg(this.element)
        this.piecesGroup = Svg.addElement(this.svg, "g", {class: "pieces"})
    }

    drawPieces() {
        while (this.piecesGroup.firstChild) {
            this.piecesGroup.removeChild(this.piecesGroup.lastChild)
        }
        this.drawPiece(0, 0, "wk")
        this.drawPiece(0, 1, "wq")
        this.drawPiece(0, 2, "wr")
        this.drawPiece(0, 3, "wb")
        this.drawPiece(0, 4, "wn")
        this.drawPiece(0, 5, "wp")
        this.drawPiece(1, 0, "bk")
        this.drawPiece(1, 1, "bq")
        this.drawPiece(1, 2, "br")
        this.drawPiece(1, 3, "bb")
        this.drawPiece(1, 4, "bn")
        this.drawPiece(1, 5, "bp")
    }

    drawPiece(x, y, pieceName) {
        const pieceGroup = Svg.addElement(this.piecesGroup, "g")
        pieceGroup.setAttribute("data-piece", name)
        const point = {x: x * 40, y: y * 40}
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        pieceGroup.transform.baseVal.appendItem(transform)
        const pieceUse = Svg.addElement(pieceGroup, "use", {"href": `${this.props.sprite.url}#${pieceName}`, "class": "piece"})
        // scale
        const transformScale = (this.svg.createSVGTransform())
        transformScale.setScale(1, 1)
        pieceUse.transform.baseVal.appendItem(transformScale)
        return pieceGroup
    }

    updateMetrics() {

    }

}