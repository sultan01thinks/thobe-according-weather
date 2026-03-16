// OpenWeatherMap API
const API_KEY = 'aa178a57c7e49a5c0f6dca73ee24fd84';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// DOM Elements (الملف مضمّن في نهاية الـ body، لذلك يمكننا ربط العناصر مباشرة)
const cityInput = document.getElementById('cityInput');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const weatherInfo = document.getElementById('weatherInfo');
const recommendation = document.getElementById('recommendation');
const weatherAlerts = document.getElementById('weatherAlerts');
const hourlyForecast = document.getElementById('hourlyForecast');
const hourlyList = document.getElementById('hourlyList');
const activityRecommendations = document.getElementById('activityRecommendations');
const activityList = document.getElementById('activityList');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const locationPrompt = document.getElementById('locationPrompt');
const allowLocationBtn = document.getElementById('allowLocationBtn');
const skipLocationBtn = document.getElementById('skipLocationBtn');

// Temperature threshold for recommendation (in Celsius)
const TEMP_THRESHOLD = 25; // Above 25°C = white thobe, below = dark thobe

// User location
let userLat = null;
let userLon = null;
let userCity = null;

// Arabian Gulf and Red Sea regions (approximate coordinates)
const ARABIAN_GULF_REGION = {
    minLat: 24, maxLat: 30,
    minLon: 46, maxLon: 56
};

const RED_SEA_REGION = {
    minLat: 18, maxLat: 28,
    minLon: 38, maxLon: 43
};

// Kashta locations database - أماكن برية للتخييم خارج المدن
const KASHTA_LOCATIONS = {
    'Riyadh': ['برية الدلم', 'برية الحريق', 'برية الخرج', 'برية ثادق', 'وادي حنيفة'],
    'Jeddah': ['برية الشميسي', 'برية خليص', 'برية رابغ', 'برية الليث', 'وادي فاطمة'],
    'Mecca': ['برية الطائف', 'برية الهدا', 'برية الشفا', 'وادي فاطمة'],
    'Medina': ['برية العلا', 'برية خيبر', 'برية بدر', 'وادي العقيق'],
    'Dammam': ['برية الجبيل', 'برية القطيف', 'برية سيهات', 'برية رأس تنورة'],
    'Khobar': ['برية الجبيل', 'برية القطيف', 'برية سيهات', 'برية رأس تنورة'],
    'Abha': ['برية السودة', 'برية النماص', 'برية تنومة', 'برية رجال ألمع', 'وادي تثليث'],
    'Taif': ['برية الهدا', 'برية الشفا', 'برية الطائف', 'وادي محرم'],
    'Dubai': ['برية ليوا', 'برية العين', 'برية حتا', 'برية الفجيرة'],
    'Abu Dhabi': ['برية ليوا', 'برية العين', 'برية الظفرة', 'برية المرفأ'],
    'Sharjah': ['برية الذيد', 'برية كلباء', 'برية الفجيرة', 'برية دبا'],
    'Qassim': ['برية بريدة', 'برية عنيزة', 'برية الرس', 'برية البكيرية'],
    'Hail': ['برية حائل', 'برية بقعاء', 'برية الشملي', 'برية الغزالة'],
    'Tabuk': ['برية تبوك', 'برية الوجه', 'برية ضبا', 'برية حقل'],
    'Najran': ['برية نجران', 'برية شرورة', 'برية حبونا', 'برية يدمة']
};

// Beach locations for Arabian Gulf and Red Sea
const BEACH_LOCATIONS = {
    gulf: [
        { name: 'شاطئ الخبر', city: 'الخبر' },
        { name: 'شاطئ الدمام', city: 'الدمام' },
        { name: 'شاطئ الجبيل', city: 'الجبيل' },
        { name: 'شاطئ دبي', city: 'دبي' },
        { name: 'شاطئ أبوظبي', city: 'أبوظبي' },
        { name: 'شاطئ الشارقة', city: 'الشارقة' }
    ],
    redSea: [
        { name: 'شاطئ جدة', city: 'جدة' },
        { name: 'شاطئ ينبع', city: 'ينبع' },
        { name: 'شاطئ الوجه', city: 'الوجه' },
        { name: 'شاطئ أملج', city: 'أملج' },
        { name: 'شاطئ رابغ', city: 'رابغ' }
    ]
};

