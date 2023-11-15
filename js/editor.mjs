import {basicSetup} from "codemirror"
import {EditorView, gutter, GutterMarker, lineNumbers} from "@codemirror/view"
import {autocompletion} from "@codemirror/autocomplete"
import {barf} from 'thememirror';
import {countTotalSyllables} from "../inc/syllable.js";

const completions = [
    {label: "panic", type: "keyword"},
    {label: "park", type: "constant", info: "Test completion"},
    {label: "password", type: "variable"},
    {label: "penis", type: "keyword"},
]

function myCompletions(context) {
    let before = context.matchBefore(/\w+/)
    // If completion wasn't explicitly started and there
    // is no word before the cursor, don't open completions.
    if (!context.explicit && !before) return null
    return {
        from: before ? before.from : context.pos,
        options: completions,
        validFor: /^\w*$/
    }
}

const emptyMarker = new class extends GutterMarker {
    toDOM() { return document.createTextNode("ø") }
}

function countSyllables(view, line) {
    let text = view.state.doc.lineAt(line.from).text
    let count = countTotalSyllables(text);
    return new class extends GutterMarker {
        toDOM() {
            return document.createTextNode(count <= 0 ? '' : count)
        }
    };
}

const syllableCounterGutter = gutter({
    class: "cm-syllableCounter",
    lineMarker(view, line) {
        return line.from === line.to ? null : countSyllables(view, line)
    },
    initialSpacer: () => emptyMarker
})

const hexLineNumbers = lineNumbers({
    formatNumber: n => n.toString(16)
})

let view = new EditorView({
    doc: "",
    extensions: [
        basicSetup,
        barf,
        // hexLineNumbers,
        syllableCounterGutter,
        autocompletion({override: [myCompletions]})
    ],
    parent: document.body
})
