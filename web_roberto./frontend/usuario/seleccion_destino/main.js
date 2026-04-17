const UI_TRANSLATIONS = {
    es: {
        titleCat: "Selecciona tu destino",
        subtitleCat: "Elige la categoría a la que deseas ir",
        titleSub: "Selecciona tu destino específico",
        subtitleSub: "Elige a dónde quieres ir dentro de esta zona",
        summaryDest: "DESTINO SELECCIONADO",
        dist: "Distancia",
        time: "Tiempo estimado",
        btnContinue: "Continuar",
        btnSending: "Enviando comando...",
        navigating: "Iniciando navegación...",
        // Mock Categories
        cat_puertas: { name: "Puerta 1-21", sub: "Vuelos internacionales" },
        cat_comida: { name: "Comida", sub: "Restaurantes" },
        cat_ocio: { name: "Ocio", sub: "Tiendas y compras" },
        cat_salida: { name: "Salida", sub: "Salida principal" },
        // Mock sub
        wordGate: "Puerta",
        sub_embarque: "Embarque",
        sub_embarqueVip: "Embarque VIP"
    },
    en: {
        titleCat: "Select your destination",
        subtitleCat: "Choose the category you want to go to",
        titleSub: "Select specific destination",
        subtitleSub: "Choose where you want to go within this area",
        summaryDest: "SELECTED DESTINATION",
        dist: "Distance",
        time: "Estimated time",
        btnContinue: "Continue",
        btnSending: "Sending command...",
        navigating: "Starting navigation...",
        cat_puertas: { name: "Gate 1-21", sub: "International flights" },
        cat_comida: { name: "Food", sub: "Restaurants" },
        cat_ocio: { name: "Leisure", sub: "Shops & Shopping" },
        cat_salida: { name: "Exit", sub: "Main exit" },
        wordGate: "Gate",
        sub_embarque: "Boarding",
        sub_embarqueVip: "VIP Boarding"
    },
    de: {
        titleCat: "Ziel auswählen",
        subtitleCat: "Wähle die Kategorie, zu der du gehen möchtest",
        titleSub: "Spezifisches Ziel auswählen",
        subtitleSub: "Wähle, wohin du in diesem Bereich gehen möchtest",
        summaryDest: "AUSGEWÄHLTES ZIEL",
        dist: "Entfernung",
        time: "Geschätzte Zeit",
        btnContinue: "Weiter",
        btnSending: "Befehl senden...",
        navigating: "Navigation starten...",
        cat_puertas: { name: "Tor 1-21", sub: "Internationale Flüge" },
        cat_comida: { name: "Essen", sub: "Restaurants" },
        cat_ocio: { name: "Freizeit", sub: "Geschäfte & Einkaufen" },
        cat_salida: { name: "Ausgang", sub: "Hauptausgang" },
        wordGate: "Tor",
        sub_embarque: "Einsteigen",
        sub_embarqueVip: "VIP-Einsteigen"
    },
    fr: {
        titleCat: "Sélectionnez la destination",
        subtitleCat: "Choisissez la catégorie où vous souhaitez aller",
        titleSub: "Sélectionnez une destination spécifique",
        subtitleSub: "Choisissez où vous voulez aller dans cette zone",
        summaryDest: "DESTINATION SÉLECTIONNÉE",
        dist: "Distance",
        time: "Temps estimé",
        btnContinue: "Continuer",
        btnSending: "Envoi de la commande...",
        navigating: "Démarrage de la navigation...",
        cat_puertas: { name: "Porte 1-21", sub: "Vols internationaux" },
        cat_comida: { name: "Nourriture", sub: "Restaurants" },
        cat_ocio: { name: "Loisir", sub: "Boutiques et achats" },
        cat_salida: { name: "Sortie", sub: "Sortie principale" },
        wordGate: "Porte",
        sub_embarque: "Embarquement",
        sub_embarqueVip: "Embarquement VIP"
    }
};