// Event Listeners الأساسية والبسيطة
if (getWeatherBtn) {
    getWeatherBtn.addEventListener('click', () => {
        console.log('getWeatherBtn clicked');
        getWeather();
    });
}

if (cityInput) {
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter on cityInput');
            getWeather();
        }
    });
}

if (allowLocationBtn) {
    allowLocationBtn.addEventListener('click', () => {
        console.log('allowLocationBtn clicked');
        requestLocation();
    });
}

if (skipLocationBtn && locationPrompt) {
    skipLocationBtn.addEventListener('click', () => {
        console.log('skipLocationBtn clicked');
        locationPrompt.classList.add('hidden');
    });
}

// Request location permission explicitly
function requestLocation() {
    if (!navigator.geolocation) {
        showError('المتصفح لا يدعم تحديد الموقع');
        if (locationPrompt) {
            locationPrompt.classList.add('hidden');
        }
        return;
    }

    if (!allowLocationBtn) {
        console.error('زر السماح بالوصول إلى الموقع غير معرّف عند استدعاء requestLocation.');
    } else {
        allowLocationBtn.textContent = 'جاري الحصول على الموقع...';
        allowLocationBtn.disabled = true;
    }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 5000, // 5 seconds timeout
            maximumAge: 0 // Don't use cached position
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLat = position.coords.latitude;
                userLon = position.coords.longitude;
                if (allowLocationBtn) {
                    allowLocationBtn.textContent = 'السماح بالوصول إلى الموقع';
                    allowLocationBtn.disabled = false;
                }
                if (locationPrompt) {
                    locationPrompt.classList.add('hidden');
                }
                getWeatherByCoords(userLat, userLon);
            },
            (err) => {
                if (allowLocationBtn) {
                    allowLocationBtn.textContent = 'السماح بالوصول إلى الموقع';
                    allowLocationBtn.disabled = false;
                }
                let errorMessage = 'لم يتم السماح بالوصول إلى الموقع. يمكنك البحث يدوياً.';
                
                switch(err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'تم رفض الوصول إلى الموقع. يمكنك البحث يدوياً.';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'معلومات الموقع غير متاحة. يمكنك البحث يدوياً.';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'انتهت مهلة طلب الموقع. يمكنك البحث يدوياً.';
                        break;
                }
                
                showError(errorMessage);
                if (locationPrompt) {
                    locationPrompt.classList.add('hidden');
                }
            },
            options
        );
    
}

// Coastal cities database - مدن ساحلية معروفة
const COASTAL_CITIES = {
    // Arabian Gulf cities
    'gulf': ['الخبر', 'الدمام', 'الجبيل', 'القطيف', 'سيهات', 'رأس تنورة', 'دبي', 'أبوظبي', 'الشارقة', 
             'عجمان', 'رأس الخيمة', 'أم القيوين', 'الفجيرة', 'الكويت', 'المنامة', 'الدوحة',
             'Khobar', 'Dammam', 'Jubail', 'Qatif', 'Sayhat', 'Ras Tanura', 'Dubai', 'Abu Dhabi', 
             'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Umm Al Quwain', 'Fujairah', 'Kuwait', 'Manama', 'Doha'],
    // Red Sea cities
    'redSea': ['جدة', 'ينبع', 'الوجه', 'أملج', 'رابغ', 'ضبا', 'حقل', 'الليث', 'القنفذة', 'جازان',
               'Jeddah', 'Yanbu', 'Al Wajh', 'Umluj', 'Rabigh', 'Duba', 'Haql', 'Al Lith', 'Al Qunfudhah', 'Jazan']
};

