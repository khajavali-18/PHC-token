// Database Persistence
let patients = JSON.parse(localStorage.getItem('hosp_patients')) || [];
let skipped = JSON.parse(localStorage.getItem('hosp_skipped')) || [];
let counter = JSON.parse(localStorage.getItem('hosp_counter')) || 1;

const doctorMap = {
    "General OPD": ["Dr. Sharma", "Dr. Verma", "Dr. Patil"],
    "Cardiology": ["Dr. Mehta (Senior)", "Dr. Reddy"],
    "Pediatrics": ["Dr. Anjali", "Dr. Singh"],
    "Dental Care": ["Dr. Batra", "Dr. Khan"]
};

// Clock Logic
setInterval(() => {
    document.getElementById('dateTimeDisplay').innerText = new Date().toLocaleString();
}, 1000);

function showView(v) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    document.getElementById('view-'+v).classList.add('active');
    document.getElementById('btn-'+v).classList.add('active');
    if(v === 'admin' || v === 'tv') refreshUI();
}

function updateDoctors() {
    const dept = document.getElementById('pDept').value;
    const docSelect = document.getElementById('pDoc');
    docSelect.innerHTML = '<option value="">-- Select Doctor --</option>';
    if(dept) doctorMap[dept].forEach(d => docSelect.innerHTML += `<option value="${d}">${d}</option>`);
}

function registerPatient() {
    const n = document.getElementById('pName').value, m = document.getElementById('pMobile').value, 
          d = document.getElementById('pDept').value, dr = document.getElementById('pDoc').value;

    if(!n || !m || !d || !dr) return alert("Fill all fields!");

    const p = { id: Date.now(), token: counter++, name: n, mob: m, dept: d, doc: dr, time: new Date().toLocaleTimeString(), status: 'waiting' };
    patients.push(p);
    saveData();

    document.getElementById('ticket').classList.remove('hidden');
    document.getElementById('tNum').innerText = p.token;
    document.getElementById('tDetails').innerText = `Doctor: ${dr} | SMS Sent to ${m}`;
    document.getElementById('pName').value = ""; document.getElementById('pMobile').value = "";
    alert(`Token #${p.token} generated!`);
}

function refreshUI() {
    // Admin Groups
    const groupArea = document.getElementById('treatmentGroups');
    groupArea.innerHTML = '';
    const activeDepts = [...new Set(patients.map(p => p.dept))];

    activeDepts.forEach(dept => {
        let html = `<div class="dept-block"><div class="dept-title"><span>${dept}</span></div><table><thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Action</th></tr></thead><tbody>`;
        patients.filter(p => p.dept === dept).forEach(p => {
            html += `<tr><td>#${p.token}</td><td>${p.name}</td><td>${p.doc}</td><td>
                <button onclick="updateStatus(${p.id}, 'calling')">Call</button>
                <button onclick="skipPatient(${p.id})">Skip</button>
                <button onclick="updateStatus(${p.id}, 'done')" style="background:var(--success); color:white; border:none; padding:5px; border-radius:4px;">Done</button>
            </td></tr>`;
        });
        groupArea.innerHTML += html + `</tbody></table></div>`;
    });

    // Rescheduled List
    document.getElementById('skippedBody').innerHTML = skipped.map(p => `
        <tr><td>#${p.token}</td><td>${p.name}</td><td>${p.doc}</td><td>${p.time}</td>
        <td><button onclick="restorePatient(${p.id})">Reschedule Now</button></td></tr>`).join('');

    // TV Logic
    const curr = patients.find(p => p.status === 'calling');
    if(curr) {
        document.getElementById('tvToken').innerText = curr.token;
        document.getElementById('tvDoc').innerText = curr.doc;
        document.getElementById('tvName').innerText = curr.name;
        // Next 3 for THIS doctor
        const next = patients.filter(p => p.doc === curr.doc && p.status === 'waiting').slice(0, 3);
        document.getElementById('tvNextList').innerHTML = next.map(p => `<div class="next-item">${p.token}</div>`).join('');
    }
}

function updateStatus(id, s) {
    if(s === 'done') patients = patients.filter(p => p.id !== id);
    else patients = patients.map(p => { if(p.id === id) p.status = s; else if(s === 'calling' && p.status === 'calling') p.status = 'waiting'; return p; });
    saveData(); refreshUI();
}

function skipPatient(id) {
    const p = patients.find(p => p.id === id);
    skipped.push({...p, time: new Date().toLocaleTimeString()});
    patients = patients.filter(p => p.id !== id);
    saveData(); refreshUI();
}

function restorePatient(id) {
    const p = skipped.find(p => p.id === id);
    p.status = 'waiting';
    patients.push(p);
    skipped = skipped.filter(p => p.id !== id);
    saveData(); refreshUI();
}

function checkLogin() {
    if(document.getElementById('adminPass').value === 'admin123') {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
    }
}

function saveData() {
    localStorage.setItem('hosp_patients', JSON.stringify(patients));
    localStorage.setItem('hosp_skipped', JSON.stringify(skipped));
    localStorage.setItem('hosp_counter', counter);
}

function clearAll() { if(confirm("Clear all data?")) { localStorage.clear(); location.reload(); } }

// Run initial UI update
refreshUI();