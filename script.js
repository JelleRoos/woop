// script.js

const grid = document.getElementById('grid');
const gridSize = 10;
const geschiedenis = [];

const obstacleImages = {
    "berg": "img/berg.png",
    "bos": "img/bos.png",
    "moeras": "img/moeras.png",
    "woestijn": "img/woestijn.png",
    "brug": "img/brug.png",
    "muur": "img/muur.png",
    "orc": "img/orc.png"
};

function plaatsObstakel(cel, type, vergrendeld = false, col = null, row = null) {
    const item = document.createElement('div');
    item.className = 'obstacle';

    const id = 'obstacle-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    item.setAttribute('id', id);
    item.dataset.scale = '1';

    // Startgrootte obstakel
    const baseSize = 120;
    item.style.width = `${baseSize}px`;
    item.style.height = `${baseSize}px`;
    item.style.position = 'absolute';

    if (vergrendeld) {
        item.classList.add('locked');
        item.setAttribute('draggable', false);
        item.style.pointerEvents = 'none';
    } else {
        item.setAttribute('draggable', true);
    }

    // Voeg afbeelding toe als type bekend is
    if (obstacleImages[type]) {
        const img = document.createElement('img');
        img.src = obstacleImages[type];
        img.alt = type;
        img.draggable = false;
        item.appendChild(img);
    }

    // Voeg tekst toe
    const tekst = document.createElement('div');
    tekst.className = 'obstacle-tekst';
    tekst.textContent = type;
    if (!vergrendeld) tekst.contentEditable = true;
    tekst.setAttribute('draggable', false); // voorkomt slepen van tekst
    item.appendChild(tekst);

    // Coördinaten berekenen (indien nodig)
    let targetRow = row;
    let targetCol = col;

    if (cel && col === null && row === null) {
        const cellIndex = Array.from(grid.children).indexOf(cel);
        targetRow = Math.floor(cellIndex / gridSize);
        targetCol = cellIndex % gridSize;
    }

    item.style.left = `${targetCol * 80}px`;
    item.style.top = `${targetRow * 80}px`;

    grid.appendChild(item);

    // Dragstart event: alleen obstakel-id meesturen
    if (!vergrendeld) {
        item.addEventListener('dragstart', (e) => {
            if (!e.target.classList.contains('obstacle')) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData('text/plain', item.id);
        });
    }
}


for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    grid.appendChild(cell);
}

// START en DOEL rechtsonder en linksonder
plaatsObstakel(null, 'START', true, 0, gridSize - 1);
plaatsObstakel(null, 'DOEL', true, gridSize - 1, 0);

document.querySelectorAll('.tool').forEach(tool => {
    tool.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', tool.dataset.type);
    });
});

grid.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('dragover', (e) => e.preventDefault());

    cell.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const draggedElement = document.getElementById(id);

        if (draggedElement && draggedElement.classList.contains('obstacle')) {
            const mouseX = e.pageX - grid.offsetLeft;
            const mouseY = e.pageY - grid.offsetTop;

            draggedElement.style.left = `${mouseX - 40}px`;
            draggedElement.style.top = `${mouseY - 40}px`;
            return;
        }

        if (id === 'kaart') return;

        const type = id;
        plaatsObstakel(cell, type);
    });
});

const trash = document.getElementById("trash");

trash.addEventListener("dragover", (e) => {
    e.preventDefault();
    trash.style.backgroundColor = "#faa";
});

trash.addEventListener("dragleave", () => {
    trash.style.backgroundColor = "#fee";
});

trash.addEventListener("drop", (e) => {
    e.preventDefault();
    trash.style.backgroundColor = "#fee";
    const id = e.dataTransfer.getData("text/plain");
    const draggedElement = document.getElementById(id);
    if (draggedElement && draggedElement.classList.contains("obstacle")) {
        draggedElement.remove();
    }
    if (id === 'kaart' && !draggedElement) {
        document.querySelectorAll('.kaart-instance').forEach(kaart => {
            const kaartRect = kaart.getBoundingClientRect();
            const trashRect = trash.getBoundingClientRect();

            if (
                kaartRect.right > trashRect.left &&
                kaartRect.left < trashRect.right &&
                kaartRect.bottom > trashRect.top &&
                kaartRect.top < trashRect.bottom
            ) {
                kaart.remove();
            }
        });
    }
});