// Check if location is near Arabian Gulf or Red Sea
function isNearCoast(lat, lon) {
    if (lat && lon) {
        const nearGulf = lat >= ARABIAN_GULF_REGION.minLat && lat <= ARABIAN_GULF_REGION.maxLat &&
                         lon >= ARABIAN_GULF_REGION.minLon && lon <= ARABIAN_GULF_REGION.maxLon;
        
        const nearRedSea = lat >= RED_SEA_REGION.minLat && lat <= RED_SEA_REGION.maxLat &&
                           lon >= RED_SEA_REGION.minLon && lon <= RED_SEA_REGION.maxLon;
        
        return { nearGulf, nearRedSea };
    }
    return { nearGulf: false, nearRedSea: false };
}

// Check if city name is a coastal city
function isCoastalCity(cityName) {
    if (!cityName) return { nearGulf: false, nearRedSea: false };
    
    const cityLower = cityName.toLowerCase();
    const cityArabic = cityName;
    
    const nearGulf = COASTAL_CITIES.gulf.some(city => 
        cityLower.includes(city.toLowerCase()) || 
        cityArabic.includes(city) ||
        city.toLowerCase().includes(cityLower)
    );
    
    const nearRedSea = COASTAL_CITIES.redSea.some(city => 
        cityLower.includes(city.toLowerCase()) || 
        cityArabic.includes(city) ||
        city.toLowerCase().includes(cityLower)
    );
    
    return { nearGulf, nearRedSea };
}

// Calculate beach weather score (higher is better)
function calculateBeachScore(item) {
    const humidity = item.main.humidity;
    const windSpeed = item.wind.speed * 3.6;
    const temp = item.main.temp;
    
    let score = 100;
    
    // Ideal humidity: 40-70%
    if (humidity >= 40 && humidity <= 70) {
        score += 20;
    } else if (humidity >= 30 && humidity < 40) {
        score += 10;
    } else if (humidity > 70 && humidity <= 80) {
        score += 10;
    }
    
    // Ideal wind: 5-20 km/h
    if (windSpeed >= 5 && windSpeed <= 20) {
        score += 20;
    } else if (windSpeed >= 3 && windSpeed < 5) {
        score += 10;
    } else if (windSpeed > 20 && windSpeed <= 25) {
        score += 10;
    }
    
    // Ideal temp: 20-35°C
    if (temp >= 20 && temp <= 35) {
        score += 20;
    } else if (temp >= 18 && temp < 20) {
        score += 10;
    } else if (temp > 35 && temp <= 38) {
        score += 10;
    }
    
    return score;
}

async function getWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('الرجاء إدخال اسم المدينة');
        return;
    }
    
    hideAll();
    showLoading();
    
    try {
        // Encode city name to handle Arabic characters and spaces
        const encodedCity = encodeURIComponent(city);
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${API_URL}?q=${encodedCity}&appid=${API_KEY}&units=metric&lang=ar`),
            fetch(`${FORECAST_API_URL}?q=${encodedCity}&appid=${API_KEY}&units=metric&lang=ar`)
        ]);
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        if (!currentResponse.ok) {
            throw new Error(currentData.message || 'المدينة غير موجودة');
        }
        
        if (!forecastResponse.ok) {
            throw new Error(forecastData.message || 'فشل في الحصول على التوقعات');
        }
        
        // Save city name and coordinates from API response
        userCity = currentData.name;
        if (currentData.coord) {
            userLat = currentData.coord.lat;
            userLon = currentData.coord.lon;
        }
        
        displayWeather(currentData);
        showRecommendation(currentData.main.temp);
        checkWeatherAlerts(currentData, forecastData);
        displayHourlyForecast(forecastData);
        checkActivityRecommendations(currentData, forecastData);
    } catch (err) {
        showError(err.message || 'فشل في جلب بيانات الطقس. يرجى التحقق من مفتاح API والمحاولة مرة أخرى.');
    }
}

async function getWeatherByCoords(lat, lon) {
    hideAll();
    showLoading();
    
    try {
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ar`),
            fetch(`${FORECAST_API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ar`)
        ]);
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        if (!currentResponse.ok) {
            throw new Error(currentData.message || 'فشل في الحصول على الطقس');
        }
        
        if (!forecastResponse.ok) {
            throw new Error(forecastData.message || 'فشل في الحصول على التوقعات');
        }
        
        userLat = lat;
        userLon = lon;
        userCity = currentData.name;
        cityInput.value = currentData.name;
        displayWeather(currentData);
        showRecommendation(currentData.main.temp);
        checkWeatherAlerts(currentData, forecastData);
        displayHourlyForecast(forecastData);
        checkActivityRecommendations(currentData, forecastData);
    } catch (err) {
        showError(err.message || 'فشل في جلب بيانات الطقس');
    }
}

