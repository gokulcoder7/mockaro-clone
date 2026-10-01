const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const schemas = new Map();
const mockApis = new Map();

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White'];
const STREETS = ['Main St', 'High St', 'First St', 'Second St', 'Park Ave', 'Oak St', 'Pine St', 'Maple St', 'Cedar St', 'Elm St'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Brazil', 'India', 'Mexico'];
const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'example.com', 'test.org', 'company.net'];
const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Black', 'White', 'Pink', 'Brown'];
const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, minDecimals, max, maxDecimals) {
    const range = max - min;
    const val = min + Math.random() * range;
    const decimals = Math.floor(Math.random() * (maxDecimals - minDecimals + 1)) + minDecimals;
    return parseFloat(val.toFixed(decimals));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateValue(type, options = {}, rowIndex = 0, rowCache = {}) {
    if (!rowCache.firstName) rowCache.firstName = getRandomItem(FIRST_NAMES);
    if (!rowCache.lastName) rowCache.lastName = getRandomItem(LAST_NAMES);

    switch (type) {
        case 'First Name':
            return rowCache.firstName;
        case 'Last Name':
            return rowCache.lastName;
        case 'Full Name':
            return rowCache.firstName + ' ' + rowCache.lastName;
        case 'Email':
            return rowCache.firstName.toLowerCase() + '.' + rowCache.lastName.toLowerCase() + '@' + getRandomItem(DOMAINS);
        case 'Gender':
            return Math.random() > 0.5 ? 'Male' : 'Female';
        case 'IP Address':
            return getRandomInt(1,255) + '.' + getRandomInt(0,255) + '.' + getRandomInt(0,255) + '.' + getRandomInt(1,255);
        case 'UUID':
            return uuidv4();
        case 'Row Number':
            return rowIndex + 1;
        case 'Number':
            const min = options.min !== undefined ? parseFloat(options.min) : 1;
            const max = options.max !== undefined ? parseFloat(options.max) : 100;
            const decimals = options.decimals !== undefined ? parseInt(options.decimals) : 0;
            return getRandomNumber(min, decimals, max, decimals);
        case 'Boolean':
            return Math.random() > 0.5;
        case 'Date':
            const start = new Date(options.startDate || '2020-01-01');
            const end = new Date(options.endDate || '2026-12-31');
            const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            return date.toISOString().split('T')[0];
        case 'City':
            return getRandomItem(CITIES);
        case 'Country':
            return getRandomItem(COUNTRIES);
        case 'Street Address':
            return getRandomInt(100, 9999) + ' ' + getRandomItem(STREETS);
        case 'Postal Code':
            return String(getRandomInt(10000, 99999));
        case 'Company Name':
            return rowCache.lastName + ' ' + getRandomItem(['Inc', 'LLC', 'Corp', 'Group', 'Partners', 'Solutions']);
        case 'Phone Number':
            return '+1-' + getRandomInt(200,999) + '-' + getRandomInt(100,999) + '-' + getRandomInt(1000,9999);
        case 'Color':
            return getRandomItem(COLORS);
        case 'Sentence':
            const wordCount = getRandomInt(5, 12);
            let sentence = [];
            for (let i = 0; i < wordCount; i++) sentence.push(getRandomItem(WORDS));
            sentence[0] = sentence[0].charAt(0).toUpperCase() + sentence[0].slice(1);
            return sentence.join(' ') + '.';
        case 'Custom List':
            if (options.values && options.values.length > 0) {
                return getRandomItem(options.values);
            }
            return 'Item';
        default:
            return 'Sample Value';
    }
}

function generateDataset(fields, count) {
    const data = [];
    for (let i = 0; i < count; i++) {
        const row = {};
        const rowCache = {};
        fields.forEach(field => {
            row[field.name || 'field'] = generateValue(field.type, field.options, i, rowCache);
        });
        data.push(row);
    }
    return data;
}

function formatData(data, format, rootObject = 'data') {
    if (format === 'json') {
        const payload = { [rootObject]: data };
        return JSON.stringify(payload, null, 2);
    }
    
    if (format === 'csv') {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        let csv = headers.join(',') + '\n';
        data.forEach(row => {
            const values = headers.map(h => {
                let val = row[h];
                if (val === null || val === undefined) val = '';
                val = String(val).replace(/"/g, '""');
                if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                    val = '"' + val + '"';
                }
                return val;
            });
            csv += values.join(',') + '\n';
        });
        return csv;
    }

    if (format === 'sql') {
        if (data.length === 0) return '';
        const tableName = rootObject || 'mock_data';
        const headers = Object.keys(data[0]);
        let sql = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n';
        headers.forEach((h, idx) => {
            sql += '  `' + h + '` VARCHAR(255)' + (idx < headers.length - 1 ? ',' : '') + '\n';
        });
        sql += ');\n\n';

        data.forEach(row => {
            const cols = headers.map(h => '`' + h + '`').join(', ');
            const vals = headers.map(h => {
                let val = row[h];
                if (val === null || val === undefined) return 'NULL';
                return '\'' + String(val).replace(/'/g, "''") + '\'';
            }).join(', ');
            sql += 'INSERT INTO ' + tableName + ' (' + cols + ') VALUES (' + vals + ');\n';
        });
        return sql;
    }

    if (format === 'xml') {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<' + rootObject + '>\n';
        data.forEach(row => {
            xml += '  <record>\n';
            for (const [k, v] of Object.entries(row)) {
                const tag = k.replace(/[^a-zA-Z0-9_]/g, '_');
                xml += '    <' + tag + '>' + v + '</' + tag + '>\n';
            }
            xml += '  </record>\n';
        });
        xml += '</' + rootObject + '>';
        return xml;
    }

    if (format === 'excel') {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        let tsv = headers.join('\t') + '\n';
        data.forEach(row => {
            const values = headers.map(h => row[h] !== undefined ? row[h] : '');
            tsv += values.join('\t') + '\n';
        });
        return tsv;
    }

    return JSON.stringify(data, null, 2);
}

app.post('/api/generate', (req, res) => {
    try {
        const { fields, count = 10, format = 'json', rootObject = 'data' } = req.body;
        if (!fields || !Array.isArray(fields)) {
            return res.status(400).json({ error: 'Invalid fields configuration' });
        }
        const recordCount = Math.min(Math.max(parseInt(count) || 10, 1), 10000);
        const dataset = generateDataset(fields, recordCount);
        const formatted = formatData(dataset, format, rootObject);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="mock_data.csv"');
            return res.send(formatted);
        } else if (format === 'sql') {
            res.setHeader('Content-Type', 'application/sql');
            res.setHeader('Content-Disposition', 'attachment; filename="mock_data.sql"');
            return res.send(formatted);
        } else if (format === 'xml') {
            res.setHeader('Content-Type', 'application/xml');
            return res.send(formatted);
        } else if (format === 'excel') {
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.setHeader('Content-Disposition', 'attachment; filename="mock_data.xls"');
            return res.send(formatted);
        } else {
            res.setHeader('Content-Type', 'application/json');
            return res.send(formatted);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/schemas', (req, res) => {
    const { name, fields } = req.body;
    if (!name || !fields) {
        return res.status(400).json({ error: 'Name and fields are required' });
    }
    const id = uuidv4();
    const schema = { id, name, fields, createdAt: new Date() };
    schemas.set(id, schema);
    res.json(schema);
});

app.get('/api/schemas', (req, res) => {
    res.json(Array.from(schemas.values()));
});

app.post('/api/mocks', (req, res) => {
    const { name, endpoint, fields, count = 50 } = req.body;
    if (!name || !endpoint || !fields) {
        return res.status(400).json({ error: 'Name, endpoint and fields are required' });
    }
    const id = uuidv4();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const mock = { id, name, endpoint: cleanEndpoint, fields, count, createdAt: new Date() };
    mockApis.set(cleanEndpoint, mock);
    res.json(mock);
});

app.get('/api/mocks', (req, res) => {
    res.json(Array.from(mockApis.values()));
});

app.delete('/api/mocks/:id', (req, res) => {
    const id = req.params.id;
    for (let [key, val] of mockApis.entries()) {
        if (val.id === id) {
            mockApis.delete(key);
            return res.json({ success: true });
        }
    }
    res.status(404).json({ error: 'Mock API not found' });
});

app.get('/mock/:endpoint', (req, res) => {
    const endpointPath = '/' + req.params.endpoint;
    const mock = mockApis.get(endpointPath);
    if (!mock) {
        return res.status(404).json({ error: 'Mock endpoint ' + endpointPath + ' not found.' });
    }
    const dataset = generateDataset(mock.fields, mock.count);
    res.json(dataset);
});

app.listen(PORT, () => {
    console.log('Mockaroo clone server running at http://localhost:' + PORT);
});
