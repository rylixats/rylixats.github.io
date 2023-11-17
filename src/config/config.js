export let documentId = null;
export let autoSaveEnabled = true;

export function setAutoSave(autoSave) {
    autoSaveEnabled = autoSave;
}

export function setDocumentId(docId) {
    documentId = docId;
}