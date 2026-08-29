import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, addDoc, collection, onSnapshot, query, orderBy, serverTimestamp, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const configured=!firebaseConfig.apiKey.startsWith("PASTE_");
let auth,db;
if(configured){const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);}

const $=id=>document.getElementById(id);
const money=n=>"৳"+Number(n||0).toLocaleString("en-BD");
const page=location.pathname.split("/").pop()||"index.html";

const i18n={
 bn:{welcome:"Amar Basha",subtitle:"বাসার ভাড়া ও হিসাব ব্যবস্থাপনা",login:"Login",register:"Register",createAccount:"Create Tenant Account",notices:"Notices"},
 en:{welcome:"Amar Basha",subtitle:"Home rent & account management",login:"Login",register:"Register",createAccount:"Create Tenant Account",notices:"Notices"}
};
function setLang(lang){localStorage.lang=lang;document.documentElement.lang=lang;document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=i18n[lang][e.dataset.i18n]||e.textContent);if($("langBtn"))$("langBtn").textContent=lang==="bn"?"English":"বাংলা";}
setLang(localStorage.lang||"bn");
$("langBtn")?.addEventListener("click",()=>setLang((localStorage.lang||"bn")==="bn"?"en":"bn"));

if(!configured){
  $("msg") && ($("msg").innerHTML="⚠️ Firebase config বসান: <b>firebase-config.js</b>");
}

$("logout")?.addEventListener("click",async()=>{if(auth)await signOut(auth);location.href="index.html";});

if(page==="index.html"||page===""){
  const tabs=document.querySelectorAll(".tab");
  tabs.forEach(t=>t.onclick=()=>{tabs.forEach(x=>x.classList.remove("active"));t.classList.add("active");$("loginForm").classList.toggle("hidden",t.dataset.tab!=="login");$("registerForm").classList.toggle("hidden",t.dataset.tab!=="register");});
  $("loginForm")?.addEventListener("submit",async e=>{e.preventDefault();if(!auth)return;try{await signInWithEmailAndPassword(auth,$("loginEmail").value,$("loginPassword").value);}catch(err){$("msg").textContent=err.message;}});
  $("registerForm")?.addEventListener("submit",async e=>{e.preventDefault();if(!auth)return;try{
    const cred=await createUserWithEmailAndPassword(auth,$("regEmail").value,$("regPassword").value);
    await setDoc(doc(db,"users",cred.user.uid),{name:$("regName").value,flat:$("regFlat").value,phone:$("regPhone").value,email:$("regEmail").value,role:"tenant",rent:0,serviceCharge:0,otherExpense:0,paid:0,due:0,createdAt:serverTimestamp()});
  }catch(err){$("msg").textContent=err.message;}});
}

function guard(){
 if(!auth)return;
 onAuthStateChanged(auth,async user=>{
   if(!user){if(page!=="index.html"&&page!=="")location.href="index.html";return;}
   if(page==="index.html"||page===""){
     const u=await getDoc(doc(db,"users",user.uid)); if(u.exists()&&u.data().role==="admin")location.href="admin.html"; else location.href="dashboard.html";
   }
   if(page==="dashboard.html")loadTenant(user.uid);
   if(page==="admin.html")loadAdmin(user.uid);
 });
}
guard();

function loadTenant(uid){
 onSnapshot(doc(db,"users",uid),snap=>{
  if(!snap.exists())return;
  const d=snap.data();$("tenantName").textContent=d.name||"Tenant";$("tenantFlat").textContent=(d.flat||"")+" • "+(d.phone||"");
  $("rent").textContent=money(d.rent);$("service").textContent=money(d.serviceCharge);$("other").textContent=money(d.otherExpense);$("due").textContent=money(d.due);
 });
 onSnapshot(query(collection(db,"notices"),orderBy("createdAt","desc")),snap=>{
  $("notices").innerHTML=snap.empty?'<p class="muted">No notices.</p>':snap.docs.map(x=>{let d=x.data();return `<div class="notice"><b>${esc(d.title)}</b><span class="muted">${esc(d.body)}</span></div>`}).join("");
 });
 onSnapshot(query(collection(db,"users",uid,"payments"),orderBy("date","desc")),snap=>{
  $("history").innerHTML=snap.empty?'<p class="muted">No payment history.</p>':`<table><tr><th>Date</th><th>Amount</th><th>Note</th></tr>${snap.docs.map(x=>{let d=x.data();return `<tr><td>${esc(d.date||"")}</td><td>${money(d.amount)}</td><td>${esc(d.note||"")}</td></tr>`}).join("")}</table>`;
 });
 $("pdfBtn").onclick=()=>tenantPDF(uid);
}

