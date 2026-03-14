const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    host:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:        { type: String, required: true, trim: true },
    sport:        { type: String, required: true },
    description:  { type: String, default: '' },
    rules:        { type: String, default: '' },
    type:         { type: String, enum: ['team', 'solo'], required: true },
    indoorOutdoor:{ type: String, enum: ['indoor', 'outdoor'], required: true },

    location: {
      city:    { type: String, required: true },
      venue:   { type: String, required: true },
      address: { type: String, default: '' },
    },

    startDate:  { type: Date, required: true },
    endDate:    { type: Date, required: true },

    maxSlots:        { type: Number, required: true },
    registeredCount: { type: Number, default: 0 },
    waitlistCount:   { type: Number, default: 0 },

    entryFee: { type: Number, default: 0 },

    registrationDeadline: { type: Date, required: true },
    withdrawalDeadline:   { type: Date, required: true },
    editDeadline:         { type: Date, required: true },

    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'full', 'closed', 'cancelled'],
      default: 'upcoming',
    },

    prizePool:   { type: String, default: '' },
    firstPrize:  { type: String, default: '' },
    secondPrize: { type: String, default: '' },
  },
  { timestamps: true }
);

// Virtual: available slots
tournamentSchema.virtual('availableSlots').get(function () {
  return this.maxSlots - this.registeredCount;
});

tournamentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
