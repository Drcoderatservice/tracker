// Firebase import
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA59yWPD0HcKVoz6h5-3q1x221tbTaFIQ",
  authDomain: "seriestracker-5014f.firebaseapp.com",
  projectId: "seriestracker-5014f",
  storageBucket: "seriestracker-5014f.firebasestorage.app",
  messagingSenderId: "811925715046",
  appId: "1:811925715046:web:2727e35e6fddb9f344d5a7"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;
let currentCategory = "Anime";
let data = [];
let viewMode = "poster";

window.toggleView = function(){
  viewMode = viewMode === "poster" ? "list" : "poster";
  render();
}

// Change category
window.setCategory = function(cat){
  currentCategory = cat;
  render();
}

// Load data from Firebase
async function loadData(){
  data = [];
  const querySnapshot = await getDocs(collection(db, "tracker"));
  querySnapshot.forEach((docSnap)=>{
    data.push({id: docSnap.id, ...docSnap.data()});
  });
  render();
}

// Add item
window.addItem = async function(){
  let title = document.getElementById("title").value.trim();
  let poster = document.getElementById("poster").value.trim();
  let watched = Number(document.getElementById("watched").value)||0;
  let total = Number(document.getElementById("total").value)||0;
  let status = document.getElementById("status").value;

  if(!title) return;

  await addDoc(collection(db,"tracker"),{
    title, poster, watched, total, status, category: currentCategory
  });

  loadData();
}

// +1 episode
window.plus = async function(i){
  let item = data[i];
  if(item.watched < item.total){
    await updateDoc(doc(db,"tracker",item.id),{
      watched: item.watched + 1
    });
  }
  loadData();
}
window.minus = async function(i){
  let item = data[i];

  if(item.watched > 0){
    await updateDoc(doc(db,"tracker",item.id),{
      watched: item.watched - 1
    });
  }

  loadData();
}
// Edit full
window.edit = async function(i){
  let item = data[i];

  let t = prompt("Title", item.title);
  let p = prompt("Poster URL", item.poster);
  let w = prompt("Watched", item.watched);
  let tot = prompt("Total", item.total);
  let s = prompt("Status", item.status);

  await updateDoc(doc(db,"tracker",item.id),{
    title: t ?? item.title,
    poster: p ?? item.poster,
    watched: Number(w ?? item.watched),
    total: Number(tot ?? item.total),
    status: s ?? item.status
  });

  loadData();
}

// Delete
window.del = async function(i){
  await deleteDoc(doc(db,"tracker",data[i].id));
  loadData();
}

// Render UI
function render(){
  let grid = document.getElementById("grid");
  grid.innerHTML = "";

  data.forEach((d,i)=>{
    if(d.category !== currentCategory) return;

    let card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      ${viewMode === "poster" && d.poster 
        ? `<img class="poster" src="${d.poster}">` 
        : ''}

      <div class="title">${d.title}</div>
      <div class="meta">${d.watched}/${d.total} • ${d.status}</div>

      <div class="actions">
        <button class="plus" onclick="plus(${i})">+1</button>
        <button onclick="minus(${i})">-1</button>
        <button class="edit" onclick="edit(${i})">Edit</button>
        <button class="del" onclick="del(${i})">X</button>
      </div>
    `;

    grid.appendChild(card);
  });
}
// First load
loadData();
window.signup = async function(){
  let email = document.getElementById("email").value;
  let pass = document.getElementById("password").value;

  await createUserWithEmailAndPassword(auth, email, pass);
  alert("Signup successful");
}

window.login = async function(){
  let email = document.getElementById("email").value;
  let pass = document.getElementById("password").value;

  await signInWithEmailAndPassword(auth, email, pass);
  alert("Login successful");
}

window.logout = async function(){
  await signOut(auth);
  alert("Logged out");
}
