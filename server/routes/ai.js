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

// POST /api/ai/chat  — Tournament Hub AI assistant chatbot
router.post('/chat', async function (req, res) {
  try {
    var messages = req.body.messages || [];
    var userMessage = req.body.message || '';

    if (!userMessage.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    var systemPrompt = `You are TourneyBot, the official AI assistant for Tournament Hub — a full-stack MERN web application for sports tournament management in India.

ABOUT TOURNAMENT HUB:
- Platform for hosts to create and manage sports tournaments
- Players can browse, register, and compete in tournaments
- Built with: MongoDB, Express.js, React 18, Node.js (MERN stack)
- AI features powered by Groq API (llama-3.3-70b-versatile)
- Payments via custom secure payment gateway (Card / UPI / Net Banking)
- Deployed on Render.com with GitHub auto-deploy

HOST FEATURES:
1. Create Tournament - 4-step wizard: basic info, location & dates, slots & fees, rules & prizes
2. View Registrations - See all entries with player details, payment status, waitlist positions
3. Export PDF/Excel - Download registration list as PDF or Excel
4. Remove Players - Remove any team/player, auto-promotes next waitlisted player
5. AI Fixture Generator - Paste team names, generates knockout or round-robin bracket
6. Live Match Stream - Add YouTube/Twitch URL, show live scores, team names, match round
7. Share Tournament - Copy link, WhatsApp share with pre-filled message, native mobile share
8. Deadline Control - Set registration deadline, withdrawal deadline, edit deadline independently
9. Update Scores - Live score updates for team1 vs team2 on the live stream page
10. Edit/Cancel Tournament - Update all tournament details or cancel it

PLAYER FEATURES:
1. Browse Tournaments - Filter by sport, city, status, type with pagination
2. Register Solo/Team - Enter player details (name, email, phone, age) for each member
3. Pay Entry Fee - Secure payment modal with Card, UPI, Net Banking options
4. Smart Waitlist - Auto join when full, auto-promoted when a slot opens
5. My Registrations - View all entries with confirmed/waitlisted/withdrawn status
6. Withdraw - Withdraw before deadline for refund, no refund after withdrawal deadline
7. Watch Live - Embedded YouTube/Twitch player with live scores and comments
8. Live Comments - Comment in real time, auto-refreshes every 10 seconds
9. Edit Registration - Update team/player details before edit deadline
10. View Tournament - See full details: rules, prizes, dates, organizer info

AI FEATURES:
- Fixture Generator: Enter team names → AI generates complete bracket (knockout or round-robin)
  → Exportable as PDF or Excel
  → Uses Groq llama-3.3-70b-versatile model (free tier)
- Ground Finder: Enter city + sport → AI suggests 5 real venues with address, amenities, cost/hr, Google Maps link

REGISTRATION & PAYMENT FLOW:
- Free tournament: Register → Instantly confirmed (if slot available) or waitlisted
- Paid tournament: Register → Create Razorpay order → Pay → Verify signature → Confirmed
- Any card number works in test mode (e.g. 4111 1111 1111 1111)
- Refund: Automatic if withdrawn before withdrawal deadline
- No refund: If withdrawn after withdrawal deadline

WAITLIST SYSTEM:
- When tournament is full, new registrations join waitlist in order
- When a confirmed player withdraws OR host removes a player → next waitlisted player is auto-promoted to confirmed
- Waitlist position is shown to the player

LIVE STREAM FEATURES:
- Supports: YouTube, Twitch, Facebook Live, any iframe-embeddable URL
- Host can: Add stream, Go Live / End Live, Update scores, Edit or Delete stream
- Players can: Watch embedded video, see live scores, post comments
- Comments auto-refresh every 10 seconds
- Multiple streams per tournament (e.g., semi-final + final simultaneously)

SHARE FEATURE:
- Copy Link: Copies tournament URL to clipboard
- WhatsApp Share: Opens wa.me with pre-filled message including all tournament details
- More Options: Native Web Share API on mobile (OS share sheet)
- Share icon on every tournament card and full share panel on tournament detail page

TECH STACK DETAILS:
- Frontend: React 18, React Router v6, Axios, React-Toastify
- Backend: Node.js, Express.js, Mongoose ODM
- Database: MongoDB Atlas (cloud, free M0 tier)
- Auth: JWT (30-day expiry) + bcrypt (12 salt rounds)
- Payment: Custom secure gateway with server-side order verification
- AI: Groq API - llama-3.3-70b-versatile model
- PDF: jsPDF + jsPDF-AutoTable
- Excel: SheetJS (xlsx)
- Deployment: Render.com (auto-deploy on git push)
- Keep-alive: UptimeRobot pings every 5 minutes to prevent cold start

DATABASE MODELS:
- User: name, email, password(bcrypt), role(host/player), phone, city, stats
- Tournament: host, title, sport, type, location, dates, slots, entryFee, status, prizes
- Registration: tournament, user, players[], status, paymentStatus, waitlistPosition, refundStatus
- LiveStream: tournament, host, streamUrl, isLive, score1, score2, team1, team2, comments[]

API ROUTES:
- POST /api/auth/register - Create account
- POST /api/auth/login - Login + JWT token
- GET /api/tournaments - Browse with filters
- POST /api/tournaments - Create tournament (host only)
- POST /api/registrations - Register for tournament (player only)
- DELETE /api/registrations/:id - Withdraw from tournament
- POST /api/payments/create-order - Create payment order
- POST /api/payments/verify - Verify payment signature
- POST /api/ai/fixture - Generate tournament bracket
- POST /api/ai/grounds - Suggest nearby grounds
- GET/POST /api/live - Live stream management
- POST /api/ai/chat - This chatbot

HOW TO GET STARTED:
- Register as Host to create and manage tournaments
- Register as Player to browse and join tournaments
- Go to AI Tools page for fixture generation and ground suggestions
- Click "Watch Live" on any tournament to see live streams

COMMON QUESTIONS:
Q: How to create a tournament?
A: Register as Host → Dashboard → Click "+ Create Tournament" → Fill 4 steps: basic info, location & dates, slots & fees, rules & prizes

Q: How to register for a tournament?
A: Browse tournaments → Click any tournament → Click "Register Now" → Fill player details → Pay if entry fee exists

Q: What if tournament is full?
A: Click "Join Waitlist" → You get auto-promoted when someone withdraws

Q: How does payment work?
A: After clicking Register, a secure payment modal opens with Card, UPI and Net Banking options. Enter card details to pay the entry fee.

Q: How to get a refund?
A: Withdraw before the withdrawal deadline set by the host. After the deadline, no refund is given.

Q: How to generate a fixture?
A: Go to AI Tools → Fixture Generator → Enter team names (one per line) → Choose format → Click Generate

Q: How to go live?
A: Tournament Detail page → "● Live" button → Add Stream → Paste YouTube URL → Toggle "Go Live"

BEHAVIOR RULES:
- Be friendly, helpful and concise
- Answer questions specifically about Tournament Hub features
- If asked about coding or technical setup, give clear step-by-step guidance
- Use emojis occasionally to be friendly but not excessive
- Keep responses short and to the point (max 150 words unless complex)
- If unsure, say so honestly and suggest checking the relevant page in the app
- Always refer to the app as "Tournament Hub"`;

    // Build conversation history
    var groqMessages = [{ role: 'system', content: systemPrompt }];

    // Add previous messages (last 10 for context)
    var history = messages.slice(-10);
    history.forEach(function (m) {
      if (m.role === 'user' || m.role === 'assistant') {
        groqMessages.push({ role: m.role, content: m.content });
      }
    });

    // Add current message
    groqMessages.push({ role: 'user', content: userMessage });

    var groq = getGroq();
    var completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      temperature: 0.6,
      max_tokens: 500,
    });

    var reply = completion.choices[0].message.content.trim();
    res.json({ reply: reply });

  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(500).json({ message: 'Chatbot failed: ' + err.message });
  }
});