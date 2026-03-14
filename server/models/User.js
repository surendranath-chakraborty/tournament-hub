const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:               { type: String,  required: true,  trim: true },
    email:              { type: String,  required: true,  unique: true, lowercase: true },
    password:           { type: String,  required: true,  minlength: 6 },
    role:               { type: String,  enum: ['host', 'player'], required: true },
    phone:              { type: String,  default: '' },
    city:               { type: String,  default: '' },
    // Player stats
    tournamentsPlayed:  { type: Number,  default: 0 },
    tournamentsWon:     { type: Number,  default: 0 },
    // Host stats
    tournamentsHosted:  { type: Number,  default: 0 },
    totalRevenue:       { type: Number,  default: 0 },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare entered password with hash
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
