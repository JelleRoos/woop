const grid = document.getElementById('grid');
const gridSize = 10;
let aantalRijen = 10;

const obstacleImages = {
    berg: "img/berg.png",
    bos: "img/bos.png",
    moeras: "img/moeras.png",
    woestijn: "img/woestijn.png",
    brug: "img/brug.png",
    muur: "img/muur.png",
    orc: "img/orc.png"
};

const geschiedenis = [];

// 📦 Grid bouwen
function bouwGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < gridSize * aantalRijen; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        voegDropHandlersToe(cell);
        grid.appendChild(cell);
    }
    updateGridRijen();
}

function updateGridRijen() {
    grid.style.gridTemplateRows = `repeat(${aantalRijen}, 80px)`;
}

// 🧱 Obstakel plaatsen
function plaatsObstakel(cel, type, vergrendeld = false, col = null, row = null) {
    const id = `obstacle-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const item = document.createElement('div');
    item.className = 'obstacle';
    item.id = id;
    item.dataset.scale = '1';
    item.style.position = 'absolute';
    item.style.width = '120px';
    item.style.height = '120px';

    if (vergrendeld) {
        item.classList.add('locked');
        item.setAttribute('draggable', false);
        item.style.pointerEvents = 'none';
    } else {
        item.setAttribute('draggable', true);
    }

    if (obstacleImages[type]) {
        const img = document.createElement('img');
        img.src = obstacleImages[type];
        img.alt = type;
        img.draggable = false;
        item.appendChild(img);
    }

    const tekst = document.createElement('div');
    tekst.className = 'obstacle-tekst';
    tekst.textContent = type;
    if (!vergrendeld) tekst.contentEditable = true;
    item.appendChild(tekst);

    if (!col || !row) {
        const rect = grid.getBoundingClientRect();
        const mouseX = window.lastDropX - rect.left;
        const mouseY = window.lastDropY - rect.top;
        col = Math.floor(mouseX / 80);
        row = Math.floor(mouseY / 80);
    }

    item.style.left = `${col * 80}px`;
    item.style.top = `${row * 80}px`;
    grid.appendChild(item);

    if (!vergrendeld) {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.id);
        });
    }
}

// 🗑️ Prullenbak functionaliteit
function setupTrash() {
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
        const el = document.getElementById(id);
        if (el?.classList.contains("obstacle") || el?.classList.contains("kaart-instance")) {
            el.remove();
        }
    });
}

// 🔀 Drag & drop handlers voor grid cellen
function voegDropHandlersToe(cell) {
    cell.addEventListener('dragover', (e) => e.preventDefault());

    cell.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        window.lastDropX = e.clientX;
        window.lastDropY = e.clientY;

        const id = e.dataTransfer.getData("text/plain");
        const draggedElement = document.getElementById(id);

        if (draggedElement?.classList.contains('obstacle')) {
            const rect = grid.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const col = Math.floor(mouseX / 80);
            const row = Math.floor(mouseY / 80);
            draggedElement.style.left = `${col * 80}px`;
            draggedElement.style.top = `${row * 80}px`;
            return;
        }

        if (id === 'kaart') {
            plaatsKaart(e);
        } else {
            plaatsObstakel(cell, id);
        }
    });
}

// 🧰 Toolbox drag
document.querySelectorAll('.tool').forEach(tool => {
    tool.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', tool.dataset.type);
    });
});

// 📥 Drop op grid zonder cel
grid.addEventListener('drop', (e) => {
    e.preventDefault();
    window.lastDropX = e.clientX;
    window.lastDropY = e.clientY;

    const id = e.dataTransfer.getData("text/plain");
    const draggedElement = document.getElementById(id);

    if (draggedElement?.classList.contains('obstacle')) {
        const rect = grid.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const col = Math.floor(mouseX / 80);
        const row = Math.floor(mouseY / 80);
        draggedElement.style.left = `${col * 80}px`;
        draggedElement.style.top = `${row * 80}px`;
        return;
    }

    if (id === 'kaart') {
        plaatsKaart(e);
    } else {
        plaatsObstakel(null, id);
    }
});

// 🃏 Kaartfunctie
function plaatsKaart(e) {
    const kleur = e.dataTransfer.getData("kleur") || 'kaart-geel';
    const icoonType = e.dataTransfer.getData("icoon") || 'vraag';

    const kaart = document.createElement('div');
    kaart.className = `kaart-instance ${kleur}`;
    kaart.id = `kaart-${Date.now()}`;
    kaart.style.position = 'absolute';
    kaart.style.left = `${e.pageX}px`;
    kaart.style.top = `${e.pageY}px`;

    const icoon = document.createElement('div');
    icoon.className = 'kaart-icoon';
    icoon.textContent = {
        vraag: '❓',
        idee: '💡',
        hulp: '🫴',
        letop: '⚠️'
    }[icoonType] || '🔍';

    const tekst = document.createElement('div');
    tekst.className = 'kaart-tekst';
    tekst.contentEditable = true;
    tekst.textContent = 'Dubbelklik om te bewerken';

    kaart.appendChild(icoon);
    kaart.appendChild(tekst);
    document.body.appendChild(kaart);
}

// 🎯 Kaarten verslepen
document.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('kaart-instance')) return;

    const kaart = e.target;
    let offsetX = e.clientX - kaart.getBoundingClientRect().left;
    let offsetY = e.clientY - kaart.getBoundingClientRect().top;

    function moveAt(x, y) {
        kaart.style.left = x - offsetX + 'px';
        kaart.style.top = y - offsetY + 'px';
    }

    function onMouseMove(e) {
        moveAt(e.pageX, e.pageY);
    }

    document.addEventListener('mousemove', onMouseMove);

    kaart.onmouseup = () => {
        document.removeEventListener('mousemove', onMouseMove);
        kaart.onmouseup = null;
    };
});

// 🔍 Kaarten slepen vanuit template
document.querySelectorAll('.kaart-template').forEach(template => {
    template.addEventListener('dragstart', e => {
        e.dataTransfer.setData("text/plain", 'kaart');
        e.dataTransfer.setData("kleur", template.dataset.kleur);
        e.dataTransfer.setData("icoon", template.dataset.icoon);
    });
});

// 🔄 Scroll = schaal
document.addEventListener('wheel', (e) => {
    const obstacle = e.target.closest('.obstacle');
    if (!obstacle || !grid.contains(obstacle)) return;

    e.preventDefault();
    const base = 120;
    const delta = -e.deltaY;
    let scale = parseFloat(obstacle.dataset.scale) || 1;
    scale += delta > 0 ? 0.1 : -0.1;
    scale = Math.max(0.5, Math.min(scale, 3));
    obstacle.dataset.scale = scale.toFixed(2);
    obstacle.style.width = `${base * scale}px`;
    obstacle.style.height = `${base * scale}px`;
}, { passive: false });

// 💾 Export
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
            scale: el.dataset.scale,
            tekst: el.querySelector('.obstacle-tekst')?.textContent
        });
    });

    document.querySelectorAll('.kaart-instance').forEach(el => {
        data.kaarten.push({
            kleur: [...el.classList].find(c => c.startsWith('kaart-')),
            icoon: el.querySelector('.kaart-icoon')?.textContent,
            tekst: el.querySelector('.kaart-tekst')?.textContent,
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

// 📂 Import
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importInput').click();
});

document.getElementById('importInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
        const data = JSON.parse(evt.target.result);
        document.querySelectorAll('.obstacle, .kaart-instance').forEach(el => el.remove());

        data.obstakels.forEach(o => {
            plaatsObstakel(null, o.type);
            const el = grid.lastChild;
            el.style.left = o.left;
            el.style.top = o.top;
            el.dataset.scale = o.scale;
            el.style.width = `${120 * o.scale}px`;
            el.style.height = `${120 * o.scale}px`;
            el.querySelector('.obstacle-tekst').textContent = o.tekst;
        });

        data.kaarten.forEach(k => {
            const el = document.createElement('div');
            el.className = `kaart-instance ${k.kleur}`;
            el.style.left = k.left;
            el.style.top = k.top;

            const icoon = document.createElement('div');
            icoon.className = 'kaart-icoon';
            icoon.textContent = k.icoon;

            const tekst = document.createElement('div');
            tekst.className = 'kaart-tekst';
            tekst.textContent = k.tekst;
            tekst.contentEditable = true;

            el.appendChild(icoon);
            el.appendChild(tekst);
            document.body.appendChild(el);
        });
    };

    reader.readAsText(file);
});

// ➕➖ Rijenbeheer
document.getElementById('addRowBtn').addEventListener('click', () => {
    if (aantalRijen >= 20) return;
    aantalRijen++;
    bouwGrid();
});

document.getElementById('removeRowBtn').addEventListener('click', () => {
    if (aantalRijen <= 10) return;
    aantalRijen--;
    bouwGrid();
});

// 🛠️ Init
bouwGrid();
setupTrash();