async function tenantPDF(uid){
 const d=(await getDoc(doc(db,"users",uid))).data();
 const w=window.open("","_blank"); if(!w)return;
 w.document.write(`<html><head><title>Amar Bashar Hishab</title><style>body{font-family:Arial;padding:40px;color:#172b4d}.water{position:fixed;inset:35% 0;text-align:center;font-size:65px;color:#1769aa18;transform:rotate(-25deg);font-weight:800}h1{color:#1769aa}table{width:100%;border-collapse:collapse}td{padding:12px;border-bottom:1px solid #ddd}.total{font-weight:bold;font-size:20px}</style></head><body><div class="water">🏠 AMAR BASHAR HISHAB</div><h1>🏠 Amar Basha</h1><h2>Amar Bashar Hishab</h2><p>Tenant: ${esc(d.name)}<br>Flat/Room: ${esc(d.flat)}<br>Mobile: ${esc(d.phone)}</p><table><tr><td>Monthly Rent</td><td>${money(d.rent)}</td></tr><tr><td>Service Charge</td><td>${money(d.serviceCharge)}</td></tr><tr><td>Other Expense</td><td>${money(d.otherExpense)}</td></tr><tr class="total"><td>Total Due</td><td>${money(d.due)}</td></tr></table><p>Generated by 🏠 Amar Basha</p><script>window.print()<\/script></body></html>`);w.document.close();
}

