const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const getGroq = () => {
  const Groq = require('groq-sdk');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const extractJSON = (text, isArray) => {
  var pattern = isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  var match = text.match(pattern);
  if (!match) throw new Error('AI did not return valid JSON');
  return JSON.parse(match[0]);
};

// POST /api/ai/fixture
router.post('/fixture', protect, async (req, res) => {
  try {
    const { teams, format } = req.body;
    var fmt = format || 'knockout';

    if (!teams || teams.length < 2)
      return res.status(400).json({ message: 'At least 2 teams required' });

    var prompt =
      'Generate a ' + fmt + ' tournament bracket for these teams: ' + teams.join(', ') + '.\n' +
      'Return ONLY valid JSON in this exact format, no extra text:\n' +
      '{\n' +
      '  "format": "' + fmt + '",\n' +
      '  "totalTeams": ' + teams.length + ',\n' +
      '  "rounds": [\n' +
      '    {\n' +
      '      "roundNumber": 1,\n' +
      '      "roundName": "Quarter Finals",\n' +
      '      "matches": [\n' +
      '        { "matchNumber": 1, "team1": "Team A", "team2": "Team B", "venue": "TBD", "date": "TBD" }\n' +
      '      ]\n' +
      '    }\n' +
      '  ]\n' +
      '}\n' +
      'For knockout: pair teams randomly, winners advance. For round-robin: every team plays every other once.';

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const bracket = extractJSON(completion.choices[0].message.content.trim(), false);
    res.json(bracket);
  } catch (err) {
    console.error('AI fixture error:', err.message);
    res.status(500).json({ message: 'AI fixture generation failed: ' + err.message });
  }
});

// POST /api/ai/grounds
router.post('/grounds', protect, async (req, res) => {
  try {
    const { city, sport } = req.body;
    if (!city) return res.status(400).json({ message: 'City is required' });

    var sportText = sport || 'sports';

    var prompt =
      'Suggest 5 real ' + sportText + ' grounds or venues in ' + city + ', India.\n' +
      'Return ONLY a valid JSON array, no extra text:\n' +
      '[\n' +
      '  {\n' +
      '    "name": "Venue Name",\n' +
      '    "type": "Indoor or Outdoor",\n' +
      '    "address": "Full address in ' + city + '",\n' +
      '    "sports": ["cricket", "football"],\n' +
      '    "amenities": ["Parking", "Changing Rooms", "Floodlights"],\n' +
      '    "estimatedCostPerHour": "Rs.500-800",\n' +
      '    "mapQuery": "Venue Name ' + city + ' India"\n' +
      '  }\n' +
      ']\n' +
      'Use real, well-known venues where possible.';

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const grounds = extractJSON(completion.choices[0].message.content.trim(), true);
    res.json(grounds);
  } catch (err) {
    console.error('AI grounds error:', err.message);
    res.status(500).json({ message: 'AI ground suggestion failed: ' + err.message });
  }
});

module.exports = router;