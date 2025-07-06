const express = require('express');
const fs = require('fs');
const mqtt = require('mqtt');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const auth = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const client = mqtt.connect('mqtt://13.212.22.157');

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

cages.forEach(cage => {
  client.subscribe(`${cage}/data`);
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

client.on('message', (topic, message) => {
  try {
    const cage = topic.split('/')[0];
    const isCage4 = cage === 'cage4';

    if (!message || message.length === 0) return;

    const jsonString = message.toString();
    console.log(`Raw message received for ${cage}:`, jsonString);

    let json;
    try {
      json = parseAndFixJSON(jsonString);
    } catch (e) {
      console.error(`Invalid JSON from ${topic}:`, e.message);
      return;
    }

    const dataSource = isCage4 ? json : (json.data || json);
    if (!dataSource || typeof dataSource !== 'object') {
      console.error(`No data object found for ${cage}`);
      return;
    }

    const isTestMessage = json.source === 'test';

    // DO Scaling
    let rawDO = dataSource.do || 0;
    let scaledDO = null;

    if (!isCage4) {
      if (isTestMessage) {
        scaledDO = rawDO;
      } else {
        switch (cage) {
          case 'cage1':
            scaledDO = ((rawDO - 200) / 400)+ 1;
            break;
          case 'cage2':
            scaledDO = ((rawDO - 200) / 400) + 1;
            break;
          case 'cage3':
            scaledDO = (rawDO / 1000) + 1;
            break;
        }
      }
    }

    // Voltage Scaling: subtract 4V
    let rawVoltage = dataSource.voltage || 0;
    let scaledVoltage = isCage4 ? rawVoltage - 6.5 : rawVoltage - 4;


    // Current Scaling: divide by 2 for cage2 and cage3
    let rawCurrent = dataSource.current || 0;
    let scaledCurrent = (cage === 'cage2' || cage === 'cage3') ? rawCurrent / 2 : rawCurrent;

    // Battery Scaling
    let scaledBattery = (dataSource.battery || 0) / 100;

    const timestamp = Date.now();
    const values = {
      timestamp,
      do: scaledDO,
      voltage: scaledVoltage,
      current: scaledCurrent / 100,
      battery: scaledBattery * 100
    };

    lastKnownValues[cage] = { ...currentValues[cage] };
    currentValues[cage] = values;

    // Write CSV
    const csvPath = path.join(dataDir, `${cage}.csv`);
    const formattedTime = new Date(timestamp).toISOString().replace('T', ' ').substring(0, 19);
    const csvLine = isCage4
      ? `${formattedTime},${values.voltage},${values.current},${values.battery}\n`
      : `${formattedTime},${values.do},${values.voltage},${values.current},${values.battery}\n`;
    fs.appendFileSync(csvPath, csvLine);

    // Write JSON history
    const jsonPath = path.join(dataDir, `${cage}.json`);
    let history = [];
    if (fs.existsSync(jsonPath)) {
      try {
        history = JSON.parse(fs.readFileSync(jsonPath));
      } catch (e) {
        console.error(`Error reading JSON for ${cage}:`, e);
      }
    }
    history.push(values);
    history = history.filter(d => timestamp - d.timestamp <= 30 * 60 * 1000);
    fs.writeFileSync(jsonPath, JSON.stringify(history));

    io.emit('data-update', cage, values);
  } catch (err) {
    console.error('Error handling message:', err.message);
  }
});

// Data routes
cages.forEach(cage => {
  app.get(`/${cage}`, (req, res) => {
    const filePath = path.join(dataDir, `${cage}.json`);
    if (fs.existsSync(filePath)) {
      res.json(JSON.parse(fs.readFileSync(filePath)));
    } else {
      res.json([]);
    }
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
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  cages.forEach(cage => console.log(`Subscribed to ${cage}/data`));
});