const kaartTemplate = document.querySelectorAll('.kaart-template');
kaartTemplate.forEach(template => {
    template.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', 'kaart');
        e.dataTransfer.setData('kleur', template.dataset.kleur);
        e.dataTransfer.setData('icoon', template.dataset.icoon);
    });
});

document.addEventListener('drop', e => {
    const type = e.dataTransfer.getData('text/plain');
    if (type !== 'kaart') return;

    const kleurClass = e.dataTransfer.getData('kleur') || 'kaart-geel';
    const icoonType = e.dataTransfer.getData('icoon') || 'vraag';

    const kaart = document.createElement('div');
    kaart.className = `kaart-instance ${kleurClass}`;
    kaart.setAttribute('id', 'kaart-' + Date.now());
    kaart.setAttribute('contenteditable', 'false');

    const icoon = document.createElement('div');
    icoon.className = 'kaart-icoon';
    icoon.textContent = icoonType === 'vraag' ? '❓'
        : icoonType === 'idee' ? '💡'
            : icoonType === 'hulp' ? '🫴'
                : icoonType === 'letop' ? '⚠️'
                    : '🔍';

    kaart.appendChild(icoon);
    const tekstvak = document.createElement('div');
    tekstvak.className = 'kaart-tekst';
    tekstvak.setAttribute('contenteditable', 'true');
    tekstvak.textContent = 'Dubbelklik om te bewerken';
    kaart.appendChild(tekstvak);

    document.body.appendChild(kaart);

    kaart.style.left = `${e.pageX}px`;
    kaart.style.top = `${e.pageY}px`;
});

document.addEventListener('dragover', e => {
    e.preventDefault();
});

document.addEventListener('mousedown', function (e) {
    if (!e.target.classList.contains('kaart-instance')) return;

    const kaart = e.target;
    let shiftX = e.clientX - kaart.getBoundingClientRect().left;
    let shiftY = e.clientY - kaart.getBoundingClientRect().top;

    kaart.style.userSelect = 'none';

    function moveAt(pageX, pageY) {
        kaart.style.left = pageX - shiftX + 'px';
        kaart.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(e) {
        moveAt(e.pageX, e.pageY);
    }

    document.addEventListener('mousemove', onMouseMove);

    kaart.onmouseup = function () {
        document.removeEventListener('mousemove', onMouseMove);
        kaart.onmouseup = null;
        kaart.style.userSelect = 'auto';

        const kaartRect = kaart.getBoundingClientRect();
        const trashRect = trash.getBoundingClientRect();

        const overlap =
            kaartRect.right > trashRect.left &&
            kaartRect.left < trashRect.right &&
            kaartRect.bottom > trashRect.top &&
            kaartRect.top < trashRect.bottom;

        if (overlap) {
            kaart.remove();
        }
    };
});

document.addEventListener('wheel', function (e) {
    const obstacle = e.target.closest('.obstacle');
    if (!obstacle || !grid.contains(obstacle)) return;

    e.preventDefault();

    const currentScale = parseFloat(obstacle.dataset.scale) || 1;
    const baseSize = 120;
    const delta = -e.deltaY;

    let newScale = currentScale + (delta > 0 ? 0.1 : -0.1);
    newScale = Math.max(0.5, Math.min(newScale, 3));

    obstacle.dataset.scale = newScale.toFixed(2);
    obstacle.style.width = `${baseSize * newScale}px`;
    obstacle.style.height = `${baseSize * newScale}px`;
}, { passive: false });

// === EXPORT FUNCTIE ===
document.getElementById('exportBtn').addEventListener('click', () => {
    const data = {
        obstakels: [],
        kaarten: []
    };

    document.querySelectorAll('.obstacle').forEach(el => {
        data.obstakels.push({
            type: el.querySelector('img')?.alt || '',
            left: el.style.left,
            top: el.style.top,
            scale: el.dataset.scale || 1,
            tekst: el.querySelector('.obstacle-tekst')?.textContent || ''
        });
    });

    document.querySelectorAll('.kaart-instance').forEach(el => {
        data.kaarten.push({
            kleur: [...el.classList].find(c => c.startsWith('kaart-')),
            icoon: el.querySelector('.kaart-icoon')?.textContent || '',
            tekst: el.querySelector('.kaart-tekst')?.textContent || '',
            left: el.style.left,
            top: el.style.top
        });
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bordspel-data.json';
    a.click();
    URL.revokeObjectURL(url);
});

// === IMPORT FUNCTIE ===
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importInput').click();
});

document.getElementById('importInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const data = JSON.parse(event.target.result);

        // Verwijder huidige items
        document.querySelectorAll('.obstacle, .kaart-instance').forEach(el => el.remove());

        // Obstakels terugplaatsen
        data.obstakels.forEach(obj => {
            plaatsObstakel(null, obj.type);
            const el = grid.lastChild;
            el.style.left = obj.left;
            el.style.top = obj.top;
            el.dataset.scale = obj.scale;
            el.style.width = `${80 * obj.scale}px`;
            el.style.height = `${80 * obj.scale}px`;
            el.querySelector('.obstacle-tekst').textContent = obj.tekst;
        });

        // Kaarten terugplaatsen
        data.kaarten.forEach(kaart => {
            const el = document.createElement('div');
            el.className = `kaart-instance ${kaart.kleur}`;
            el.setAttribute('contenteditable', 'false');
            el.style.left = kaart.left;
            el.style.top = kaart.top;

            const icoon = document.createElement('div');
            icoon.className = 'kaart-icoon';
            icoon.textContent = kaart.icoon;

            const tekst = document.createElement('div');
            tekst.className = 'kaart-tekst';
            tekst.textContent = kaart.tekst;

            el.appendChild(icoon);
            el.appendChild(tekst);
            document.body.appendChild(el);
        });
    };

    reader.readAsText(file);
});

