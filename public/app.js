const availableTypes = [
    'Row Number', 'First Name', 'Last Name', 'Full Name', 'Email', 
    'Gender', 'IP Address', 'UUID', 'Number', 'Boolean', 
    'Date', 'City', 'Country', 'Street Address', 'Postal Code', 
    'Company Name', 'Phone Number', 'Color', 'Sentence', 'Custom List'
];

let fields = [
    { name: 'id', type: 'Row Number', options: {} },
    { name: 'first_name', type: 'First Name', options: {} },
    { name: 'last_name', type: 'Last Name', options: {} },
    { name: 'email', type: 'Email', options: {} },
    { name: 'gender', type: 'Gender', options: {} },
    { name: 'ip_address', type: 'IP Address', options: {} }
];

document.addEventListener('DOMContentLoaded', () => {
    renderFields();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('outputFormat').addEventListener('change', (e) => {
        const rootContainer = document.getElementById('rootObjectContainer');
        if (e.target.value === 'csv' || e.target.value === 'excel') {
            rootContainer.style.display = 'none';
        } else {
            rootContainer.style.display = 'block';
        }
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.app-tab').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.navbar-nav .nav-link').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).style.display = 'block';
    event.currentTarget.classList.add('active');

    if (tabId === 'mock-apis') {
        loadMockApis();
    } else if (tabId === 'saved-schemas') {
        loadSavedSchemas();
    }
}

function renderFields() {
    const container = document.getElementById('fieldsContainer');
    container.innerHTML = '';

    fields.forEach((field, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-secondary';
        tr.innerHTML = `
            <td class="text-secondary fw-semibold">${index + 1}</td>
            <td>
                <input type="text" class="form-control form-control-sm bg-secondary text-light border-0" value="${field.name}" oninput="updateFieldName(${index}, this.value)">
            </td>
            <td>
                <select class="form-select form-select-sm bg-secondary text-light border-0" onchange="updateFieldType(${index}, this.value)">
                    ${availableTypes.map(t => `<option value="${t}" ${t === field.type ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
            </td>
            <td>
                ${renderFieldOptions(field, index)}
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="moveField(${index}, -1)" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="moveField(${index}, 1)" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeField(${index})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        container.appendChild(tr);
    });
}

function renderFieldOptions(field, index) {
    if (field.type === 'Number') {
        const min = field.options.min !== undefined ? field.options.min : 1;
        const max = field.options.max !== undefined ? field.options.max : 100;
        const decimals = field.options.decimals !== undefined ? field.options.decimals : 0;
        return `
            <div class="row g-1">
                <div class="col-4">
                    <input type="number" class="form-control form-control-sm bg-secondary text-light border-0" placeholder="Min" value="${min}" oninput="updateOption(${index}, 'min', this.value)">
                </div>
                <div class="col-4">
                    <input type="number" class="form-control form-control-sm bg-secondary text-light border-0" placeholder="Max" value="${max}" oninput="updateOption(${index}, 'max', this.value)">
                </div>
                <div class="col-4">
                    <input type="number" class="form-control form-control-sm bg-secondary text-light border-0" placeholder="Dec" value="${decimals}" min="0" max="6" oninput="updateOption(${index}, 'decimals', this.value)">
                </div>
            </div>
        `;
    } else if (field.type === 'Custom List') {
        const values = field.options.values ? field.options.values.join(', ') : 'Val1, Val2, Val3';
        return `
            <input type="text" class="form-control form-control-sm bg-secondary text-light border-0" placeholder="Comma separated values" value="${values}" oninput="updateCustomList(${index}, this.value)">
        `;
    } else if (field.type === 'Date') {
        const startDate = field.options.startDate || '2020-01-01';
        const endDate = field.options.endDate || '2026-12-31';
        return `
            <div class="row g-1">
                <div class="col-6">
                    <input type="date" class="form-control form-control-sm bg-secondary text-light border-0" value="${startDate}" onchange="updateOption(${index}, 'startDate', this.value)">
                </div>
                <div class="col-6">
                    <input type="date" class="form-control form-control-sm bg-secondary text-light border-0" value="${endDate}" onchange="updateOption(${index}, 'endDate', this.value)">
                </div>
            </div>
        `;
    }
    return '<span class="text-muted small">No options</span>';
}

function addField() {
    fields.push({ name: `field_${fields.length + 1}`, type: 'First Name', options: {} });
    renderFields();
}

function removeField(index) {
    fields.splice(index, 1);
    renderFields();
}

function clearAllFields() {
    fields = [];
    renderFields();
}

function moveField(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < fields.length) {
        const temp = fields[index];
        fields[index] = fields[newIndex];
        fields[newIndex] = temp;
        renderFields();
    }
}

function updateFieldName(index, val) {
    fields[index].name = val;
}

function updateFieldType(index, val) {
    fields[index].type = val;
    fields[index].options = {};
    renderFields();
}

function updateOption(index, key, val) {
    fields[index].options[key] = val;
}

function updateCustomList(index, val) {
    fields[index].options.values = val.split(',').map(s => s.trim()).filter(Boolean);
}

async function getPayload() {
    const count = parseInt(document.getElementById('rowCount').value) || 10;
    const format = document.getElementById('outputFormat').value;
    const rootObject = document.getElementById('rootObject').value || 'data';
    return { fields, count, format, rootObject };
}

async function previewData() {
    const payload = await getPayload();
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const text = await response.text();
        document.getElementById('previewOutput').textContent = text;
        document.getElementById('previewSection').style.display = 'block';
        document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert('Error generating data: ' + err.message);
    }
}

