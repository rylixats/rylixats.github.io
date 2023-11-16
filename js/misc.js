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
        this.querySelector('.dropdown-content').classList.add('show');
    });
    dropdown.addEventListener('mouseleave', function() {
        this.querySelector('.dropdown-content').classList.remove('show');
    });
});

document.getElementById('newButton').addEventListener('click', function() {
    // Close any open dropdowns
    const openDropdowns = document.querySelectorAll('.dropdown-content.show');
    openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
});