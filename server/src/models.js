import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  genre: { type: String, required: true },
  language: { type: String, default: 'Hindi' },
  durationMinutes: { type: Number, default: 120, min: 1 },
  rating: { type: Number, default: 0, min: 0, max: 10 },
  releaseDate: Date,
  description: { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const theatreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, default: '' },
  totalSeats: { type: Number, default: 60, min: 1 }
}, { timestamps: true });

const showSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
  startsAt: { type: Date, required: true },
  price: { type: Number, required: true, min: 1 },
  seats: [{
    number: { type: String, required: true },
    status: { type: String, enum: ['available', 'booked'], default: 'available' },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }]
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  seats: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  payment: {
    provider: { type: String, default: 'demo' },
    status: { type: String, enum: ['simulated_success', 'refunded_demo'], default: 'simulated_success' },
    reference: String
  }
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Movie = mongoose.model('Movie', movieSchema);
export const Theatre = mongoose.model('Theatre', theatreSchema);
export const Show = mongoose.model('Show', showSchema);
export const Booking = mongoose.model('Booking', bookingSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
