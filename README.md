# AquaSense - Water Quality Monitoring Dashboard

🌊 Real-time water quality monitoring dashboard for fish cage aquaculture operations.

## Features

- **Real-time Monitoring**: Live data updates every 5 seconds via Socket.IO
- **Multi-cage Support**: Monitor up to 4 fish cages simultaneously
- **Comprehensive Metrics**: Track Dissolved Oxygen (DO), Voltage, Current, and Battery levels
- **Interactive Charts**: Visualize data trends using Chart.js with time filtering
- **Data Export**: Download historical data as CSV files
- **Responsive Design**: Clean, modern dashboard interface
- **Historical Data**: Load and display past sensor readings

## Tech Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + Chart.js + Luxon + PapaParse
- **Data Storage**: CSV files for historical data
- **Real-time**: WebSocket communication for live updates

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or extract the project**
   ```bash
   cd AquaSense_Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restarts during development.

## Project Structure

```
AquaSense/
├── public/
│   └── index.html          # Dashboard frontend
├── data/
│   ├── cage1.csv          # Cage 1 historical data
│   ├── cage2.csv          # Cage 2 historical data
│   ├── cage3.csv          # Cage 3 historical data
│   └── cage4.csv          # Cage 4 historical data
├── server.js              # Express server + Socket.IO
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Dashboard Features

### Navigation
- **Dashboard**: Overview of all cages
- **Individual Cage Views**: Detailed monitoring for each cage
- **Time Filtering**: View data for last 5m, 10m, 30m, 1h, 6h, or 24h

### Metrics Monitored
- **Dissolved Oxygen (DO)**: mg/L (Cages 1-3 only)
- **Voltage**: V (Battery/Power system voltage)
- **Current**: A (Power consumption)
- **Battery Level**: % (Remaining battery capacity)

### Data Visualization
- **Real-time Charts**: Live updating line charts
- **Historical Trends**: Load and display past data
- **Statistical Overview**: Average values across all cages
- **Export Functionality**: Download data as CSV

## API Endpoints

### Static Files
- `GET /` - Dashboard homepage
- `GET /data/:filename` - Access CSV data files

### Downloads
- `GET /download/:cage` - Download CSV data for specific cage (1-4)

### WebSocket Events
- `data-update` - Real-time sensor data updates
  ```javascript
  // Example event data
  {
    cage: 'cage1',
    data: {
      timestamp: 1704358800000,
      do: 6.5,        // mg/L (not present for cage4)
      voltage: 12.3,  // V
      current: 0.45,  // A
      battery: 0.93   // 0-1 (93%)
    }
  }
  ```

## Data Format

### CSV Structure
```csv
Timestamp,DO,Voltage,Current,Battery
2024-01-04T10:00:00.000Z,6.2,12.1,0.42,0.89
2024-01-04T10:05:00.000Z,6.4,12.3,0.45,0.88
```

### Field Descriptions
- **Timestamp**: ISO 8601 datetime string
- **DO**: Dissolved Oxygen in mg/L (empty for cage4)
- **Voltage**: System voltage in volts
- **Current**: Power consumption in amperes
- **Battery**: Battery level as decimal (0.0-1.0)

## Integration with Hardware

### Arduino/ESP32 Setup
To connect real hardware sensors:

1. **Modify server.js** to listen for serial/HTTP data instead of generating random values
2. **Update data generation** in the `generateSensorData()` function
3. **Add sensor calibration** constants for your specific hardware

### Example Arduino Integration
```javascript
// Replace the generateSensorData function with:
function generateSensorData(cage) {
  // Read from your Arduino/ESP32 via serial or HTTP
  // Return the same data structure
  return {
    timestamp: Date.now(),
    do: readDOSensor(cage),      // Your sensor reading function
    voltage: readVoltage(cage),   // Your voltage reading function
    current: readCurrent(cage),   // Your current reading function
    battery: readBattery(cage)    // Your battery reading function
  };
}
```

## Configuration

### Server Settings
- **Port**: Default 3000 (set via `PORT` environment variable)
- **Data Emission**: Every 5 seconds (configurable in server.js)
- **CORS**: Enabled for development (adjust for production)

### Frontend Settings
- **Chart Update Interval**: Real-time via WebSocket
- **Data Retention**: Last 20 points per chart (configurable)
- **Time Filters**: 5m, 10m, 30m, 1h, 6h, 24h

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Or use different port
   PORT=3001 npm start
   ```

2. **CSV Files Not Loading**
   - Check that `/data` directory exists
   - Verify CSV file format matches expected structure
   - Check browser console for fetch errors

3. **Real-time Updates Not Working**
   - Verify WebSocket connection in browser dev tools
   - Check for firewall/proxy blocking WebSocket connections
   - Restart the server

### Development Tips
- Use browser dev tools to monitor WebSocket messages
- Check server console for connection logs
- Modify data generation intervals in server.js for testing
- Use `npm run dev` for auto-restart during development

## License

MIT License - feel free to use this project for your aquaculture monitoring needs!

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

🐟 Happy Fish Monitoring! 🐟
