// THIS CODE FOR SHOW THE data in table formate in profile html page and that time call the api and get the data and show in table formate in pprofile 
  let allProfiles = [];
  let lastRenderedProfiles = [];
  let currentPage = 1;
  let rowsPerPage = 10;
  let paginatedProfiles = [];

  // UI state for sorting/filtering
  let currentSortField = 'id';
  let currentSortOrder = 'asc';
  let currentCountryFilter = '';

// - this code for when page load that time  show  the data in profile.html
// //  page and that time call the api and  get the data 
     async function loadProfiles() {
       try {
        const res = await fetch('/api/profiles', { credentials: 'same-origin' });

       if (!res.ok) {
         if (res.status === 401) {
          showError('Please log in first.');
          return;
        }

        const errorData = await res.json().catch(() => null);
        showError(errorData?.error || 'Could not load profiles.');
        return;
      }

        const data = await res.json();


// this code for when page load that time  show  the data in profile.html page and that time call the api and  get
//  the data and show in table formate in profile html page
      if (data.success) {
        allProfiles = data.profiles || [];
        populateCountryFilter(allProfiles);
        applyFiltersAndSort();
        document.getElementById('total-badge').textContent = allProfiles.length + ' total';
      } else {
        showError(data.error || 'Could not load profiles.');
      }
    } catch (err) {
      showError('Server error. Make sure Flask is running.');
    }
  }


  // ── Get initials from a full name (e.g. "John Doe" → "JD") ──
  function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0] ? w[0].toUpperCase() : '').join('').slice(0, 2) || '?';
  }

  // ── Build table rows from data ─── this code for show the data in table from api and
  //  that time call the api and get the data and 
  // show in table formate in profile.html page

     function renderTable(profiles) {
       // remember the last rendered set (filtered + sorted) for export
        lastRenderedProfiles = profiles.slice();
        const tbody = document.getElementById('tbody');
         const foot  = document.getElementById('foot');

         const totalCount = profiles.length;
         const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (totalCount === 0) {
      tbody.innerHTML = `<tr class="state-row"><td colspan="8">No profiles found.</td></tr>`;
      foot.textContent = '';
      updatePagination(0);
      return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const pageData = profiles.slice(start, start + rowsPerPage);
    paginatedProfiles = pageData;

    tbody.innerHTML = pageData.map(p => `
      <tr>
        <td style="color:#9ca3af">${p.id}</td>
        <td>
          <div class="name-cell">
            <div class="avatar">${initials(p.name)}</div>
            <span class="name-text">${escHtml(p.name)}</span>
          </div>
        </td>
        <td class="email-text">${escHtml(p.email)}</td>
        <td>
          <span class="dial">${escHtml(p.country_code)}</span>
          ${escHtml(p.phone)}
        </td>
        <td>${escHtml(p.password || '—')}</td>
        <td>${escHtml(p.country)}</td>
        <td style="color:#6b7280">${escHtml(p.state)}</td>
        <td class="date-text">${formatDate(p.created_at)}</td>
      </tr>
    `).join('');

    foot.textContent = `Showing ${pageData.length} of ${totalCount} profiles`;
    updatePagination(totalCount);
  }


   




  //  this code for when user click the export button that time show the data in csv formate and
  //  also show the data in json formate and also call the api and get the data and that time shoe
  //  the data in csv formate and also show 
  
    function exportCSV() {
    const rows = lastRenderedProfiles || [];
    // IF LIST KHALI HOY NO PROFILE 
    if (!rows.length) {
      showError('No profiles to export.');
      return;
    }
// HOW TO ECHA DATA STORE IN CSV FORMATE 
    const headers = ['ID','Name','Email','Phone','Password','Country','State','Saved On'];
    const csv = [headers.join(',')].concat(rows.map(p => {
      const phone = `${p.country_code || ''}${p.phone || ''}`;
      const cols = [p.id, p.name, p.email, phone, p.password || '', p.country || '', p.state || '', p.created_at || ''];
      return cols.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',');
    })).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob('profiles.csv', blob);
  }
