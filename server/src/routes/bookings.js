import { Router } from 'express';
import mongoose from 'mongoose';
import { Booking, Show, Notification } from '../models.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/', async (req, res, next) => {
  try {
    res.json(await Booking.find({ user: req.user._id }).populate({
      path: 'show', populate: [{ path: 'movie', select: 'title posterUrl' }, { path: 'theatre', select: 'name city' }]
    }).sort({ createdAt: -1 }));
  } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const seatNumbers = [...new Set((req.body.seats || []).map(String))];
    if (!req.body.showId || seatNumbers.length === 0 || seatNumbers.length > 10)
      return res.status(400).json({ message: 'Select a show and between 1 and 10 seats.' });
    let booking;
    await session.withTransaction(async () => {
      const show = await Show.findById(req.body.showId).session(session);
      if (!show || show.startsAt <= new Date()) throw Object.assign(new Error('Show not found or already started.'), { status: 400 });
      const selected = show.seats.filter(s => seatNumbers.includes(s.number));
      if (selected.length !== seatNumbers.length) throw Object.assign(new Error('One or more seat numbers are invalid.'), { status: 400 });
      if (selected.some(s => s.status !== 'available')) throw Object.assign(new Error('A selected seat has just been booked. Please choose other seats.'), { status: 409 });
      selected.forEach(s => { s.status = 'booked'; s.bookedBy = req.user._id; });
      await show.save({ session });
      const [created] = await Booking.create([{
        user: req.user._id, show: show._id, seats: seatNumbers,
        totalAmount: show.price * seatNumbers.length,
        payment: { provider: 'demo', status: 'simulated_success', reference: `DEMO-${Date.now()}` }
      }], { session });
      booking = created;
      await Notification.create([{ user: req.user._id, message: `Booking confirmed for ${seatNumbers.join(', ')}. Demo payment only.` }], { session });
    });
    res.status(201).json({ message: 'Booking confirmed. Payment is simulated for this demo.', booking });
  } catch (err) { next(err); }
  finally { await session.endSession(); }
});
router.patch('/:id/cancel', async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id }).session(session);
      if (!booking) throw Object.assign(new Error('Booking not found.'), { status: 404 });
      if (booking.status === 'cancelled') throw Object.assign(new Error('Booking is already cancelled.'), { status: 400 });
      const show = await Show.findById(booking.show).session(session);
      if (show) {
        show.seats.forEach(s => { if (booking.seats.includes(s.number) && String(s.bookedBy) === String(req.user._id)) { s.status = 'available'; s.bookedBy = null; } });
        await show.save({ session });
      }
      booking.status = 'cancelled';
      booking.payment.status = 'refunded_demo';
      await booking.save({ session });
      await Notification.create([{ user: req.user._id, message: `Booking ${booking._id} cancelled. Demo payment marked refunded.` }], { session });
      result = booking;
    });
    res.json({ message: 'Booking cancelled.', booking: result });
  } catch (err) { next(err); }
  finally { await session.endSession(); }
});
export default router;