// MOCK DATA (JSON de prueba) preparados para futura API
const MOCK_CATEGORIES = [
    {
        id: 'puertas',
        name: 'Puerta 1-21',
        subtitle: 'Vuelos internacionales',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6 0 .1 0 .3.1.4l5.3 4.3L5 15H2l1.5 3.5L7 22v-3l3.5-4.1 4.3 5.3c.1.1.3.2.4.1.4-.2.7-.6.6-1.1z"/></svg>',
        time: '3 min',
        dist: '350m'
    },
    {
        id: 'comida',
        name: 'Comida',
        subtitle: 'Restaurantes',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 10-2-2 2-2 2 2z"/><path d="m12 14-2-2 2-2 2 2z"/><path d="m6 18-2-2 2-2 2 2z"/><path d="m3 21 8-8"/><path d="m21 3-8 8"/></svg>', // Fork/Knife simple path replacement
        time: '2 min',
        dist: '280m'
    },
    {
        id: 'ocio',
        name: 'Ocio',
        subtitle: 'Tiendas y compras',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        time: '4 min',
        dist: '420m'
    },
    {
        id: 'salida',
        name: 'Salida',
        subtitle: 'Salida principal',
        svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
        time: '2 min',
        dist: '180m'
    }
];

let MOCK_DESTINATIONS = {};

