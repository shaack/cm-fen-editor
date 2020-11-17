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
            editMode: EDIT_MODE.move
        }, {
            editMode: {
                callback: (value) => {
                    console.log("editMode callback", value)
                }
            }
        }, {
            switchMode: (event) => {
                this.state.editMode = event.target.dataset.mode
            }
        }, context)
    }
}