function displayWeather(data) {
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    document.getElementById('cityName').textContent = data.name;
    // Use Arabic description from API if available, otherwise use translation
    const weatherDesc = data.weather[0].description || translateWeatherDescription(data.weather[0].main);
    document.getElementById('weatherDesc').textContent = weatherDesc;
    
    hideLoading();
    weatherInfo.classList.remove('hidden');
}

function showRecommendation(temperature) {
    const temp = Math.round(temperature);
    const recommendationText = document.getElementById('recommendationText');
    const recommendationIcon = document.getElementById('recommendationIcon');
    const recommendationReason = document.getElementById('recommendationReason');
    
    recommendation.classList.remove('white', 'dark');
    
    if (temp >= TEMP_THRESHOLD) {
        // درجة الحرارة >= 25°م: ثوب أبيض خفيف
        recommendation.classList.add('white');
        recommendationIcon.textContent = '👕';
        recommendationText.textContent = 'ارتدِ ثوباً أبيض خفيف';
        recommendationReason.textContent = `درجة الحرارة ${temp}°م - مثالية للثوب الأبيض الخفيف للبقاء بارداً وعكس حرارة الشمس.`;
    } else {
        // درجة الحرارة < 25°م: ثوب ملون أو شتوي
        recommendation.classList.add('dark');
        recommendationIcon.textContent = '🧥';
        recommendationText.textContent = 'ارتدِ ثوباً ملوناً أو شتوياً';
        recommendationReason.textContent = `درجة الحرارة ${temp}°م - الثوب الملون أو الشتوي سيساعدك على البقاء دافئاً ومريحاً.`;
    }
    
    recommendation.classList.remove('hidden');
}

function checkWeatherAlerts(currentData, forecastData) {
    weatherAlerts.innerHTML = '';
    const alerts = [];
    
    const hasRain = currentData.weather.some(w => 
        w.main === 'Rain' || w.main === 'Thunderstorm' || w.main === 'Drizzle'
    );
    
    const forecastRain = forecastData.list.slice(0, 8).some(item => 
        item.weather.some(w => w.main === 'Rain' || w.main === 'Thunderstorm' || w.main === 'Drizzle')
    );
    
    const lightRainForecast = forecastData.list.slice(0, 8).filter(item => {
        const weather = item.weather[0];
        return (weather.main === 'Rain' || weather.main === 'Drizzle') && 
               weather.description.includes('light');
    });
    
    const heavyRain = forecastData.list.slice(0, 8).some(item => {
        const weather = item.weather[0];
        return (weather.main === 'Rain' || weather.main === 'Thunderstorm') && 
               (weather.description.includes('heavy') || weather.description.includes('thunderstorm'));
    });
    
    if (heavyRain || (hasRain && currentData.rain && currentData.rain['3h'] > 5)) {
        alerts.push({
            type: 'rain',
            icon: '☔',
            title: 'تحتاج مظلة!',
            message: 'أمطار غزيرة متوقعة اليوم. لا تنسَ المظلة!',
            color: '#3498db'
        });
    } else if (hasRain || forecastRain) {
        alerts.push({
            type: 'rain',
            icon: '🌧️',
            title: 'أمطار متوقعة',
            message: 'أمطار خفيفة إلى متوسطة متوقعة. فكر في إحضار مظلة.',
            color: '#74b9ff'
        });
    }
    
    if (lightRainForecast.length > 0) {
        const kashtaTime = lightRainForecast[0];
        const temp = Math.round(kashtaTime.main.temp);
        if (temp >= 15 && temp <= 28) {
            const time = new Date(kashtaTime.dt * 1000);
            const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            alerts.push({
                type: 'kashta',
                icon: '🌦️',
                title: 'مثالي للكشتة في البر!',
                message: `أمطار خفيفة وطقس بارد (${temp}°م) حوالي ${timeStr}. وقت رائع للتخييم في البر!`,
                color: '#00b894'
            });
        }
    }
    
    if (alerts.length > 0) {
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert';
            alertDiv.style.borderRightColor = alert.color;
            alertDiv.innerHTML = `
                <div class="alert-icon">${alert.icon}</div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                </div>
            `;
            weatherAlerts.appendChild(alertDiv);
        });
        weatherAlerts.classList.remove('hidden');
    }
}

