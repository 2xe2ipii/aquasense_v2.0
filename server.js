const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');

const app = express();
app.use(express.json());

const cages = ['cage1', 'cage2', 'cage3', 'cage4'];
const currentValues = {};
const lastKnownValues = {};

cages.forEach(cage => {
  currentValues[cage] = {
    do: cage === 'cage4' ? null : 0,
    voltage: 0,
    current: 0,
    battery: 0
  };
  lastKnownValues[cage] = { ...currentValues[cage] };
});

app.use(express.static('public'));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/new_data', express.static(path.join(__dirname, 'new_data')));

//because the changes are so minimal, the change in the graph is almost unnoticeable, thus, we must zoom in into the graph, like maybe we should only have 2.0 to 3.5 DO levels in the y-axis. also, when I open the app, I need it to show me "real-time" in the time frame options first, it means

// Authentication routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }
  
  const result = auth.validateLogin(username, password);
  res.json(result);
});

// Password change removed - using fixed production credentials

const dataDir = 'data';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

cages.forEach(cage => {
  const csvPath = path.join(dataDir, `${cage}.csv`);
  if (!fs.existsSync(csvPath)) {
    const header = cage === 'cage4'
      ? 'Timestamp,Voltage,Current,Battery\n'
      : 'Timestamp,DO,Voltage,Current,Battery\n';
    fs.writeFileSync(csvPath, header);
  }
});

function parseAndFixJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {
    try {
      let fixed = jsonString.replace(/,\s*([}\]])/g, '$1');
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
      fixed = fixed.replace(/[^\x20-\x7E]/g, '');
      return JSON.parse(fixed);
    } catch (fixError) {
      console.error('Could not fix JSON:', jsonString);
      throw fixError;
    }
  }
}

// MQTT code removed - using only CSV data

// Data routes
cages.forEach(cage => {
  app.get(`/${cage}`, (req, res) => {
    const jsonPath = path.join(dataDir, `${cage}.json`);
    const csvPath = path.join(dataDir, `${cage}.csv`);
    
    // Try JSON first
    if (fs.existsSync(jsonPath)) {
      const jsonData = JSON.parse(fs.readFileSync(jsonPath));
      if (jsonData.length > 0) {
        return res.json(jsonData);
      }
    }
    
    // If no JSON data or empty, try to load from CSV
    if (fs.existsSync(csvPath)) {
      try {
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) { // Skip header
          const header = lines[0].split(',');
          const data = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= header.length) {
              const timestamp = new Date(values[0]).getTime();
              if (!isNaN(timestamp)) {
                const item = { timestamp };
                
                // Map CSV columns to data
                if (cage === 'cage4') {
                  item.voltage = parseFloat(values[1]) || 0;
                  item.current = parseFloat(values[2]) || 0;
                  item.battery = parseFloat(values[3]) || 0;
                } else {
                  item.do = parseFloat(values[1]) || 0;
                  item.voltage = parseFloat(values[2]) || 0;
                  item.current = parseFloat(values[3]) || 0;
                  item.battery = parseFloat(values[4]) || 0;
                }
                
                data.push(item);
              }
            }
          }
          
          if (data.length > 0) {
            return res.json(data);
          }
        }
      } catch (csvError) {
        console.error(`Error reading CSV for ${cage}:`, csvError);
      }
    }
    
    res.json([]);
  });

  app.get(`/download/${cage}`, (req, res) => {
    const filePath = path.join(dataDir, `${cage}.csv`);
    if (fs.existsSync(filePath)) {
      res.download(filePath, `${cage}_export.csv`);
    } else {
      const header = cage === 'cage4'
        ? 'Timestamp,Voltage,Current,Battery\n'
        : 'Timestamp,DO,Voltage,Current,Battery\n';
      fs.writeFileSync(filePath, header);
      res.download(filePath, `${cage}_export.csv`);
    }
  });
});


// Activate Test: All cages
app.get('/activate/test', (req, res) => {
  const cagesToTest = ['cage1', 'cage2', 'cage3'];
  const results = [];

  cagesToTest.forEach(cage => {
    const testValue = (Math.random() * 0.5 + 2.0).toFixed(2);
    const payload = JSON.stringify({
      source: 'test',
      data: {
        do: parseFloat(testValue),
        voltage: 0,
        current: 0,
        battery: 0
      }
    });
    client.publish(`${cage}/data`, payload);
    results.push({ cage, do: testValue });
  });

  res.json({
    success: true,
    message: 'Test values sent to cage1–3',
    results
  });
});

// Activate Test: Single cage
app.post('/activate/test/:cage', (req, res) => {
  const cage = req.params.cage;
  if (!['cage1', 'cage2', 'cage3'].includes(cage)) {
    return res.status(400).json({ error: 'Invalid cage ID' });
  }

  const testValue = (Math.random() * 0.5 + 2.0).toFixed(2);
  const payload = JSON.stringify({
    source: 'test',
    data: {
      do: parseFloat(testValue),
      voltage: 0,
      current: 0,
      battery: 0
    }
  });

  client.publish(`${cage}/data`, payload);
  res.json({
    success: true,
    message: `Test value sent to ${cage}`,
    value: testValue
  });
});

// Activate Reset: Clear DO override, resume ESP
app.get('/activate/reset', (req, res) => {
  cages.forEach(cage => {
    const last = lastKnownValues[cage];
    const payload = JSON.stringify({
      source: 'reset',
      data: {
        voltage: last.voltage,
        current: last.current,
        battery: last.battery
        // DO omitted, ESP will send live data
      }
    });
    client.publish(`${cage}/data`, payload);
  });

  res.json({
    success: true,
    message: 'Reset complete: DO now coming from ESP modules'
  });
});

// UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/activate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'activate.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from public folder`);
});

