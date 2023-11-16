document.getElementById('toggleFullscreen').addEventListener('click', function() {
    toggleFullscreen()
});

let documentElement = document.documentElement;
function toggleFullscreen() {
    if (documentElement.requestFullscreen) {
        documentElement.requestFullscreen();
    } else if (documentElement.webkitRequestFullscreen) { /* Safari */
        documentElement.webkitRequestFullscreen();
    } else if (documentElement.msRequestFullscreen) { /* IE11 */
        documentElement.msRequestFullscreen();
    }

    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

document.querySelectorAll('.dropdown').forEach(dropdown => {
    dropdown.addEventListener('mouseenter', function() {
        // Add 'show' class to dropdown content
        this.querySelector('.dropdown-content').classList.add('show');

        // Hide CodeMirror's autocomplete box
        const autocompleteBox = document.querySelector('.cm-tooltip-autocomplete');
        if (autocompleteBox) {
            autocompleteBox.style.display = 'none';
        }
    });

    dropdown.addEventListener('mouseleave', function() {
        // Remove 'show' class from dropdown content
        this.querySelector('.dropdown-content').classList.remove('show');

        // Show CodeMirror's autocomplete box again
        const autocompleteBox = document.querySelector('.cm-tooltip-autocomplete');
        if (autocompleteBox) {
            autocompleteBox.style.display = '';
        }
    });
});

document.getElementById('newButton').addEventListener('click', function() {
    // Close any open dropdowns
    const openDropdowns = document.querySelectorAll('.dropdown-content.show');
    openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
});