function checkActivityRecommendations(currentData, forecastData) {
    activityList.innerHTML = '';
    const activities = [];
    
    // Check for kashta opportunities - شروط مرنة أكثر
    // الكشتة مناسبة في: طقس بارد (10-30°م) بدون حرارة شديدة
    // يمكن أن تكون مع أمطار خفيفة (مثالية) أو بدون أمطار (جيدة أيضاً)
    const kashtaOpportunities = forecastData.list.slice(0, 8).filter(item => {
        const temp = item.main.temp;
        const weather = item.weather[0];
        const windSpeed = item.wind.speed * 3.6; // km/h
        
        // تجنب الطقس السيء: عواصف رعدية، أمطار غزيرة، رياح قوية جداً
        const badWeather = weather.main === 'Thunderstorm' || 
                          (weather.main === 'Rain' && weather.description.includes('heavy')) ||
                          windSpeed > 30;
        
        // طقس مناسب للكشتة: درجة حرارة معقولة (10-30°م) وليس طقس سيء
        return !badWeather && temp >= 10 && temp <= 30;
    });
    
    if (kashtaOpportunities.length > 0 && userCity) {
        // اختر أفضل وقت (أقل حرارة في النهار أو طقس بارد مع أمطار خفيفة)
        const kashtaTime = kashtaOpportunities.reduce((best, current) => {
            const currentHasLightRain = (current.weather[0].main === 'Rain' || current.weather[0].main === 'Drizzle') &&
                                       current.weather[0].description.includes('light');
            const bestHasLightRain = (best.weather[0].main === 'Rain' || best.weather[0].main === 'Drizzle') &&
                                    best.weather[0].description.includes('light');
            
            // تفضيل الأوقات مع أمطار خفيفة، أو الأوقات الأقل حرارة
            if (currentHasLightRain && !bestHasLightRain) return current;
            if (!currentHasLightRain && bestHasLightRain) return best;
            return current.main.temp < best.main.temp ? current : best;
        });
        
        const time = new Date(kashtaTime.dt * 1000);
        const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const temp = Math.round(kashtaTime.main.temp);
        const weather = kashtaTime.weather[0];
        const hasLightRain = (weather.main === 'Rain' || weather.main === 'Drizzle') && 
                            weather.description.includes('light');
        
        const locations = KASHTA_LOCATIONS[userCity] || 
                         KASHTA_LOCATIONS[Object.keys(KASHTA_LOCATIONS).find(key => 
                             userCity.toLowerCase().includes(key.toLowerCase()) || 
                             key.toLowerCase().includes(userCity.toLowerCase())
                         )] || 
                         ['منطقة برية قريبة'];
        
        let conditionsText = '';
        if (hasLightRain) {
            conditionsText = `طقس بارد (${temp}°م) مع أمطار خفيفة - مثالي للتخييم في البر`;
        } else if (temp <= 20) {
            conditionsText = `طقس بارد ومريح (${temp}°م) - مناسب للتخييم في البر`;
        } else {
            conditionsText = `طقس معتدل (${temp}°م) - جيد للتخييم في البر`;
        }
        
        activities.push({
            type: 'kashta',
            icon: '🏕️',
            title: 'أماكن الكشتة في البر',
            location: locations[0] || 'منطقة برية قريبة',
            time: `أفضل وقت: ${timeStr}`,
            conditions: conditionsText
        });
    }
    
    // Check for beach picnic opportunities (if near coast)
    // شروط مرنة: إذا كان المستخدم قريباً من الساحل، نعرض توصيات مع ظروف معقولة
    // التحقق من الإحداثيات أولاً، ثم من اسم المدينة
    let coast = { nearGulf: false, nearRedSea: false };
    
    if (userLat && userLon) {
        coast = isNearCoast(userLat, userLon);
    }
    
    // إذا لم تكن الإحداثيات متاحة، تحقق من اسم المدينة
    if (!coast.nearGulf && !coast.nearRedSea && userCity) {
        coast = isCoastalCity(userCity);
    }
    
    if (coast.nearGulf || coast.nearRedSea) {
            // توسيع الشروط: رطوبة 30-80%، رياح 3-25 كم/س، حرارة 18-38°م
            // تجنب: عواصف رعدية، أمطار غزيرة، رياح قوية جداً (>30 كم/س)
            const beachOpportunities = forecastData.list.slice(0, 8).filter(item => {
                const humidity = item.main.humidity;
                const windSpeed = item.wind.speed * 3.6; // Convert m/s to km/h
                const temp = item.main.temp;
                const weather = item.weather[0];
                
                // تجنب الطقس السيء فقط: عواصف رعدية أو أمطار غزيرة جداً
                const badWeather = weather.main === 'Thunderstorm' || 
                                  (weather.main === 'Rain' && (weather.description.includes('heavy') || weather.description.includes('extreme')));
                
                // شروط مرنة جداً: أي طقس معقول مناسب للشاطئ
                // رطوبة: 20-85% (نطاق واسع جداً)
                // رياح: 2-30 كم/س (نطاق واسع، فقط تجنب الرياح القوية جداً)
                // حرارة: 15-40°م (نطاق واسع)
                return !badWeather &&
                       humidity >= 20 && humidity <= 85 &&
                       windSpeed >= 2 && windSpeed <= 30 &&
                       temp >= 15 && temp <= 40;
            });
            
            if (beachOpportunities.length > 0) {
                // اختر أفضل وقت (رطوبة معتدلة، رياح لطيفة، حرارة مريحة)
                const beachTime = beachOpportunities.reduce((best, current) => {
                    const currentScore = calculateBeachScore(current);
                    const bestScore = calculateBeachScore(best);
                    return currentScore > bestScore ? current : best;
                });
                
                const time = new Date(beachTime.dt * 1000);
                const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const temp = Math.round(beachTime.main.temp);
                const humidity = beachTime.main.humidity;
                const windSpeed = Math.round(beachTime.wind.speed * 3.6);
                
                const beaches = coast.nearGulf ? BEACH_LOCATIONS.gulf : BEACH_LOCATIONS.redSea;
                const nearestBeach = beaches[0];
                
                // تقييم الظروف
                let conditionsText = '';
                const isIdeal = humidity >= 40 && humidity <= 70 && 
                               windSpeed >= 5 && windSpeed <= 20 && 
                               temp >= 20 && temp <= 35;
                
                if (isIdeal) {
                    conditionsText = `درجة حرارة ${temp}°م، رطوبة ${humidity}%، رياح ${windSpeed} كم/س - ظروف مثالية للبيكنيك على الشاطئ`;
                } else {
                    conditionsText = `درجة حرارة ${temp}°م، رطوبة ${humidity}%، رياح ${windSpeed} كم/س - ظروف جيدة للبيكنيك على الشاطئ`;
                }
                
                activities.push({
                    type: 'beach',
                    icon: '🏖️',
                    title: 'شاطئ مثالي للبيكنيك',
                    location: `${nearestBeach.name} - ${nearestBeach.city}`,
                    time: `أفضل وقت: ${timeStr}`,
                    conditions: conditionsText
                });
            }
        }
    }
    
    if (activities.length > 0) {
        activities.forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.className = `activity-item ${activity.type}`;
            activityDiv.innerHTML = `
                <div class="activity-header">
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-title">${activity.title}</div>
                </div>
                <div class="activity-location">📍 ${activity.location}</div>
                <div class="activity-time">⏰ ${activity.time}</div>
                <div class="activity-conditions">${activity.conditions}</div>
            `;
            activityList.appendChild(activityDiv);
        });
        activityRecommendations.classList.remove('hidden');
    }
}