document.getElementById('addGridBtn').addEventListener('click', voegExtraGridToe);
function voegExtraGridToe() {
    const gridContainer = document.getElementById('grid-container');

    const nieuwGrid = document.createElement('div');
    nieuwGrid.className = 'extra-grid'; // stijl apart als je wilt
    nieuwGrid.style.position = 'relative';
    nieuwGrid.style.width = '800px';
    nieuwGrid.style.height = '800px';
    nieuwGrid.style.display = 'grid';
    nieuwGrid.style.gridTemplateColumns = 'repeat(10, 80px)';
    nieuwGrid.style.gridTemplateRows = 'repeat(10, 80px)';
    nieuwGrid.style.gap = '1px';
    nieuwGrid.style.background = "url('img/map.png')";
    nieuwGrid.style.backgroundSize = 'cover';
    nieuwGrid.style.backgroundPosition = 'center';

    const gridSize = 10;
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        nieuwGrid.appendChild(cell);
    }

    // Events opnieuw toewijzen
    nieuwGrid.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('dragover', (e) => e.preventDefault());

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const draggedElement = document.getElementById(id);

            if (draggedElement && draggedElement.classList.contains('obstacle')) {
                const mouseX = e.pageX - nieuwGrid.offsetLeft;
                const mouseY = e.pageY - nieuwGrid.offsetTop;
                draggedElement.style.left = `${mouseX - 40}px`;
                draggedElement.style.top = `${mouseY - 40}px`;
                return;
            }

            if (id === 'kaart') return;

            const type = id;
            plaatsObstakel(cell, type);
        });
    });

    gridContainer.prepend(nieuwGrid); // zet de nieuwe grid bovenaan
}

document.getElementById('removeGridBtn').addEventListener('click', verwijderBovensteGrid);

function verwijderBovensteGrid() {
    const gridContainer = document.getElementById('grid-container');
    const alleGrids = gridContainer.querySelectorAll('.extra-grid');

    if (alleGrids.length === 0) {
        alert('Er zijn geen extra grids meer om te verwijderen.');
        return;
    }

    const bovenste = alleGrids[alleGrids.length - 1]; // de laatst toegevoegde (bovenste in de container)
    bovenste.remove();
}