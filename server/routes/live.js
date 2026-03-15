const express = require('express');
const router = express.Router();
const LiveStream = require('../models/LiveStream');
const Tournament = require('../models/Tournament');
const { protect, hostOnly } = require('../middleware/auth');

// Helper: extract YouTube video ID from any YouTube URL
function extractYouTubeId(url) {
    var patterns = [
        /youtu\.be\/([^?&]+)/,
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtube\.com\/embed\/([^?&]+)/,
        /youtube\.com\/live\/([^?&]+)/,
    ];
    for (var i = 0; i < patterns.length; i++) {
        var match = url.match(patterns[i]);
        if (match) return match[1];
    }
    return null;
}

// Helper: detect stream type
function detectStreamType(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('twitch.tv')) return 'twitch';
    if (url.includes('facebook.com')) return 'facebook';
    return 'other';
}

// Helper: build embed URL
function buildEmbedUrl(url, type) {
    if (type === 'youtube') {
        var id = extractYouTubeId(url);
        if (id) return 'https://www.youtube.com/embed/' + id + '?autoplay=0&rel=0';
    }
    if (type === 'twitch') {
        var channelMatch = url.match(/twitch\.tv\/([^/?\s]+)/);
        if (channelMatch) {
            return 'https://player.twitch.tv/?channel=' + channelMatch[1] + '&parent=' + (process.env.CLIENT_DOMAIN || 'localhost');
        }
    }
    return url;
}

// GET /api/live/tournament/:tournamentId — get all streams for a tournament
router.get('/tournament/:tournamentId', async function (req, res) {
    try {
        var streams = await LiveStream.find({ tournament: req.params.tournamentId })
            .populate('host', 'name')
            .sort({ isLive: -1, createdAt: -1 });
        res.json(streams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/live/:id — get single stream with comments
router.get('/:id', async function (req, res) {
    try {
        var stream = await LiveStream.findById(req.params.id)
            .populate('host', 'name')
            .populate('comments.user', 'name role');
        if (!stream) return res.status(404).json({ message: 'Stream not found' });

        // increment view count
        stream.viewCount = stream.viewCount + 1;
        await stream.save();

        res.json(stream);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/live — host creates a stream
router.post('/', protect, hostOnly, async function (req, res) {
    try {
        var body = req.body;
        var tournament = await Tournament.findById(body.tournamentId);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
        if (tournament.host.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not your tournament' });

        var type = detectStreamType(body.streamUrl || '');
        var embedUrl = buildEmbedUrl(body.streamUrl || '', type);

        var stream = await LiveStream.create({
            tournament: body.tournamentId,
            host: req.user._id,
            title: body.title,
            description: body.description || '',
            streamUrl: body.streamUrl,
            streamType: type,
            embedUrl: embedUrl,
            isLive: body.isLive || false,
            matchTitle: body.matchTitle || '',
            matchRound: body.matchRound || '',
            team1: body.team1 || '',
            team2: body.team2 || '',
            score1: body.score1 || '',
            score2: body.score2 || '',
        });

        res.status(201).json(stream);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/live/:id — host updates stream (title, description, scores, isLive)
router.put('/:id', protect, hostOnly, async function (req, res) {
    try {
        var stream = await LiveStream.findById(req.params.id);
        if (!stream) return res.status(404).json({ message: 'Stream not found' });
        if (stream.host.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not your stream' });

        var fields = ['title', 'description', 'streamUrl', 'isLive', 'matchTitle', 'matchRound', 'team1', 'team2', 'score1', 'score2'];
        fields.forEach(function (f) {
            if (req.body[f] !== undefined) stream[f] = req.body[f];
        });

        if (req.body.streamUrl) {
            var type = detectStreamType(req.body.streamUrl);
            stream.streamType = type;
        }

        await stream.save();
        res.json(stream);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/live/:id — host deletes stream
router.delete('/:id', protect, hostOnly, async function (req, res) {
    try {
        var stream = await LiveStream.findById(req.params.id);
        if (!stream) return res.status(404).json({ message: 'Stream not found' });
        if (stream.host.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not your stream' });
        await LiveStream.findByIdAndDelete(req.params.id);
        res.json({ message: 'Stream deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/live/:id/comment — any logged-in user adds comment
router.post('/:id/comment', protect, async function (req, res) {
    try {
        var text = (req.body.text || '').trim();
        if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
        if (text.length > 300) return res.status(400).json({ message: 'Comment too long (max 300 chars)' });

        var stream = await LiveStream.findById(req.params.id);
        if (!stream) return res.status(404).json({ message: 'Stream not found' });

        stream.comments.push({
            user: req.user._id,
            name: req.user.name,
            text: text,
        });
        await stream.save();

        // Return only the new comment
        var newComment = stream.comments[stream.comments.length - 1];
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/live/:id/comment/:commentId — user deletes own comment or host deletes any
router.delete('/:id/comment/:commentId', protect, async function (req, res) {
    try {
        var stream = await LiveStream.findById(req.params.id);
        if (!stream) return res.status(404).json({ message: 'Stream not found' });

        var comment = stream.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        var isOwner = comment.user.toString() === req.user._id.toString();
        var isHost = stream.host.toString() === req.user._id.toString();
        if (!isOwner && !isHost) return res.status(403).json({ message: 'Cannot delete this comment' });

        comment.deleteOne();
        await stream.save();
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;