function loadAdmin(uid){
 getDoc(doc(db,"users",uid)).then(s=>{if(!s.exists()||s.data().role!=="admin"){location.href="dashboard.html";}});
 onSnapshot(query(collection(db,"users"),orderBy("createdAt","desc")),snap=>{
  let arr=snap.docs.map(x=>({id:x.id,...x.data()})).filter(x=>x.role==="tenant");
  $("totalTenants").textContent=arr.length;
  $("expectedRent").textContent=money(arr.reduce((a,x)=>a+Number(x.rent||0),0));
  $("expectedService").textContent=money(arr.reduce((a,x)=>a+Number(x.serviceCharge||0),0));
  $("totalDue").textContent=money(arr.reduce((a,x)=>a+Number(x.due||0),0));
  $("tenantTable").innerHTML=arr.length?`<table><tr><th>Name</th><th>Flat</th><th>Rent</th><th>Service</th><th>Due</th><th>Action</th></tr>${arr.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.flat)}</td><td>${money(x.rent)}</td><td>${money(x.serviceCharge)}</td><td><span class="badge ${x.due?'due':''}">${money(x.due)}</span></td><td class="actions"><button class="ghost" onclick='editTenant("${x.id}")'>Edit</button><button class="ghost" onclick='addPayment("${x.id}")'>Paid</button></td></tr>`).join("")}</table>`:'<p class="muted">No tenants yet.</p>';
 });
 onSnapshot(query(collection(db,"notices"),orderBy("createdAt","desc")),snap=>{
  $("adminNotices").innerHTML=snap.docs.map(x=>`<div class="notice"><b>${esc(x.data().title)}</b><span class="muted">${esc(x.data().body)}</span><br><button class="ghost" onclick='removeNotice("${x.id}")'>Delete</button></div>`).join("")||'<p class="muted">No notices.</p>';
 });
 $("addTenantBtn").onclick=()=>tenantModal();
 $("addNoticeBtn").onclick=()=>noticeModal();
 $("allPdfBtn").onclick=()=>allPDF();
}

function modal(title,html,submit){
 $("modalTitle").textContent=title;$("modalForm").innerHTML=html;$("modal").classList.remove("hidden");$("modalForm").onsubmit=async e=>{e.preventDefault();await submit();$("modal").classList.add("hidden");};
}
$("closeModal")?.addEventListener("click",()=>$("modal").classList.add("hidden"));
function tenantModal(id=null,data={}){
 modal(id?"Edit Tenant":"Add Tenant",`<input id="mName" placeholder="Full name" value="${esc(data.name||"")}" required><input id="mFlat" placeholder="Flat / Room" value="${esc(data.flat||"")}" required><input id="mPhone" placeholder="Mobile" value="${esc(data.phone||"")}" required><input id="mRent" type="number" placeholder="Monthly Rent" value="${data.rent||0}"><input id="mService" type="number" placeholder="Service Charge" value="${data.serviceCharge||0}"><input id="mOther" type="number" placeholder="Other Expense" value="${data.otherExpense||0}"><input id="mPaid" type="number" placeholder="Paid" value="${data.paid||0}"><input id="mDue" type="number" placeholder="Due" value="${data.due||0}"><button class="primary">Save Tenant</button>`,async()=>{
 let obj={name:$("mName").value,flat:$("mFlat").value,phone:$("mPhone").value,rent:+$("mRent").value,serviceCharge:+$("mService").value,otherExpense:+$("mOther").value,paid:+$("mPaid").value,due:+$("mDue").value};
 if(id)await updateDoc(doc(db,"users",id),obj); else { alert("For a new tenant account, let the tenant register first, then edit their account here. Firebase Admin user creation requires a server/Admin SDK."); }
 });
}
window.editTenant=async id=>{let s=await getDoc(doc(db,"users",id));tenantModal(id,s.data())};
window.addPayment=async id=>{modal("Record Payment",`<input id="pAmount" type="number" placeholder="Paid amount" required><input id="pDate" type="date" required><input id="pNote" placeholder="Note"><button class="primary">Save Payment</button>`,async()=>{let s=await getDoc(doc(db,"users",id)),d=s.data(),a=+$("pAmount").value;await updateDoc(doc(db,"users",id),{paid:Number(d.paid||0)+a,due:Math.max(0,Number(d.due||0)-a)});await addDoc(collection(db,"users",id,"payments"),{amount:a,date:$("pDate").value,note:$("pNote").value,createdAt:serverTimestamp()});});};
function noticeModal(){modal("New Notice",`<input id="nTitle" placeholder="Notice title" required><textarea id="nBody" placeholder="Notice details" required></textarea><button class="primary">Publish Notice</button>`,async()=>addDoc(collection(db,"notices"),{title:$("nTitle").value,body:$("nBody").value,createdAt:serverTimestamp()}));}
window.removeNotice=async id=>{if(confirm("Delete notice?"))await deleteDoc(doc(db,"notices",id));};
async function allPDF(){let s=await getDoc(doc(db,"users","__dummy__")); /* keeps function async */ let q=await new Promise(resolve=>onSnapshot(collection(db,"users"),x=>resolve(x)));let arr=q.docs.map(x=>x.data()).filter(x=>x.role==="tenant");let rows=arr.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.flat)}</td><td>${money(x.rent)}</td><td>${money(x.serviceCharge)}</td><td>${money(x.due)}</td></tr>`).join("");let w=window.open("","_blank");w.document.write(`<html><head><title>Amar Basha Report</title><style>body{font-family:Arial;padding:35px}.water{position:fixed;inset:40% 0;text-align:center;font-size:70px;color:#1769aa18;transform:rotate(-25deg);font-weight:800}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}h1{color:#1769aa}</style></head><body><div class="water">🏠 AMAR BASHA</div><h1>🏠 Amar Basha — Tenant Report</h1><p>Total Tenants: ${arr.length}</p><table><tr><th>Name</th><th>Flat</th><th>Rent</th><th>Service</th><th>Due</th></tr>${rows}</table><script>window.print()<\/script></body></html>`);w.document.close();}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
