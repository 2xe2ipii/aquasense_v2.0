// Simple test script to verify the data endpoints
const http = require('http');

const cages = ['cage1', 'cage2', 'cage3', 'cage4'];

function testEndpoint(cage) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/${cage}`,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log(`✅ ${cage}: ${jsonData.length} records`);
                if (jsonData.length > 0) {
                    const firstRecord = jsonData[0];
                    const lastRecord = jsonData[jsonData.length - 1];
                    console.log(`   First: ${new Date(firstRecord.timestamp).toISOString()}`);
                    console.log(`   Last:  ${new Date(lastRecord.timestamp).toISOString()}`);
                    console.log(`   Sample values: DO=${firstRecord.do || 'N/A'}, V=${firstRecord.voltage}, C=${firstRecord.current}, B=${firstRecord.battery}`);
                }
            } catch (error) {
                console.error(`❌ ${cage}: Failed to parse JSON`, error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.error(`❌ ${cage}: Connection error`, error.message);
    });

    req.end();
}

console.log('Testing data endpoints...\n');
cages.forEach(cage => {
    setTimeout(() => testEndpoint(cage), cages.indexOf(cage) * 100);
});
