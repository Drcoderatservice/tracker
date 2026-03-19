// Firebase import
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyA59yWPDOHcKVozo6h5-3q1x221tbTaFIQ",
    authDomain: "seriestracker-5014f.firebaseapp.com",
    projectId: "seriestracker-5014f",
    storageBucket: "seriestracker-5014f.firebasestorage.app",
    messagingSenderId: "811925715046",
    appId: "1:811925715046:web:2727e35e6fddb9f344d5a7",
    measurementId: "G-MX8465KQRX"
  };

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;
let currentCategory = "Anime";
let data = [];
let viewMode = localStorage.getItem("viewMode") || "poster";
let sortMode = "az";
window.toggleView = function(){
  viewMode = viewMode === "poster" ? "list" : "poster";

  localStorage.setItem("viewMode", viewMode);

  render();
}

// Change category
window.setCategory = function(cat){
  currentCategory = cat;

  let s = document.getElementById("search");
  if(s){
    s.value = "";
  }

  render();
};

// Load data from Firebase
async function loadData(){
  data = [];
  const querySnapshot = await getDocs(collection(db, "tracker"));
  querySnapshot.forEach((docSnap)=>{
  let item = {id: docSnap.id, ...docSnap.data()};
  
  if(item.userId === currentUser){
    data.push(item);
  }
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
  title, poster, watched, total, status,
  category: currentCategory,
  userId: currentUser
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
window.render = function(){
  let grid = document.getElementById("grid");
  grid.innerHTML = "";

  // 👇 SAFE SORT (copy of data, original ko mess nahi karega)
  let sortedData = [...data];
    let searchText = document.getElementById("search")?.value.toLowerCase() || "";    

 if(sortMode === "az"){
  sortedData.sort((a,b)=> a.title.localeCompare(b.title));
}
else if(sortMode === "za"){
  sortedData.sort((a,b)=> b.title.localeCompare(a.title));
}
else if(sortMode === "new"){
  sortedData.sort((a,b)=> (b.createdAt || 0) - (a.createdAt || 0));
}
else if(sortMode === "old"){
  sortedData.sort((a,b)=> (a.createdAt || 0) - (b.createdAt || 0));
}
    
  sortedData.forEach((d,index)=>{
      if(searchText && !d.title.toLowerCase().includes(searchText)) return;
    if(d.category !== currentCategory) return;
     
      let i = data.findIndex(x => x.id === d.id);

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
window.applySort = function(){
  let option = document.getElementById("sortOption").value;

  if(option === "az"){
    data.sort((a,b)=> a.title.localeCompare(b.title));
  }

  else if(option === "za"){
    data.sort((a,b)=> b.title.localeCompare(a.title));
  }

  else if(option === "new"){
    data.sort((a,b)=> b.id.localeCompare(a.id));
  }

  else if(option === "old"){
    data.sort((a,b)=> a.id.localeCompare(b.id));
  }

  render();
}

onAuthStateChanged(auth, (user)=>{
  if(user){
    currentUser = user.uid;
    loadData(); // login pe data load
      loadSharedList();
  } else {
    currentUser = null;
    data = [];
    
    // UI clear karo
    document.getElementById("grid").innerHTML = "";
  }
});
window.applySort = function(){
  sortMode = document.getElementById("sortOption").value;
  render();
}
window.shareList = async function(){

  let userData = data.filter(d => d.userId === currentUser);

  if(userData.length === 0){
    alert("List empty hai!");
    return;
  }

  // 🔥 Firebase me save
  const docRef = await addDoc(collection(db, "sharedLists"), {
    list: userData,
    createdAt: Date.now()
  });

  let url = `${window.location.origin}?list=${docRef.id}`;

  navigator.clipboard.writeText(url);

  alert("Share link copied 🔥");
}    
// 🔥 LOAD SHARED LIST (FIXED)
window.loadSharedList = async function(){

  const params = new URLSearchParams(window.location.search);
  const listId = params.get("list");

  if(!listId) return;

  const querySnapshot = await getDocs(collection(db, "sharedLists"));

  querySnapshot.forEach((docSnap)=>{
    if(docSnap.id === listId){
      data = docSnap.data().list;
      render();
    }
  });

  alert("Shared list loaded 🚀");
}
window.shareList = async function(){

  let userData = data.filter(d => d.userId === currentUser);

  if(userData.length === 0){
    alert("List empty hai!");
    return;
  }
