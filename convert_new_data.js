const fs = require('fs');
const path = require('path');

// Function to parse CSV and convert to JSON
function parseCSVToJSON(csvText, hasDO = true) {
    const lines = csvText.trim().split('\n');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header
        const values = lines[i].split(',');
        if (values.length >= 4) {
            const timestamp = new Date(values[0]).getTime();
            if (!isNaN(timestamp)) {
                const record = {
                    timestamp: timestamp,
                    voltage: parseFloat(values[hasDO ? 2 : 1]),
                    current: parseFloat(values[hasDO ? 3 : 2]),
                    battery: parseFloat(values[hasDO ? 4 : 3])
                };
                
                if (hasDO) {
                    record.do = parseFloat(values[1]);
                }
                
                // Only add valid records
                if (!isNaN(record.voltage) && !isNaN(record.current) && !isNaN(record.battery) &&
                    (!hasDO || !isNaN(record.do))) {
                    data.push(record);
                }
            }
        }
    }
    
    return data.sort((a, b) => a.timestamp - b.timestamp);
}

// Convert files
const cageFiles = {
    'cage1': '4 deci cage 1.csv',
    'cage2': '4 deci cage 2.csv', 
    'cage3': '4 deci cage 3.csv',
    'cage4': '4 deci main system.csv'
};

console.log('🔄 Converting CSV files to JSON...');

for (const [cage, filename] of Object.entries(cageFiles)) {
    try {
        console.log(`Converting ${filename}...`);
        
        const csvPath = path.join(__dirname, 'new_data', filename);
        const csvText = fs.readFileSync(csvPath, 'utf8');
        
        const data = parseCSVToJSON(csvText, cage !== 'cage4');
        
        const jsonPath = path.join(__dirname, 'public', `${cage}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
        
        console.log(`✅ Converted ${cage}: ${data.length} records -> public/${cage}.json`);
        
        if (data.length > 0) {
            const startDate = new Date(data[0].timestamp);
            const endDate = new Date(data[data.length - 1].timestamp);
            console.log(`   Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
        }
        
    } catch (error) {
        console.error(`❌ Error converting ${filename}:`, error);
    }
}

console.log('🎯 Conversion complete!');
