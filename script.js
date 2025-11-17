// ❌ SUPABASE CONFIGURATION: Put your URL and ANON KEY here
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const uploadSection = document.getElementById("upload-section");
const fileInput = document.getElementById("file-input");
const fileNameInput = document.getElementById("file-name");
const fileTypeSelect = document.getElementById("file-type");
const textContent = document.getElementById("text-content");
const uploadBtn = document.getElementById("upload-btn");

const searchSection = document.getElementById("search-section");
const searchInput = document.getElementById("search-input");
const searchDate = document.getElementById("search-date");
const searchBtn = document.getElementById("search-btn");

const gallery = document.getElementById("gallery");

// Toggle text area for text files
fileTypeSelect.addEventListener("change", () => {
  if(fileTypeSelect.value === "text") {
    textContent.style.display = "block";
  } else {
    textContent.style.display = "none";
  }
});

// SIGNUP
signupBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { user, error } = await supabase.auth.signUp({ email, password });
  if(error) alert(error.message);
  else alert("Ro'yxatdan o'tdingiz. Iltimos emailni tasdiqlang!");
});

// LOGIN
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) alert(error.message);
  else initApp();
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

// Initialize App after login
async function initApp() {
  signupBtn.style.display = "none";
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
  uploadSection.style.display = "block";
  searchSection.style.display = "block";
  loadGallery();
}

// UPLOAD
uploadBtn.addEventListener("click", async () => {
  const type = fileTypeSelect.value;
  let name = fileNameInput.value || "untitled";
  let url = "";

  if(type === "text") {
    const content = textContent.value;
    const { data, error } = await supabase.storage.from("media").upload(`texts/${name}.txt`, new Blob([content], {type:"text/plain"}));
    if(error) return alert(error.message);
    url = supabase.storage.from("media").getPublicUrl(`texts/${name}.txt`).data.publicUrl;
  } else {
    const files = fileInput.files;
    if(!files.length) return alert("Fayl tanlang");
    const file = files[0];
    const path = `${type}s/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from("media").upload(path, file);
    if(error) return alert(error.message);
    url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  // Save metadata
  await supabase.from("files").insert([{ name, type, url }]);
  fileInput.value = "";
  fileNameInput.value = "";
  textContent.value = "";
  loadGallery();
});

// LOAD GALLERY
async function loadGallery() {
  gallery.innerHTML = "";
  let query = supabase.from("files").select("*").order("created_at",{ascending:false});
  // Apply search filters
  if(searchInput.value) {
    query = query.ilike("name", `%${searchInput.value}%`);
  }
  if(searchDate.value) {
    query = query.eq("created_at", searchDate.value);
  }
  const { data, error } = await query;
  if(error) return alert(error.message);

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h4>${item.name}</h4>`;
    if(item.type==="image") card.innerHTML += `<img src="${item.url}">`;
    else if(item.type==="video") card.innerHTML += `<video src="${item.url}" controls></video>`;
    else card.innerHTML += `<p>${item.url}</p>`;
    gallery.appendChild(card);
  });
}

// SEARCH
searchBtn.addEventListener("click", loadGallery);

// Check session
supabase.auth.getSession().then(({ data: { session } }) => {
  if(session) initApp();
});
