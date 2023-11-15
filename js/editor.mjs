import {basicSetup} from "codemirror"
import {EditorView, gutter, GutterMarker, lineNumbers, showPanel} from "@codemirror/view"
import {autocompletion} from "@codemirror/autocomplete"
import {barf} from 'thememirror';
import {countTotalSyllables} from "./syllable.js";

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

function countSyllables(view, line) {
    let text = view.state.doc.lineAt(line.from).text
    let count = countTotalSyllables(text);
    return new class extends GutterMarker {
        toDOM = () => document.createTextNode(count <= 0 ? 'ø' : count);
    };
}

const syllableCounterGutter = gutter({
    class: "cm-syllableCounter",
    lineMarker(view, line) {
        return line.from === line.to ? null : countSyllables(view, line)
    }
})

const hexLineNumbers = lineNumbers({
    formatNumber: n => n.toString(16)
})

// TODO: Better Calculation
function countWords(doc) {
    let count = 0, iter = doc.iter()
    while (!iter.next().done) {
        let inWord = false
        for (let i = 0; i < iter.value.length; i++) {
            let word = /\w/.test(iter.value[i])
            if (word && !inWord) count++
            inWord = word
        }
    }
    return `Word Count: ${count}`
}

function wordCountPanel(view) {
    let dom = document.createElement("div")
    dom.id = "word-count"
    dom.textContent = countWords(view.state.doc)
    return {
        dom,
        update(update) {
            if (update.docChanged)
                dom.textContent = countWords(update.state.doc)
        }
    }
}

export function wordCounter() {
    return showPanel.of(wordCountPanel)
}

const view = new EditorView({
    doc: "",
    extensions: [
        basicSetup,
        barf,
        // hexLineNumbers,
        syllableCounterGutter,
        wordCounter(),
        autocompletion({override: [myCompletions]})
    ],
    parent: document.body
})