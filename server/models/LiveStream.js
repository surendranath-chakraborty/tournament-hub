const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    text: { type: String, required: true, maxlength: 300 },
    createdAt: { type: Date, default: Date.now },
});

const liveStreamSchema = new mongoose.Schema(
    {
        tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
        host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        // Stream info
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        streamUrl: { type: String, required: true }, // YouTube / Twitch / any embed link
        streamType: { type: String, enum: ['youtube', 'twitch', 'facebook', 'other'], default: 'youtube' },

        // Status
        isLive: { type: Boolean, default: false },
        viewCount: { type: Number, default: 0 },

        // Match context
        matchTitle: { type: String, default: '' }, // e.g. "Semi Final - Team A vs Team B"
        matchRound: { type: String, default: '' }, // e.g. "Quarter Final"
        team1: { type: String, default: '' },
        team2: { type: String, default: '' },
        score1: { type: String, default: '' },
        score2: { type: String, default: '' },

        // Comments
        comments: [commentSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('LiveStream', liveStreamSchema);