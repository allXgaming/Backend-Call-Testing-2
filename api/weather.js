// Vercel serverless function – Environment Variables থেকে API URLs নেয়
export default async function handler(req, res) {
  // CORS: সব অরিজিনের জন্য উন্মুক্ত (পরবর্তীতে ALLOWED_ORIGIN চেক যোগ করবেন)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { lat, lon } = req.query;
  if (!lat || !lon) {
    res.status(400).json({ error: 'Missing lat/lon' });
    return;
  }

  // Environment variables থেকে API URLs নিন (fallback সহ)
  const FORECAST_API = process.env.FORECAST_API_URL || 'https://api.open-meteo.com/v1/forecast';
  const AQI_API = process.env.AQI_API_URL || 'https://air-quality-api.open-meteo.com/v1/air-quality';

  try {
    const forecastParams = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current_weather: 'true',
      hourly: 'temperature_2m,relativehumidity_2m,weathercode,visibility',
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum',
      timezone: 'auto'
    });

    const aqiParams = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'us_aqi,pm10,pm2_5',
      timezone: 'auto'
    });

    const [forecastRes, aqiRes] = await Promise.all([
      fetch(`${FORECAST_API}?${forecastParams}`),
      fetch(`${AQI_API}?${aqiParams}`)
    ]);

    const forecast = await forecastRes.json();
    const aqi = await aqiRes.json();

    res.status(200).json({ forecast, aqi });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Upstream service unavailable' });
  }
}