async function downloadData() {
    const payload = await getPayload();
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = payload.format === 'csv' ? 'csv' : payload.format === 'sql' ? 'sql' : payload.format === 'excel' ? 'xls' : payload.format === 'xml' ? 'xml' : 'json';
        a.download = `mock_data.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (err) {
        alert('Error downloading data: ' + err.message);
    }
}

function copyPreviewToClipboard() {
    const text = document.getElementById('previewOutput').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    });
}

function openSaveSchemaModal() {
    const modal = new bootstrap.Modal(document.getElementById('saveSchemaModal'));
    modal.show();
}

async function saveSchema() {
    const name = document.getElementById('schemaNameInput').value.trim();
    if (!name) {
        alert('Please enter a schema name');
        return;
    }
    try {
        const res = await fetch('/api/schemas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, fields })
        });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('saveSchemaModal')).hide();
            alert('Schema saved successfully!');
        } else {
            const err = await res.json();
            alert(err.error);
        }
    } catch (err) {
        alert('Error saving schema: ' + err.message);
    }
}

async function loadSavedSchemas() {
    try {
        const res = await fetch('/api/schemas');
        const schemas = await res.json();
        const container = document.getElementById('savedSchemasContainer');
        container.innerHTML = '';
        if (schemas.length === 0) {
            container.innerHTML = '<div class="col-12 text-muted">No saved schemas found. Save your current generator schema to see it here.</div>';
            return;
        }
        schemas.forEach(schema => {
            const div = document.createElement('div');
            div.className = 'col-md-4';
            div.innerHTML = `
                <div class="card bg-secondary bg-opacity-10 border-secondary h-100">
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div>
                            <h5 class="fw-bold text-light">${schema.name}</h5>
                            <p class="text-muted small mb-3">${schema.fields.length} fields • Created ${new Date(schema.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button class="btn btn-sm btn-warning fw-bold text-dark w-100" onclick='loadSchemaIntoGenerator(${JSON.stringify(schema.fields)})'>
                            <i class="fa-solid fa-arrow-rotate-right me-1"></i> Load Schema
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error(err);
    }
}

function loadSchemaIntoGenerator(schemaFields) {
    fields = JSON.parse(JSON.stringify(schemaFields));
    switchTab('generator');
    document.querySelectorAll('.navbar-nav .nav-link')[0].classList.add('active');
    renderFields();
    alert('Schema loaded into generator!');
}

function openCreateMockModal() {
    const modal = new bootstrap.Modal(document.getElementById('createMockModal'));
    modal.show();
}

async function createMockApi() {
    const name = document.getElementById('mockNameInput').value.trim();
    const endpoint = document.getElementById('mockEndpointInput').value.trim();
    const count = parseInt(document.getElementById('mockCountInput').value) / 1 || 50;

    if (!name || !endpoint) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const res = await fetch('/api/mocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, endpoint, fields, count })
        });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('createMockModal')).hide();
            alert('Mock API created successfully!');
            loadMockApis();
        } else {
            const err = await res.json();
            alert(err.error);
        }
    } catch (err) {
        alert('Error creating mock API: ' + err.message);
    }
}

async function loadMockApis() {
    try {
        const res = await fetch('/api/mocks');
        const mocks = await res.json();
        const container = document.getElementById('mockApisContainer');
        container.innerHTML = '';
        if (mocks.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No mock APIs created yet.</td></tr>';
            return;
        }
        mocks.forEach(mock => {
            const fullUrl = `${window.location.origin}/mock${mock.endpoint}`;
            const tr = document.createElement('tr');
            tr.className = 'border-secondary';
            tr.innerHTML = `
                <td class="fw-bold">${mock.name}</td>
                <td><a href="${fullUrl}" target="_blank" class="text-warning text-decoration-none">/mock${mock.endpoint} <i class="fa-solid fa-external-link-alt small"></i></a></td>
                <td>${mock.count}</td>
                <td class="text-muted small">${new Date(mock.createdAt).toLocaleDateString()}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMockApi('${mock.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            container.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function deleteMockApi(id) {
    if (!confirm('Are you sure you want to delete this mock API?')) return;
    try {
        const res = await fetch(`/api/mocks/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadMockApis();
        } else {
            alert('Error deleting mock API');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
