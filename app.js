// =======================
//  Firebase imports
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// =======================
//  Config de Firebase
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyC9AfSi-sI1EWP6bp1NBI-z0Cmap_nE7c",
  authDomain: "papa-cocina.firebaseapp.com",
  projectId: "papa-cocina",
  storageBucket: "papa-cocina.firebasestorage.app",
  messagingSenderId: "479896054588",
  appId: "1:479896054588:web:6fdba3ce1119fa67de29b9",
  measurementId: "G-BKJESVDY64"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const recipesCol = collection(db, "recipes");

// =======================
//  DOM
// =======================
const nameInput = document.getElementById("name");
const ingInput = document.getElementById("ingredients");
const filterInput = document.getElementById("filter");

const addBtn = document.getElementById("addBtn");
const suggestBtn = document.getElementById("suggestBtn");

const resultBlock = document.getElementById("resultBlock");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultCategory = document.getElementById("resultCategory");
const resultMessage = document.getElementById("resultMessage");

const favBtn = document.getElementById("favBtn");
const favoritesList = document.getElementById("favoritesList");
const favoritesEmpty = document.getElementById("favoritesEmpty");

// =======================
//  Estado
// =======================
let lastSuggestedRecipe = null;
let favorites = [];

// =======================
//  Favoritos helpers
// =======================
function loadFavorites() {
  try {
    const raw = localStorage.getItem("papaCocinaFavorites");
    favorites = raw ? JSON.parse(raw) : [];
  } catch {
    favorites = [];
  }
  renderFavorites();
}

function saveFavorites() {
  localStorage.setItem("papaCocinaFavorites", JSON.stringify(favorites));
}

function isFavorite(name) {
  return favorites.some((f) => f.name === name);
}

function renderFavorites() {
  favoritesList.innerHTML = "";

  if (!favorites.length) {
    favoritesEmpty.style.display = "block";
    return;
  }
  favoritesEmpty.style.display = "none";

  favorites.forEach((f) => {
    const li = document.createElement("li");
    li.className = "fav-li";

    const spanIcon = document.createElement("span");
    spanIcon.className = "fav-li-icon";
    spanIcon.textContent = f.icon || "🍽️";

    const spanText = document.createElement("span");
    spanText.textContent = f.name;

    const removeBtn = document.createElement("button");
    removeBtn.className = "fav-remove";
    removeBtn.textContent = "✕";
    removeBtn.dataset.name = f.name;

    li.appendChild(spanIcon);
    li.appendChild(spanText);
    li.appendChild(removeBtn);
    favoritesList.appendChild(li);
  });
}

function updateFavButton() {
  if (!lastSuggestedRecipe) {
    favBtn.disabled = true;
    favBtn.classList.remove("fav-on");
    favBtn.textContent = "♡";
    return;
  }

  favBtn.disabled = false;
  const on = isFavorite(lastSuggestedRecipe.name);
  favBtn.classList.toggle("fav-on", on);
  favBtn.textContent = on ? "♥" : "♡";
}

function toggleFavorite() {
  if (!lastSuggestedRecipe) return;
  const { name } = lastSuggestedRecipe;
  const { icon } = getCategoryAndIcon(lastSuggestedRecipe);

  const idx = favorites.findIndex((f) => f.name === name);
  if (idx >= 0) {
    favorites.splice(idx, 1); // quitar
  } else {
    favorites.push({ name, icon }); // añadir
  }
  saveFavorites();
  renderFavorites();
  updateFavButton();
}

// botón corazón
favBtn.addEventListener("click", toggleFavorite);

// borrar favorito con la X
favoritesList.addEventListener("click", (e) => {
  if (!e.target.classList.contains("fav-remove")) return;

  const name = e.target.dataset.name;
  const idx = favorites.findIndex((f) => f.name === name);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    saveFavorites();
    renderFavorites();
    if (lastSuggestedRecipe && lastSuggestedRecipe.name === name) {
      updateFavButton();
    }
  }
});

