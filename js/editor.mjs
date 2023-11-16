import {basicSetup} from "codemirror"
import {EditorView, gutter, GutterMarker, lineNumbers, showPanel} from "@codemirror/view"
import {autocompletion} from "@codemirror/autocomplete"
import {barf} from 'thememirror';
import {countTotalSyllables} from "./syllable.js";

let englishWords = []; // This will be filled with words from the word list

// Asynchronously fetch the word list
fetch('/etc/words.json')
    .then(response => response.json())
    .then(data => {
        englishWords = data;
    })
    .catch(error => {
        console.error('Error fetching word list:', error);
    });


function myCompletions(context) {
    let before = context.matchBefore(/\w+/);

    if (!context.explicit && !before) return null;

    // Combine rhymes with English dictionary words
    let combinedCompletions = englishWords.map(word => ({
        label: word,
        type: "keyword" // or as appropriate
    }));

    return {
        from: before.from,
        options: combinedCompletions,
        validFor: /^\w*$/
    };
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

document.getElementById('saveButton').addEventListener('click', function() {
    const content = view.state.doc.toString(); // Get content from CodeMirror
    if (!content) return;

    const blob = new Blob([content], {type: 'text/plain'});
    const filename = prompt("Enter a filename for the text file:", "");
    if (!filename) return; // Exit if no filename is provided

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename; // Use the provided filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});