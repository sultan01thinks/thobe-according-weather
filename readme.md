# Thobe Weather Guide 🌡️

A beautiful web application that recommends whether to wear a white light thobe or a dark thobe based on the current temperature.

## Features

- 🌡️ Real-time weather data
- 🎨 Beautiful, modern UI with smooth animations
- 📍 Automatic location detection (optional)
- 🔍 Manual city search
- 💡 Smart recommendations based on temperature threshold (25°C)

## Setup Instructions

1. **Get a Free API Key**
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Get your API key from the dashboard

2. **Configure the API Key**
   - Open `script.js`
   - Replace `YOUR_API_KEY_HERE` on line 2 with your actual API key:
   ```javascript
   const API_KEY = 'your-actual-api-key-here';
   ```

3. **Run the Application**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     ```
   - Then visit `http://localhost:8000` in your browser

## How It Works

- **Temperature ≥ 25°C**: Recommends a **white light thobe** (to stay cool and reflect heat)
- **Temperature < 25°C**: Recommends a **dark thobe** (to stay warm)

## Customization

You can adjust the temperature threshold in `script.js`:
```javascript
const TEMP_THRESHOLD = 25; // Change this value to your preference
```

## Browser Compatibility

Works on all modern browsers (Chrome, Firefox, Safari, Edge)

## License

Free to use and modify!