// RENDER  MA DATA STORE CHE KE NAI IF NATHI TTO  NO PROFILE  TO EXPORT  SHOW KAESE
   function exportJSON() {
    const data = lastRenderedProfiles || [];
    if (!data.length) {
      showError('No profiles to export.');
      return;
    }
    // SPACE R AND INDECTION MA STORE THASE
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob('profiles.json', blob);
  }


//  DOWLONAD Thava  and data store thava mate 
  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }



// this code for when user click the export button that time show the data 
  function updatePagination(totalCount = lastRenderedProfiles.length) {
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('page-prev');
    const nextBtn = document.getElementById('page-next');
    const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  function changePage(delta) {
    currentPage = Math.max(1, currentPage + delta);
    applyFiltersAndSort();
  }

  function changeRowsPerPage(value) {
    rowsPerPage = Number(value) || 10;
    currentPage = 1;
    applyFiltersAndSort();
  } 







// Combined filter + sort entrypoint used by UI - SORTING AND FILTERING 


      function applyFiltersAndSort() {
      const q = document.getElementById('search').value.toLowerCase();
      currentSortField = document.getElementById('sort-field').value;
      currentSortOrder = document.getElementById('sort-order').value;
      currentCountryFilter = document.getElementById('country-filter').value;


// thia line all profile par filter apply kare che 
    let filtered = allProfiles.filter(p => {
      const matchesQ = !q || (
        (p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.country || '').toLowerCase().includes(q) ||
        (p.state || '').toLowerCase().includes(q)
      );
      const matchesCountry = !currentCountryFilter || (p.country === currentCountryFilter);
      return matchesQ && matchesCountry;
    });

 // Sort thwe ne user ni sleetection rite line ma avse 
    filtered.sort((a, b) => compareByField(a, b, currentSortField, currentSortOrder));
    renderTable(filtered);
  }
// asc ad des nwrok code karse 
    function compareByField(a, b, field, order) {
       const dir = order === 'asc' ? 1 : -1;
        if (field === 'id') {
      return (Number(a.id) - Number(b.id)) * dir;
    }
    // if colum is empty so that time cloum ne khlai batavse 
      const va = (a[field] === null || a[field] === undefined) ? '' : String(a[field]).toLowerCase();
      const vb = (b[field] === null || b[field] === undefined) ? '' : String(b[field]).toLowerCase();
      // dir to work a to z and  z to a  rite work karse
       if (field === 'created_at') {
         return va.localeCompare(vb) * dir;
    }
        return va.localeCompare(vb) * dir;
  }




// aa code nu  data ne country na name gotine  drowp date list  tari ke work karse
        function populateCountryFilter(profiles) {
        const sel = document.getElementById('country-filter');

        const countries = Array.from(new Set(profiles.map(p => p.country).filter(Boolean))).sort();
        sel.innerHTML = '<option value="">All</option>' + countries.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
  }






// this code show just the data part in date  
// if data khali hase ne to null retun karse  and undefined hase to __ define karse 
      function formatDate(dt) {
         if (!dt) return '—';
          return dt.split(' ')[0];    // conver to  array and show the data part only 
  }


//  
      function escHtml(str) {
        return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
  } 
// ERROR HASE TANE 8 LINE SPACE ROKINE AE ERROR SHOE KARSE AND FOOTER MA KAE NAII DEKHAY 
     function showError(msg) {
       document.getElementById('tbody').innerHTML =
       `<tr class="state-row"><td colspan="8">${escHtml(msg)}</td></tr>`;
         document.getElementById('foot').textContent = '';
  }


// ── Logout handler: clear client state and redirect to login page ──
     function logout() {
       try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* ignore */ }
       // Server-side logout, then redirect to login page
       fetch('/logout', { method: 'POST', credentials: 'same-origin' }).finally(() => {
        window.location.href = '/login';
    });
  }

// ── Run on page load ──────────────────────────────────────
   loadProfiles();