// =======================
//  Categoría + icono
// =======================
function getCategoryAndIcon(recipe) {
  const name = (recipe.name || "").toLowerCase();
  const ing = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const text = name + " " + ing.join(" ");

  if (/ceviche|mariscos|pescado|pulpo|choritos|jalea|parihuela|tiradito/.test(text)) {
    return { category: "Marino", icon: "🐟" };
  }
  if (/sopa|caldo|aguadito|chupe|menestrón|sancochado|inchicapi|shámbar/.test(text)) {
    return { category: "Sopa / caldo", icon: "🍲" };
  }
  if (/tallarín|fideos|pasta/.test(text)) {
    return { category: "Pasta", icon: "🍝" };
  }
  if (/arroz/.test(text)) {
    return { category: "Arroz", icon: "🍚" };
  }
  return { category: "Criollo", icon: "🍽️" };
}

// =======================
//  Añadir plato
// =======================
addBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const ingrText = ingInput.value.trim();

  if (!name) {
    alert("El nombre del plato es obligatorio.");
    return;
  }

  let ingredients = [];
  if (ingrText.length > 0) {
    ingredients = ingrText
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter((x) => x.length > 0);
  }

  try {
    await addDoc(recipesCol, { name, ingredients });
    nameInput.value = "";
    ingInput.value = "";
    alert("Plato añadido ✔");
  } catch (err) {
    console.error(err);
    alert("Error al añadir el plato :(");
  }
});

// =======================
//  Sugerir plato (ruletita)
// =======================
suggestBtn.addEventListener("click", async () => {
  const filterText = filterInput.value.trim().toLowerCase();

  resultMessage.textContent = "";
  resultBlock.hidden = true;
  lastSuggestedRecipe = null;
  updateFavButton();

  try {
    const snapshot = await getDocs(recipesCol);
    const recipes = snapshot.docs.map((doc) => doc.data());

    let candidates = recipes;

    if (filterText.length > 0) {
      const filterIngredients = filterText
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter((x) => x.length > 0);

      candidates = recipes.filter(
        (r) =>
          Array.isArray(r.ingredients) &&
          r.ingredients.length > 0 &&
          filterIngredients.every((fi) => r.ingredients.includes(fi))
      );
    }

    if (!candidates.length) {
      resultMessage.textContent =
        "No encontré ningún plato con esos ingredientes 😢";
      return;
    }

    // ruleta visual
    suggestBtn.disabled = true;
    resultBlock.hidden = false;

    let count = 0;
    const maxCycles = 12;
    const interval = setInterval(() => {
      const tmp = candidates[Math.floor(Math.random() * candidates.length)];
      resultTitle.textContent = "Tal vez: " + tmp.name;
      resultCategory.textContent = "";
      resultIcon.textContent = "🎲";
      count++;

      if (count >= maxCycles) {
        clearInterval(interval);

        const chosen =
          candidates[Math.floor(Math.random() * candidates.length)];
        lastSuggestedRecipe = chosen;
        const info = getCategoryAndIcon(chosen);

        resultTitle.textContent = "Plato sugerido: " + chosen.name;
        resultCategory.textContent = "Categoría: " + info.category;
        resultIcon.textContent = info.icon;
        resultMessage.textContent = "";

        suggestBtn.disabled = false;
        updateFavButton();
      }
    }, 80);
  } catch (err) {
    console.error(err);
    resultMessage.textContent = "Error al buscar platos :(";
  }
});




// =======================
//  Lote de platos peruanos (costa + sierra)
// =======================

