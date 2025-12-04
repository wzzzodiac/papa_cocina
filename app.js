import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Config de tu Firebase
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
const db  = getFirestore(app);
const recipesCol = collection(db, "recipes");

// DOM
const nameInput    = document.getElementById("name");
const ingInput     = document.getElementById("ingredients");
const filterInput  = document.getElementById("filter");
const addBtn       = document.getElementById("addBtn");
const suggestBtn   = document.getElementById("suggestBtn");

const resultBlock   = document.getElementById("resultBlock");
const resultIcon    = document.getElementById("resultIcon");
const resultTitle   = document.getElementById("resultTitle");
const resultCategory= document.getElementById("resultCategory");
const resultMessage = document.getElementById("resultMessage");

const favBtn         = document.getElementById("favBtn");
const favoritesList  = document.getElementById("favoritesList");
const favoritesEmpty = document.getElementById("favoritesEmpty");

// Estado
let lastSuggestedRecipe = null;
let favorites = [];

// ---------- Helpers de favoritos ----------

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

function renderFavorites() {
  favoritesList.innerHTML = "";
  if (!favorites.length) {
    favoritesEmpty.style.display = "block";
    return;
  }
  favoritesEmpty.style.display = "none";

  favorites.forEach(f => {
    const li = document.createElement("li");
    const spanIcon = document.createElement("span");
    spanIcon.className = "fav-li-icon";
    spanIcon.textContent = f.icon || "🍽️";

    const spanText = document.createElement("span");
    spanText.textContent = f.name;

    li.appendChild(spanIcon);
    li.appendChild(spanText);
    favoritesList.appendChild(li);
  });
}

function isFavorite(name) {
  return favorites.some(f => f.name === name);
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

  const idx = favorites.findIndex(f => f.name === name);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push({ name, icon });
  }
  saveFavorites();
  renderFavorites();
  updateFavButton();
}

favBtn.addEventListener("click", toggleFavorite);

// ---------- Categoría + icono ----------

function getCategoryAndIcon(recipe) {
  const name = (recipe.name || "").toLowerCase();
  const ing  = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const text = name + " " + ing.join(" ");

  if (/ceviche|mariscos|pescado|pulpo|choritos|jalea|parihuela|tiradito/.test(text))
    return { category: "Marino", icon: "🐟" };

  if (/sopa|caldo|aguadito|chupe|menestrón|sancochado|inchicapi|shámbar/.test(text))
    return { category: "Sopa / caldo", icon: "🍲" };

  if (/tallarín|fideos|pasta/.test(text))
    return { category: "Pasta", icon: "🍝" };

  if (/arroz/.test(text))
    return { category: "Arroz", icon: "🍚" };

  return { category: "Criollo", icon: "🍽️" };
}

// ---------- Añadir plato ----------

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
      .map(x => x.trim().toLowerCase())
      .filter(x => x.length > 0);
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

// ---------- Sugerir plato (con ruletita) ----------

suggestBtn.addEventListener("click", async () => {
  const filterText = filterInput.value.trim().toLowerCase();
  resultMessage.textContent = "";
  resultBlock.hidden = true;
  lastSuggestedRecipe = null;
  updateFavButton();

  try {
    const snapshot = await getDocs(recipesCol);
    const recipes = snapshot.docs.map(doc => doc.data());

    let candidates = recipes;

    if (filterText.length > 0) {
      const filterIngredients = filterText
        .split(",")
        .map(x => x.trim().toLowerCase())
        .filter(x => x.length > 0);

      candidates = recipes.filter(r =>
        Array.isArray(r.ingredients) &&
        r.ingredients.length > 0 &&
        filterIngredients.every(fi => r.ingredients.includes(fi))
      );
    }

    if (!candidates.length) {
      resultMessage.textContent = "No encontré ningún plato con esos ingredientes 😢";
      return;
    }

    // Ruletita
    suggestBtn.disabled = true;
    resultBlock.hidden = false;
    let count = 0;
    const maxCycles = 12;   // cuántas vueltas más o menos
    const interval = setInterval(() => {
      const tmp = candidates[Math.floor(Math.random() * candidates.length)];
      resultTitle.textContent = "Tal vez: " + tmp.name;
      resultCategory.textContent = "";
      resultIcon.textContent = "🎲";
      count++;
      if (count >= maxCycles) {
        clearInterval(interval);
        // resultado final
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
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

// ----- init -----
loadFavorites();
updateFavButton();

// --- CLICK EN UN FAVORITO PARA MOSTRAR ARRIBA ---
document.getElementById("favoritos-lista").addEventListener("click", (e) => {
    if (!e.target.classList.contains("fav-item")) return;

    const plato = e.target.dataset.name;
    const categoria = e.target.dataset.cat;

    mostrarPlatoSugerido(plato, categoria, true);
});

// --- FUNCIÓN EXTRA PARA ANIMACIÓN ---
function mostrarPlatoSugerido(nombre, categoria, animar = false) {
    const resultado = document.getElementById("resultado-sugerencia");
    resultado.innerHTML = `
        <div class="plato-card ${animar ? "animate-pop" : ""}">
            <div class="icon">${iconoPorCategoria(categoria)}</div>
            <h3>${nombre}</h3>
            <p class="categoria">${categoria}</p>
        </div>
    `;
}

function toggleFavorite(recipeName) {
  const favs = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

  if (favs.has(recipeName)) {
    favs.delete(recipeName); // quitar
  } else {
    favs.add(recipeName); // agregar
  }

  localStorage.setItem("favorites", JSON.stringify([...favs]));
  updateFavButton();
}

function updateFavButton() {
  const favs = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

  if (!lastSuggestedRecipe) return;

  if (favs.has(lastSuggestedRecipe.name)) {
    favBtn.textContent = "★ Quitar de favoritos";
    favBtn.classList.add("fav-active");
  } else {
    favBtn.textContent = "☆ Añadir a favoritos";
    favBtn.classList.remove("fav-active");
  }
}

