const axios = require('axios');

async function findFreeModels() {
  try {
    const res = await axios.get('https://openrouter.ai/api/v1/models');
    const freeModels = res.data.data.filter(m => 
      m.id.endsWith(':free') || 
      (m.pricing?.prompt === '0' && m.pricing?.completion === '0')
    );
    console.log(`Found ${freeModels.length} FREE models on OpenRouter:\n`);
    freeModels.forEach(m => {
      console.log(`- ${m.id} (${m.name || 'N/A'}) - Context: ${m.context_length}`);
    });
  } catch (err) {
    console.error('Error fetching models:', err.message);
  }
}

findFreeModels();