function displayHourlyForecast(forecastData) {
    hourlyList.innerHTML = '';
    
    // Get next 24 hours (8 forecasts, each 3 hours apart)
    const next24Hours = forecastData.list.slice(0, 8);
    
    next24Hours.forEach((item, index) => {
        const time = new Date(item.dt * 1000);
        // تحويل الوقت لنظام 12 ساعة (AM/PM)
        const timeStr = time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        const temp = Math.round(item.main.temp);
        const weatherIcon = getWeatherIcon(item.weather[0].main);
        const thobeType = temp >= TEMP_THRESHOLD ? 'white' : 'dark';
        const thobeIcon = temp >= TEMP_THRESHOLD ? '👕' : '🧥';
        const thobeText = thobeType === 'white' ? 'أبيض' : 'ملون/شتوي';
        
        const hourItem = document.createElement('div');
        hourItem.className = `hour-item ${thobeType}`;
        hourItem.innerHTML = `
            <div class="hour-time">${timeStr}</div>
            <div class="hour-weather-icon">${weatherIcon}</div>
            <div class="hour-temp">${temp}°م</div>
            <div class="hour-thobe">
                <span class="thobe-icon">${thobeIcon}</span>
                <span class="thobe-text">${thobeText}</span>
            </div>
        `;
        hourlyList.appendChild(hourItem);
    });
    
    hourlyForecast.classList.remove('hidden');
}

