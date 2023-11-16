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

const syllableCountCache = new Map();

function countSyllables(view, line) {
    let text = view.state.doc.lineAt(line.from).text;

    if (!syllableCountCache.has(text)) {
        let count = countTotalSyllables(text);
        syllableCountCache.set(text, count);
    }

    let count = syllableCountCache.get(text);
    return new class extends GutterMarker {
        toDOM = () => document.createTextNode(count <= 0 ? 'ø' : count);
    };
}

EditorView.updateListener.of(update => {
    if (update.docChanged) {
        // Example condition: clear cache if changes affect more than 10 lines
        if (update.changes.length > 10) {
            syllableCountCache.clear();
        }
    }
});

const syllableCounterGutter = gutter({
    class: "cm-syllableCounter",
    lineMarker(view, line) {
        const viewport = view.viewport;
        // Check if the line is within the viewport (visible)
        if (line.from !== line.to && line.from >= viewport.from && line.to <= viewport.to && view.state.doc.lines <= 1000) {
            return countSyllables(view, line);
        }
        return null;  // Do not show syllable counter for lines outside the viewport
    }
});

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
        EditorView.updateListener.of(update => {
            if (autoSaveEnabled && update.docChanged) {
                const editorContent = update.view.state.doc.toString();
                checkAndUpdateForContent(editorContent);
            }
        }),
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

document.getElementById('openFileButton').addEventListener('click', function() {
    document.getElementById('fileInput').click(); // Trigger file input
});

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lineDelimiter = '\n';
        const chunkSize = 500; // Smaller chunk size
        const trimmedContent = content.trim(); // Remove trailing spaces

        // Clear the original content before inserting
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: '' }
        });

        const lines = trimmedContent.split(lineDelimiter);
        let start = 0;

        function insertChunk() {
            const end = Math.min(start + chunkSize, lines.length);
            const chunk = lines.slice(start, end).join(lineDelimiter);

            // Insert the chunk into the editor
            view.dispatch({
                changes: { from: view.state.doc.length, insert: chunk }
            });

            start = end;

            if (start < lines.length) {
                // Continue inserting the next chunk
                requestAnimationFrame(insertChunk);
            } else {
                // Insertion is complete, show a warning if needed
                if (lines.length > 1000) {
                    alert("Syllable counter is disabled after 1000 lines.");
                }
            }
        }

        insertChunk(); // Start inserting chunks
    };
    reader.readAsText(file);
});

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function checkAndUpdateForContent(content) {
    // Check if the content is empty
    if (content.trim() === '') {
        // If content is empty and there's a UUID in the URL, remove it from localStorage and the URL
        if (currentDocumentUUID) {
            localStorage.removeItem(currentDocumentUUID); // Remove from localStorage
            const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
        currentDocumentUUID = null; // Reset the UUID since there's no content
    } else {
        // Content is not empty, proceed to save and update URL
        currentDocumentUUID = saveEditorContent(content, currentDocumentUUID);
    }
}

function saveEditorContent(editorContent, uuid = null) {
    uuid = uuid || generateUUID();

    localStorage.setItem(uuid, editorContent);

    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?id=${uuid}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    return uuid; // Return the UUID for future reference
}

let currentDocumentUUID = null;

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const uuid = urlParams.get('id');

    if (uuid) {
        const content = localStorage.getItem(uuid);

        if (content && content.trim() === '' || !content) {
            // Content is empty, remove from localStorage and reset URL
            localStorage.removeItem(uuid);
            const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
            window.history.replaceState({ path: newUrl }, '', newUrl);
            currentDocumentUUID = null;
        } else if (content) {
            // Content is not empty, load it into the editor
            currentDocumentUUID = uuid;
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: content }
            });
            checkAndUpdateForContent(content); // This will update the URL if needed
        }
    }
};

let autoSaveEnabled = true;

document.getElementById('newButton').addEventListener('click', function() {
    // Save the current content with the existing UUID
    const currentContent = view.state.doc.toString();
    if (currentDocumentUUID) {
        saveEditorContent(currentContent, currentDocumentUUID);
    }

    // Disable auto-save temporarily
    autoSaveEnabled = false;

    // Clear the editor content
    view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: '' }
    });

    // Reset the URL without the UUID
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    // Reset the currentDocumentUUID for a new file
    currentDocumentUUID = null;

    // Re-enable auto-save
    setTimeout(() => {
        autoSaveEnabled = true;
    }, 0);
});