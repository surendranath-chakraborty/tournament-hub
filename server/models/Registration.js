const mongoose = require('mongoose');

const playerDetailSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  age:   { type: Number, default: null },
});

const registrationSchema = new mongoose.Schema(
  {
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },

    registrationType: { type: String, enum: ['team', 'solo'], required: true },
    teamName:         { type: String, default: '' },
    players:          [playerDetailSchema],

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'waitlisted', 'withdrawn', 'removed'],
      default: 'pending',
    },

    waitlistPosition: { type: Number, default: null },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    paymentId:  { type: String, default: '' },
    orderId:    { type: String, default: '' },
    amountPaid: { type: Number, default: 0 },

    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'processed'],
      default: 'none',
    },
    refundId: { type: String, default: '' },

    removedByHost: { type: Boolean, default: false },
    hostNote:      { type: String,  default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
