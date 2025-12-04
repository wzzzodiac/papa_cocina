// Importar Firebase (SDK modular desde CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Config de tu proyecto (la que te dio Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyC9AfSi-sI1EWP6bp1NBI-z0Cmap_nE7c",
  authDomain: "papa-cocina.firebaseapp.com",
  projectId: "papa-cocina",
  storageBucket: "papa-cocina.firebasestorage.app",
  messagingSenderId: "479896054588",
  appId: "1:479896054588:web:6fdba3ce1119fa67de29b9",
  measurementId: "G-BKJESVDY64"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const recipesCol = collection(db, "recipes");

// Referencias al DOM
const nameInput    = document.getElementById("name");         // nombre plato
const ingInput     = document.getElementById("ingredients");  // ingredientes/tags
const filterInput  = document.getElementById("filter");       // búsqueda
const resultEl     = document.getElementById("result");       // texto resultado
const addBtn       = document.getElementById("addBtn");
const suggestBtn   = document.getElementById("suggestBtn");

// =============== AÑADIR PLATO =================
addBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const ingrText = ingInput.value.trim();

  if (!name) {
    alert("El nombre del plato es obligatorio.");
    return;
  }

  // Ingredientes / tags opcionales
  let ingredients = [];
  if (ingrText.length > 0) {
    ingredients = ingrText
      .split(",")
      .map(x => x.trim().toLowerCase())
      .filter(x => x.length > 0);
  }

  try {
    await addDoc(recipesCol, {
      name,
      ingredients   // puede ser [] si no escribió nada
    });

    nameInput.value = "";
    ingInput.value = "";
    alert("Plato añadido ✔");
  } catch (err) {
    console.error(err);
    alert("Error al añadir el plato :(");
  }
});

// =============== BUSCAR / SUGERIR PLATO =================
suggestBtn.addEventListener("click", async () => {
  const filterText = filterInput.value.trim().toLowerCase();

  try {
    const snapshot = await getDocs(recipesCol);
    const recipes = snapshot.docs.map(doc => doc.data());

    let candidates = recipes;

    if (filterText.length > 0) {
      const filterIngredients = filterText
        .split(",")
        .map(x => x.trim().toLowerCase())
        .filter(x => x.length > 0);

      // Solo filtra en recetas que tengan array de ingredientes
      candidates = recipes.filter(r =>
        Array.isArray(r.ingredients) &&
        r.ingredients.length > 0 &&
        filterIngredients.every(fi => r.ingredients.includes(fi))
      );
    }

    if (candidates.length === 0) {
      resultEl.textContent = "No encontré ningún plato con esos ingredientes 😢";
      return;
    }

    const random = candidates[Math.floor(Math.random() * candidates.length)];
    resultEl.textContent = "Plato sugerido: " + random.name;
  } catch (err) {
    console.error(err);
    resultEl.textContent = "Error al buscar platos :(";
  }
});





// ------- SOLO PARA RELLENAR LA BD UNA VEZ --------
window.seedRecipes = async function () {
  const platos = [
    ["Ají de gallina","pollo, papa, arroz"],
    ["Lomo saltado","carne, cebolla, tomate"],
    ["Seco de res","carne, culantro, arroz"],
    ["Seco de pollo","pollo, culantro, arroz"],
    ["Cau cau","mondongo, papa, arroz"],
    ["Carapulcra","papa seca, cerdo, mani"],
    ["Arroz con pollo","pollo, arroz, culantro"],
    ["Arroz chaufa","arroz, pollo, huevo"],
    ["Tallarín saltado","fideos, carne"],
    ["Tallarín verde","fideos, espinaca, queso"],
    ["Tallarín rojo","fideos, pollo, tomate"],
    ["Papa a la huancaína","papa, queso, huacatay"],
    ["Ocopa","papa, huacatay, mani"],
    ["Estofado de pollo","pollo, papa, zanahoria"],
    ["Pollo al horno","pollo, papa, especias"],
    ["Albóndigas en salsa","carne molida, tomate, arroz"],
    ["Picante de carne","carne, papa, aji"],
    ["Chanfainita","bofe, papa, arroz"],
    ["Sudado de pescado","pescado, tomate, cebolla"],
    ["Cau cau de pollo","pollo, papa, aji"],
    ["Ceviche","pescado, limón, cebolla"],
    ["Arroz con mariscos","mariscos, arroz"],
    ["Chicharrón de pescado","pescado, harina"],
    ["Jalea","pescado, mariscos, fritura"],
    ["Parihuela","mariscos, pescado, caldo"],
    ["Choritos a la chalaca","choros, cebolla, tomate"],
    ["Sudado de mariscos","mariscos, tomate, cebolla"],
    ["Pulpo al olivo","pulpo, aceituna"],
    ["Tiradito","pescado, limón, ají"],
    ["Causa de atún","atún, papa"],
    ["Sopa wantán","pollo, fideos, verduras"],
    ["Aguadito de pollo","pollo, arroz, culantro"],
    ["Caldo de gallina","gallina, fideos, huevo"],
    ["Chupe de camarones","camarones, leche, arroz"],
    ["Inchicapi","pollo, mani, yuca"],
    ["Sancochado","carne, papa, verduras"],
    ["Menestrón","fideos, frejoles, verduras"],
    ["Shámbar","trigo, pellejo, menestra"],
    ["Juane","pollo, arroz, hoja"],
    ["Tacacho con cecina","platano, cecina"],
    ["Patacones","platano, fritura"],
    ["Adobo arequipeño","cerdo, chicha, aji"],
    ["Picante a la tacneña","carne, papa"],
    ["Qapchi","queso, papa, huacatay"],
    ["Cuy chactado","cuy, fritura"],
    ["Pachamanca","carne, hierbas"],
    ["Arroz tapado","carne molida, arroz"],
    ["Majado de yuca","yuca, cerdo"],
    ["Tortilla de verduras","huevo, verduras"],
    ["Pollo saltado","pollo, cebolla, tomate"]
  ];

  for (const [name, ing] of platos) {
    await addDoc(recipesCol, {
      name,
      ingredients: ing.split(",").map(x => x.trim().toLowerCase())
    });
    console.log("Añadido:", name);
  }

  console.log("✔ LISTO — 50 platos añadidos a Firebase");
};
// ------- FIN SEED --------
