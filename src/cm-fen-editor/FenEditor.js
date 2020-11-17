import {Component} from "../../lib/cm-web-modules/app/Component.js"

export const EDIT_MODE = {
    move: "move",
    erase: "erase",
    wk: "wk", wq: "wq", wr: "wr", wb: "wb", wn: "wn", wp: "wp",
    bk: "bk", bq: "bq", br: "br", bb: "bb", bn: "bn", bp: "bp"
}

export class FenEditor extends Component {
    constructor(context, props) {
        super({}, {
            editMode: EDIT_MODE.move,
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        }, {
            editMode: {
                callback: (value) => {
                    setTimeout(() => {
                        for (const button of this.elements.modeButtons) {
                            if (this.state.editMode === button.dataset.mode) {
                                button.classList.add("active")
                            } else {
                                button.classList.remove("active")
                            }
                        }
                    })

                }
            },
            fen: "#fenInputOutput"
        }, {
            switchMode: (event) => {
                this.state.editMode = event.target.dataset.mode
            }
        }, context)
        this.elements = {
            modeButtons: context.querySelectorAll("button[data-mode]"),
        }
    }
    test() {

    }
}