const nuevosPlatos = [
  // Tallarines
  ["Tallarín rojo con pollo", "pollo, tallarin, tomate, cebolla, ajo, zanahoria"],
  ["Tallarín rojo con carne", "carne, tallarin, tomate, cebolla, ajo"],
  ["Tallarín rojo con atún", "atun, tallarin, tomate, cebolla, ajo"],
  ["Tallarín verde con bistec", "bistec, tallarin, albahaca, espinaca, queso"],
  ["Tallarín verde con pollo", "pollo, tallarin, albahaca, espinaca, queso"],
  ["Tallarín saltado criollo", "tallarin, carne, cebolla, tomate, sillao"],
  ["Tallarín saltado de pollo", "tallarin, pollo, cebolla, tomate, sillao"],
  ["Tallarín saltado de verduras", "tallarin, verduras, zanahoria, pimiento, cebolla"],

  // Arroces
  ["Arroz con pollo clásico", "pollo, arroz, culantro, zanahoria, arveja"],
  ["Arroz con pollo al horno", "pollo, arroz, culantro, cerveza, zanahoria"],
  ["Arroz a la jardinera", "arroz, zanahoria, choclo, arveja"],
  ["Arroz blanco con huevo frito", "arroz, huevo, aceite"],
  ["Arroz con hot dog", "arroz, hot dog, cebolla, ajo"],
  ["Arroz chaufa de pollo", "arroz, pollo, huevo, cebolla china, sillao"],
  ["Arroz chaufa de chancho", "arroz, chancho, huevo, cebolla china, sillao"],
  ["Arroz chaufa de mariscos", "arroz, mariscos, huevo, cebolla china, sillao"],
  ["Arroz chaufa de verduras", "arroz, verduras, zanahoria, col, cebolla china"],
  ["Arroz tapado de carne", "arroz, carne molida, cebolla, aceituna, huevo"],
  ["Arroz tapado de atún", "arroz, atun, cebolla, aceituna, huevo"],
  ["Arroz con lentejas", "arroz, lentejas, cebolla, ajo"],
  ["Arroz con frejoles", "arroz, frejol, cebolla, ajo"],

  // Saltados y clásicos de sartén
  ["Lomo saltado clásico", "carne, papa frita, cebolla, tomate, sillao"],
  ["Saltado de pollo", "pollo, papa frita, cebolla, tomate, sillao"],
  ["Saltado de verduras", "verduras, cebolla, tomate, sillao"],
  ["Saltado de champiñones", "champiñones, cebolla, tomate, sillao"],
  ["Bistec a lo pobre", "bistec, huevo frito, platano frito, papa frita"],
  ["Bistec encebollado", "bistec, cebolla, ajo"],
  ["Hígado encebollado", "higado, cebolla, ajo"],

  // Guisos / secos / estofados
  ["Pollo guisado con papas", "pollo, papa, cebolla, tomate, ajo"],
  ["Estofado de pollo", "pollo, papa, zanahoria, arveja, vino, cebolla"],
  ["Estofado de carne", "carne, papa, zanahoria, arveja, cebolla"],
  ["Seco de pollo", "pollo, culantro, cebolla, ajo, cerveza"],
  ["Seco de carne", "carne, culantro, cebolla, ajo, cerveza"],
  ["Seco de cordero", "cordero, culantro, cebolla, ajo, chicha"],
  ["Seco de res con frejoles", "carne, frejol, culantro, cebolla"],
  ["Cau cau de pollo", "pollo, papa, aji amarillo, hierbabuena"],
  ["Cau cau de mondongo", "mondongo, papa, aji amarillo, hierbabuena"],
  ["Chanfainita", "mondongo, papa, hierbabuena, cebolla"],
  ["Olluquito con carne", "olluco, carne, aji panca, cebolla"],
  ["Olluquito con pollo", "olluco, pollo, aji panca, cebolla"],
  ["Locro de zapallo", "zapallo, papa, queso, choclo"],
  ["Charquicán", "carne seca, papa, zapallo, cebolla"],

  // Ajíes y cremas
  ["Ají de gallina simple", "pollo, pan, leche, aji amarillo, queso"],
  ["Ají de pollo con papa", "pollo, papa, aji amarillo, pan, leche"],
  ["Ají de atún", "atun, pan, leche, aji amarillo"],
  ["Papas a la huancaína", "papa, aji amarillo, queso fresco, leche, galleta"],
  ["Papas doradas con ensalada", "papa, aceite, lechuga, tomate, cebolla"],
  ["Ensalada rusa", "papa, zanahoria, arveja, betarraga, mayonesa"],
  ["Solterito arequipeño", "queso, habas, cebolla, tomate, aceituna"],

  // Purés / cremas
  ["Puré de papa", "papa, leche, mantequilla"],
  ["Puré de espinaca", "papa, espinaca, leche, mantequilla"],
  ["Puré de arracacha", "arracacha, leche, mantequilla"],
  ["Puré de zanahoria", "zanahoria, papa, leche"],
  ["Crema de zapallo", "zapallo, leche, cebolla"],
  ["Crema de espinaca", "espinaca, leche, cebolla"],
  ["Crema de choclo", "choclo, leche, cebolla"],

  // Sopas / caldos (sierra + caseras)
  ["Sopa de pollo con fideos", "pollo, fideo, zanahoria, papa"],
  ["Caldo de pollo con papa", "pollo, papa, fideo"],
  ["Sopa de quinua", "quinua, papa, zanahoria, zapallo"],
  ["Sopa de morón", "trigo, carne, papa"],
  ["Sopa de verduras casera", "verduras, zanahoria, papa, fideo"],
  ["Caldo de res casero", "carne, hueso, papa, fideo"],

  // Pescados / marinos simples
  ["Pescado frito con arroz", "pescado, harina, aceite, arroz"],
  ["Pescado frito con ensalada", "pescado, harina, aceite, lechuga, tomate"],
  ["Trucha frita con papas", "trucha, papa, aceite"],
  ["Trucha al ajo", "trucha, ajo, mantequilla"],
  ["Sudado de pescado simple", "pescado, tomate, cebolla, aji amarillo"],

  // Tortillas / desayunos
  ["Tortilla de papa", "papa, huevo, cebolla"],
  ["Tortilla de atún", "atun, huevo, cebolla"],
  ["Tortilla de verduras", "verduras, huevo, cebolla"],
  ["Omelette de queso y jamón", "huevo, queso, jamon"],
  ["Huevos revueltos con tomate", "huevo, tomate, cebolla"],

  // Cosas fritas / snacks
  ["Papa rellena", "papa, carne, cebolla, aceituna, huevo"],
  ["Empanadas de carne al horno", "masa, carne, cebolla, aceituna"],
  ["Pan con tortilla de verduras", "pan, huevo, verduras"],
  ["Pan con chicharrón de chancho", "pan, chancho, camote, salsa criolla"],

  // Menestras
  ["Frejoles con seco", "frejol, carne, culantro, arroz"],
  ["Lentejas estofadas", "lentejas, cebolla, ajo, zanahoria"],
  ["Pallares guisados", "pallares, cebolla, tomate, ajo"],

  // Postres básicos
  ["Mazamorra morada", "maiz morado, fruta, azucar, canela"],
  ["Arroz con leche", "arroz, leche, canela, azucar"],
  ["Arroz zambito", "arroz, chancaca, coco, leche"],
  ["Leche asada", "leche, huevo, azucar"],
  ["Queque de vainilla casero", "harina, huevo, leche, azucar, vainilla"]
];


// Cargar lote de nuevos platos en Firestore (usar UNA sola vez)
window.cargarNuevosPlatos = async function () {
  console.log("⏳ Empezando carga de platos peruanos...");

  for (const [name, ing] of nuevosPlatos) {
    const ingredients = ing
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    await addDoc(recipesCol, { name, ingredients });
    console.log("Añadido:", name);
  }

  console.log("✅ LISTO: nuevos platos añadidos a Firestore");
};





// =======================
//  init
// =======================
loadFavorites();
updateFavButton();
