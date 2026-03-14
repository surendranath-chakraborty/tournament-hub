const express   = require('express');
const router    = express.Router();
const { protect } = require('../middleware/auth');

// Lazy-load Groq so server doesn't crash if key is missing
const getGroq = () => {
  const Groq = require('groq-sdk');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const extractJSON = (text, isArray = false) => {
  const pattern = isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) throw new Error('AI did not return valid JSON');
  return JSON.parse(match[0]);
};

// POST /api/ai/fixture  – generate bracket
router.post('/fixture', protect, async (req, res) => {
  try {
    const { teams, format = 'knockout' } = req.body;
    if (!teams || teams.length < 2)
      return res.status(400).json({ message: 'At least 2 teams required' });

    const prompt = `Generate a ${format} tournament bracket for these teams: ${teams.join(', ')}.
Return ONLY valid JSON in this exact format, no extra text:
{
  "format": "${format}",
  "totalTeams": ${teams.length},
  "rounds": [
    {
      "roundNumber": 1,
      "roundName": "Quarter Finals",
      "matches": [
        { "matchNumber": 1, "team1": "Team A", "team2": "Team B", "venue": "TBD", "date": "TBD" }
      ]
    }
  ]
}
For knockout: pair teams randomly, winners advance. For round-robin: every team plays every other once.`;

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model:       'llama3-8b-8192',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens:  2000,
    });

    const bracket = extractJSON(completion.choices[0].message.content.trim());
    res.json(bracket);
  } catch (err) {
    console.error('AI fixture error:', err.message);
    res.status(500).json({ message: 'AI fixture generation failed: ' + err.message });
  }
});

// POST /api/ai/grounds  – suggest nearby venues
router.post('/grounds', protect, async (req, res) => {
  try {
    const { city, sport } = req.body;
    if (!city) return res.status(400).json({ message: 'City is required' });

    const prompt = `Suggest 5 real ${sport || 'sports'} grounds or venues in ${city}, India.
Return ONLY a valid JSON array, no extra text:
[
  {
    "name": "Venue Name",
    "type": "Indoor or Outdoor",
    "address": "Full address in ${city}",
    "sports": ["cricket", "football"],
    "amenities": ["Parking", "Changing Rooms", "Floodlights"],
    "estimatedCostPerHour": "₹500-800",
    "mapQuery": "Venue Name ${city} India"
  }
]
Use real, well-known venues where possible.`;

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model:       'llama3-8b-8192',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens:  1500,
    });

    const grounds = extractJSON(completion.choices[0].message.content.trim(), true);
    res.json(grounds);
  } catch (err) {
    console.error('AI grounds error:', err.message);
    res.status(500).json({ message: 'AI ground suggestion failed: ' + err.message });
  }
});

module.exports = router;
