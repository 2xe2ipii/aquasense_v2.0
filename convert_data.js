const fs = require('fs');
const path = require('path');

// Function to parse CSV and convert to JSON
function csvToJson(csvContent, hasDoColumn = true) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 4) {
            const timestamp = new Date(values[0]).getTime();
            const record = {
                timestamp: timestamp,
                voltage: parseFloat(values[hasDoColumn ? 2 : 1]),
                current: parseFloat(values[hasDoColumn ? 3 : 2]),
                battery: parseFloat(values[hasDoColumn ? 4 : 3])
            };
            
            if (hasDoColumn) {
                record.do = parseFloat(values[1]);
            }
            
            // Only add valid records
            if (!isNaN(timestamp) && !isNaN(record.voltage) && !isNaN(record.current) && !isNaN(record.battery)) {
                if (!hasDoColumn || !isNaN(record.do)) {
                    data.push(record);
                }
            }
        }
    }
    
    return data;
}

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Convert cage data files
const cageFiles = [
    { input: 'new_data/4 deci cage 1.csv', output: 'data/cage1.json', hasDO: true },
    { input: 'new_data/4 deci cage 2.csv', output: 'data/cage2.json', hasDO: true },
    { input: 'new_data/4 deci cage 3.csv', output: 'data/cage3.json', hasDO: true },
    { input: 'new_data/MAIN SYSTEM.xlsx - Sheet1.csv', output: 'data/cage4.json', hasDO: false }
];

cageFiles.forEach(file => {
    try {
        console.log(`Converting ${file.input}...`);
        const csvContent = fs.readFileSync(file.input, 'utf8');
        const jsonData = csvToJson(csvContent, file.hasDO);
        
        // Sort by timestamp
        jsonData.sort((a, b) => a.timestamp - b.timestamp);
        
        // Write JSON file
        fs.writeFileSync(file.output, JSON.stringify(jsonData, null, 2));
        
        console.log(`✅ Converted ${file.input} to ${file.output} (${jsonData.length} records)`);
        
        if (jsonData.length > 0) {
            const startDate = new Date(jsonData[0].timestamp);
            const endDate = new Date(jsonData[jsonData.length - 1].timestamp);
            console.log(`   Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        }
    } catch (error) {
        console.error(`❌ Error converting ${file.input}:`, error.message);
    }
});

console.log('\n✅ Data conversion complete!');
