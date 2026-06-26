

    const API_BASE = window.location.origin === 'null' ? 'http://127.0.0.1:5001' : window.location.origin;
    const COUNTRIES_API = `${API_BASE}/countries`;
    const SUBMIT_API = `${API_BASE}/api/submit`;
    const SAVE_API = `${API_BASE}/save`;
    

 // ── On Page Load: pXopulate Country Code + Country dropdowns ──────this code for when page load that time show the country code and country name in dropdown and that time all api call and get the data amd show in dropdwon in index.html 
    window.addEventListener("DOMContentLoaded", async () => {
      showSpinner("spin-code", true); 
      showSpinner("spin-country", true);
 
      try { // data show to
        const res  = await fetch(COUNTRIES_API);
        const data = await res.json();

        // Sort alphabetically by country name
        data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        const codeSelect    = document.getElementById("country-code");
        const countrySelect = document.getElementById("country");

        data.forEach(({ name, code, dial }) => {

// Dial code option
          if (dial && dial !== "") { // its check if dial code is not empty then show the data in dropdown in index.html 
            const opt = document.createElement("option");
            opt.value = dial;// value set karse tyre backend ma code data save karse 
            opt.textContent = `${code} ${dial}`;
            codeSelect.appendChild(opt);
          }

// Country option (carries code as data attr for future use) option to show the  cpountry name in country fild and that time call the api and get the data and show in dropdown in index.html 
          const opt2 = document.createElement("option");
          opt2.value       = name;//country name show karse in  index
          opt2.dataset.code = code;// this only  line to sort form ok country code  to  to state select karva mate help kare chee 
          opt2.textContent = name; // country name show karse in  index
          countrySelect.appendChild(opt2);
        })
      } catch (err) { // internet is not working and also server that time show this error 
        showToast("⚠ Could not load country data. Check if server is running.", "error");
      } finally {
        showSpinner("spin-code", false); // help to error show karva 
        showSpinner("spin-country", false);
      }
    });






// if new country select karva and change karva mate 
    document.getElementById("country").addEventListener("change", async function () {
      const stateSelect = document.getElementById("state");
      const selectedOpt = this.selectedOptions && this.selectedOptions[0];
      const code = selectedOpt ? selectedOpt.dataset.code : null;

      
      try {
    
        const res = await fetch(`${API_BASE}/states/${encodeURIComponent(code)}`);
        if (!res.ok) throw new Error('No states');
        const data = await res.json();
        const states = data.states || [];

        if (states.length === 0) { // if country na state na hoy to aa error shoe karavse 
          stateSelect.innerHTML = '<option value="">States data not available</option>';
          stateSelect.disabled = true;
        } else {
          // ifstates available  that timen shoe this type of mmessage print 
          stateSelect.disabled = false;
          const prompt = document.createElement('option');
          prompt.value = '';
          prompt.textContent = 'Select state';
          stateSelect.appendChild(prompt);
          
// id s like state to select and serch karva mate and that time call the api and get the data and show in dropdown in index.html
          states.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            stateSelect.appendChild(opt);
          });
        }
      } catch (err) {
        stateSelect.innerHTML = '<option value="">States data not available</option>';// any error to show that time  data in drowpddown is empty 

        stateSelect.disabled = true;
      }
    });
  



    function resetStates() {
      const sel = document.getElementById("state");
      sel.innerHTML = '<option value="">Select Country first</option>';//jya  suthi  country select naii thay tya suthi state dekhase naii    
      sel.disabled = true; //disable state dropdown until a country is selected 
    }



    // ── Save Profile → POST to Flask backend ─── THIS CODE FOR SAVE THE DATA IN DATABASE AND  SHOW THE DATA IN PROFILES.HTML PAGE  
    async function saveProfile() {
      // Gather values --- this code for when user fill the form and click and save button that time get the data from input fild and store in 
      // database and also shoe the error message when user not fill the compalsari flids and click the save button  



      const name         = document.getElementById("name").value.trim();
      const email        = document.getElementById("email").value.trim();
      const password     = document.getElementById("password").value;
      const country_code = document.getElementById("country-code").value;
      const phone        = document.getElementById("phone").value.trim().replace(/[^0-9]/g, '');
      const country      = document.getElementById("country").value;
      const state        = document.getElementById("state").value;

      // Clear previous error highlights 
      ["name","email","password","country-code","phone","country","state"]
        .forEach(id => document.getElementById(id).classList.remove("err"));

      // Validate   compalsari fields this data is validate when user fill the from and click 
      // this code for when user fill the form and click and save button that time validate the compalsari fields and 
      // that time show the error message when user not fill the compalsari flids and click the save button
      const errors = [];
      if (!name)         { errors.push("name");         highlight("name"); }
      if (!email || !email.includes("@")) {
        errors.push("email"); highlight("email");
      }
      if (!country_code) { errors.push("country-code"); highlight("country-code"); }
      if (!phone || !/^\d+$/.test(phone)) {
        errors.push("phone");
        highlight("phone");
      }
      if (!country)      { errors.push("country");      highlight("country"); }
      if (!password)     { errors.push("password");     highlight("password"); }
      const stateSelect = document.getElementById("state");
      if (!stateSelect.disabled && !state) { errors.push("state"); highlight("state"); }

      if (errors.length) {
        showToast("✖ Please fill all required fields.", "error");
        return;
      }

      if (!isStrongPassword(password)) {
        highlight("password");
        showToast("✖ Password must include uppercase letters, numbers, and special characters.", "error");
        return;
      }












      // Show loading state  IF DATA STORE AND NOT STORE THEN SHOE ERROR
      // if all data successfully fill the data that time show success message 
      const btn = document.getElementById("save-btn");
      btn.classList.add("loading");
      btn.disabled = true;

      try {
        const res  = await fetch(SUBMIT_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name, 
            email, 
            password,
            country_code, 
            phone_number: phone,   // backend expects 'phone_number'
            country, 
            state 
          })
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const errorMessage = data?.error || data?.message || res.statusText || 'Unknown error';
          showToast(`✖ Save failed (${res.status}): ${errorMessage}`, "error");
        } else if (data && data.success) {
          showToast(`✔ Profile saved! (ID #${data.id})`, "success");
          clearForm();
        } else {
          showToast(`✖ ${data.error}`, "error");
        }
      } catch (err) {
        console.error('Save request failed:', err);
        showToast(`✖ Server error: ${err.message || err}`, "error");
      } finally {
        btn.classList.remove("loading");
        btn.disabled = false;
      }
    }









    
    // that time show the error in input fild and show the error message in toast when user click save button whithout fill 
    /// Helpers:- this code for show the error when user n ot fill the compalsari fields  the date 
    function highlight(id) {
      document.getElementById(id).classList.add("err");
    }