// Reusable card renderer
function renderCards(gridId, items, onClickCallback) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'dest-card';
        card.dataset.id = item.id;
        
        card.innerHTML = `
            <div class="active-indicator"></div>
            <div class="card-top">
                <div class="card-icon">${item.svgIcon}</div>
            </div>
            <h3 class="card-title">${item.name}</h3>
            <p class="card-subtitle">${item.subtitle}</p>
            <div class="card-meta" style="margin-top: 1rem;">
                <div class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${item.time}</span>
                </div>
                <div class="meta-dot"></div>
                <div class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>${item.dist}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => onClickCallback(card, item));
        grid.appendChild(card);
    });
}

// Lógica de validación de idioma
function applyLanguage() {
    const lang = localStorage.getItem('lang') || 'es';
    const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['es'];
    
    // Asignación de textos estáticos si los elementos existen
    const titleText = document.getElementById('title-text');
    const subtitleText = document.getElementById('subtitle-text');
    if (titleText && subtitleText) {
        // Diferenciamos por si estamos en categorías o subcategorías mediante id en html o si existe 'destinations-grid'
        if (document.getElementById('categories-grid')) {
            titleText.textContent = t.titleCat;
            subtitleText.textContent = t.subtitleCat;
        } else {
            titleText.textContent = t.titleSub;
            subtitleText.textContent = t.subtitleSub;
        }
    }
    
    const summaryLabel = document.getElementById('summary-label');
    if (summaryLabel) summaryLabel.textContent = t.summaryDest;

    const summaryDistLabel = document.getElementById('summary-dist-label');
    if (summaryDistLabel) summaryDistLabel.textContent = t.dist;

    const summaryTimeLabel = document.getElementById('summary-time-label');
    if (summaryTimeLabel) summaryTimeLabel.textContent = t.time;

    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        // Encontrar el span dentro del botón para cambiar su texto, conservando el icono SVG
        const span = continueBtn.querySelector('span');
        if (span) span.textContent = t.btnContinue;
    }

    const navigationText = document.getElementById('navigation-text');
    if (navigationText) navigationText.textContent = t.navigating;

    return t; // Para usar en los Mocks dinámicamente
}

// ------------------------------------
// Inicialización página principal
// ------------------------------------
function initCategoriesView() {
    const t = applyLanguage();

    const gridId = 'categories-grid';
    if (!document.getElementById(gridId)) return;

    // Traducir las categorías Mock al vuelo
    const translatedCategories = MOCK_CATEGORIES.map(cat => ({
        ...cat,
        name: t[`cat_${cat.id}`].name,
        subtitle: t[`cat_${cat.id}`].sub
    }));

    renderCards(gridId, translatedCategories, (card, item) => {
        // Redirigir a subcategoría
        window.location.href = `subcategory.html?cat=${item.id}`;
    });
}

// ------------------------------------
// Inicialización subpágina de destinos
// ------------------------------------
async function initSubcategoryView() {
    const t = applyLanguage();

    try {
        const res = await fetch('/api/destinos');
        const data = await res.json();
        if (data.success) {
            MOCK_DESTINATIONS = data.data.destinations;
            
            // Add SVG icons to loaded destinations based on category
            const categoryData = MOCK_CATEGORIES.reduce((acc, cat) => {
                acc[cat.id] = cat.svgIcon;
                return acc;
            }, {});
            
            for (let c in MOCK_DESTINATIONS) {
                MOCK_DESTINATIONS[c].forEach(d => {
                    if (!d.svgIcon) d.svgIcon = categoryData[c] || categoryData['puertas'];
                });
            }
        }
    } catch (e) {
        console.error("Error fetching /api/destinos", e);
    }

    const urlParams = new URLSearchParams(window.location.search);
    let cat = urlParams.get('cat');
    
    // Fallback por si entran directo sin categoría válida
    if (!cat || !MOCK_DESTINATIONS[cat]) {
        cat = 'puertas';
    }

    // Traducir dinámicamente según key hardcodeada para demostración
    const items = MOCK_DESTINATIONS[cat].map(dest => {
        let subTr = dest.subtitle;
        let nameTr = dest.name;
        
        if(dest.subtitle === 'Embarque') subTr = t.sub_embarque;
        if(dest.subtitle === 'Embarque VIP') subTr = t.sub_embarqueVip;

        if(nameTr.includes('Puerta')) {
            nameTr = nameTr.replace('Puerta', t.wordGate);
        }

        return { ...dest, name: nameTr, subtitle: subTr };
    });

    const gridId = 'destinations-grid';
    if (!document.getElementById(gridId)) return;

    let selectedDestination = null;

    renderCards(gridId, items, (cardElement, itemData) => {
        // Deseleccionar todas
        document.querySelectorAll('.dest-card').forEach(c => c.classList.remove('active'));
        // Seleccionar esta
        cardElement.classList.add('active');
        selectedDestination = itemData;

        // Mostrar resumen
        const summaryBar = document.getElementById('summary-bar');
        document.getElementById('summary-dest-name').textContent = itemData.name;
        document.getElementById('summary-dest-dist').textContent = itemData.dist;
        document.getElementById('summary-dest-time').textContent = itemData.time;
        summaryBar.classList.remove('hidden');

        // Habilitar botón continuar
        const continueBtn = document.getElementById('continue-btn');
        continueBtn.disabled = false;
    });

    // Evento a botón volver
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'destination.html';
        });
    }

    // Integración MOCK con ROS2
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', async () => {
            if (!selectedDestination) return;

            // Simulación del endpoint de backend
            console.log(`[ROS2 Integration] Enviando destino al backend... Destino: ${selectedDestination.name}`);
            
            // Simular fetch
            try {
                // mock delay
                const span = document.getElementById('continue-btn').querySelector('span');
                if(span) span.textContent = t.btnSending;
                
                await new Promise(resolve => setTimeout(resolve, 800));

                /* 
                 * En un entorno real se haría:
                 * await fetch('/api/navigate', {
                 *    method: 'POST',
                 *    headers: {'Content-Type': 'application/json'},
                 *    body: JSON.stringify({ destination_id: selectedDestination.id })
                 * });
                 */
                
                // Mostrar overlay
                const overlay = document.getElementById('navigation-overlay');
                overlay.classList.add('active');
                
                // Redirigir a inicio u ocultar después de un rato (simulación)
                setTimeout(() => {
                    overlay.classList.remove('active');
                    alert(`Navegación simulada hacia ${selectedDestination.name} iniciada correctamente (ROS2)`);
                    window.location.href = '../index.html'; // Volver al menú principal raíz temporalmente
                }, 2500);

            } catch (error) {
                console.error('Error al iniciar la navegación ROS2', error);
                alert('No se pudo establecer conexión con el robot.');
            }
        });
    }
}