function getWeatherIcon(weatherMain) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️'
    };
    return icons[weatherMain] || '🌤️';
}

function translateWeatherDescription(description) {
    const translations = {
        'clear sky': 'سماء صافية',
        'few clouds': 'قليل من الغيوم',
        'scattered clouds': 'غيوم متفرقة',
        'broken clouds': 'غيوم متقطعة',
        'overcast clouds': 'غيوم كثيفة',
        'light rain': 'أمطار خفيفة',
        'moderate rain': 'أمطار متوسطة',
        'heavy rain': 'أمطار غزيرة',
        'light drizzle': 'رذاذ خفيف',
        'drizzle': 'رذاذ',
        'thunderstorm': 'عاصفة رعدية',
        'snow': 'ثلج',
        'mist': 'ضباب',
        'fog': 'ضباب'
    };
    return translations[description.toLowerCase()] || description;
}

function showLoading() {
    loading.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
    recommendation.classList.add('hidden');
    weatherAlerts.classList.add('hidden');
    hourlyForecast.classList.add('hidden');
    activityRecommendations.classList.add('hidden');
    error.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    error.textContent = message;
    error.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
    recommendation.classList.add('hidden');
    weatherAlerts.classList.add('hidden');
    hourlyForecast.classList.add('hidden');
    activityRecommendations.classList.add('hidden');
}

function hideAll() {
    weatherInfo.classList.add('hidden');
    recommendation.classList.add('hidden');
    weatherAlerts.classList.add('hidden');
    hourlyForecast.classList.add('hidden');
    activityRecommendations.classList.add('hidden');
    loading.classList.add('hidden');
    error.classList.add('hidden');
}
