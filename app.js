// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// 1) TU CONFIG DE FIREBASE (la que acabas de sacar)
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

// DOM
const nameInput = document.getElementById("name");
const ingInput  = document.getElementById("ingredients");
const filterInput = document.getElementById("filter");
const resultEl = document.getElementById("result");

document.getElementById("addBtn").onclick = async () => {
  const name = nameInput.value.trim();
  const ingredients = ingInput.value.split(",").map(x => x.trim().toLowerCase());

  if (!name || ingredients.length === 0) {
    alert("Pon un nombre y al menos un ingrediente");
    return;
  }

  await addDoc(recipesCol, { name, ingredients });
  nameInput.value = "";
  ingInput.value = "";
  alert("Plato añadido ✔");
};

document.getElementById("suggestBtn").onclick = async () => {
  const filterText = filterInput.value.trim().toLowerCase();
  const snapshot = await getDocs(recipesCol);
  const recipes = snapshot.docs.map(doc => doc.data());

  let filtered = recipes;
  if (filterText) {
    const filterIngredients = filterText.split(",").map(x => x.trim());
    filtered = recipes.filter(r =>
      filterIngredients.every(fi => r.ingredients.includes(fi))
    );
  }

  if (filtered.length === 0) {
    resultEl.textContent = "No encontré nada con esos ingredientes :(";
    return;
  }

  const random = filtered[Math.floor(Math.random() * filtered.length)];
  resultEl.textContent = "Plato sugerido: " + random.name;
};