// strong password 
    function isStrongPassword(password) {
      return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);
    }
// reset  batton click karya paachi data khali karva mate use thay che 

    function clearForm() {
      ["name","email","password","phone"].forEach(id => {
        document.getElementById(id).value = "";
      });
      document.getElementById("country-code").value = "";
      document.getElementById("country").value = "";
      resetStates();
    }
// druop down  to counrty selct karva and  breack karva mate 
    function preselectOption(select, value) {
      for (let opt of select.options) {
        if (opt.value === value || opt.textContent.trim() === value) {
          select.value = opt.value;
          break;
        }
      }
    }

    function showSpinner(id, show) {
      document.getElementById(id).classList.toggle("show", show);
    }

    function escHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }



// this code for when user click the view saved profile  button that time show
//  the data in table from data base and that time call the api and get the data and
//  shoe in table formate in profile.html page
    let toastTimer;
    function showToast(msg, type = "success") {
      const toast = document.getElementById("toast");
      const icon  = document.getElementById("toast-icon");
      const text  = document.getElementById("toast-msg");

      toast.className = `toast ${type}`;
      icon.textContent = type === "success" ? "✓" : "✕";
      text.textContent = msg;

      // Trigger reflow then show (whene data feel and that time show success)

      toast.offsetHeight;
      toast.classList.add("show");

      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
    }


    // ----- Modal helpers: open/close modal and load saved profiles -----
    function openModal() {
      const modal = document.getElementById('dataModal');
      if (modal) modal.style.display = 'block';
    }

    function closeModal() {
      const modal = document.getElementById('dataModal');
      if (modal) modal.style.display = 'none';
    }










// this code for when user click the view saved profile button that time show the data in table
//  from data base and that time call the api and get the data 
    async function loadProfilesModal() {
      const tbody = document.getElementById('dataTableBody');
      const noData = document.getElementById('noDataMessage');
      tbody.innerHTML = '';
      noData.style.display = 'none';
    try {
        const res = await fetch('/api/profiles', { credentials: 'same-origin' });
// without login jyre open kare che tyre  aa message print thase 
        if (!res.ok) { 
          noData.textContent = 'Could not load profiles (login required).';
          noData.style.display = 'block';
          return;
        }
         const json = await res.json();// id all are good that time  js convert to json formate 
        if (!json.success || !json.profiles || json.profiles.length === 0) {
          noData.textContent = 'No data found. Save a profile first!';
          noData.style.display = 'block';
          return;
        }



// Populate modal table  yato data show karse yato  error show karavse 

        json.profiles.forEach(p => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="padding:0.75rem">${escHtml(p.id)}</td>
            <td style="padding:0.75rem">${escHtml(p.name)}</td>
            <td style="padding:0.75rem">${escHtml(p.email)}</td>
            <td style="padding:0.75rem">${escHtml(p.country)}</td>
            <td style="padding:0.75rem">${escHtml(p.state)}</td>
            <td style="padding:0.75rem">${escHtml(p.country_code)}</td>
            <td style="padding:0.75rem">${escHtml(p.phone)}</td>
          `;
          tbody.appendChild(tr);
        });
      } catch (e) {
        noData.textContent = 'Server error. Make sure backend is running.';
        noData.style.display = 'block';
      }
    }