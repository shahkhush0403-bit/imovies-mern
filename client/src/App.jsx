import { motion } from "framer-motion";
import React from "react";
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Search, Ticket, UserRound, LogOut, ShieldCheck, CalendarDays, MapPin, Clock3, X, Check, Clapperboard } from 'lucide-react';
import api from './api';

const fallbackMovies = [
 { _id:'sample1', title:'The Last Horizon', genre:'Sci-Fi', language:'English', rating:8.4, durationMinutes:142, description:'A crew follows a mysterious signal beyond the edge of known space.', posterUrl:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80' },
 { _id:'sample2', title:'Midnight Run', genre:'Action', language:'Hindi', rating:7.8, durationMinutes:128, description:'One night. One impossible delivery. No room for mistakes.', posterUrl:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80' },
 { _id:'sample3', title:'The Blue Room', genre:'Drama', language:'English', rating:8.1, durationMinutes:116, description:'A quiet story about second chances and unexpected connections.', posterUrl:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80' },
 { _id:'sample4', title:'Wild City', genre:'Adventure', language:'Hindi', rating:7.5, durationMinutes:134, description:'Two friends find a path home through an untamed world.', posterUrl:'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80' },
 { _id:'sample5', title:'After the Storm', genre:'Thriller', language:'English', rating:8.0, durationMinutes:121, description:'Every clue brings a small town closer to its biggest secret.', posterUrl:'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80' },
 { _id:'sample6', title:'Golden Hour', genre:'Romance', language:'Hindi', rating:7.9, durationMinutes:109, description:'Two strangers meet every evening at the same old cinema.', posterUrl:'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80' }
];
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const errorText = e => e.response?.data?.message || 'Could not connect to the API. Check that the backend and database are running.';
function App() {
 const [user,setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('imovies_user') || 'null'); } catch { return null; } });
 const [movies,setMovies] = useState([]);
 const [shows,setShows] = useState([]);
 const [bookings,setBookings] = useState([]);
 const [query,setQuery] = useState('');
 const [genre,setGenre] = useState('All');
 const [modal,setModal] = useState(null);
 const [selectedMovie,setSelectedMovie] = useState(null);
 const [selectedShow,setSelectedShow] = useState(null);
 const [selectedSeats,setSelectedSeats] = useState([]);
 const [notice,setNotice] = useState('');
 const [paymentMethod, setPaymentMethod] = useState('UPI');
 const [confirmedBooking, setConfirmedBooking] = useState(null);
 const [busy,setBusy] = useState(false);
 const [apiOnline,setApiOnline] = useState(false);
 const [adminForm,setAdminForm] = useState({title:'',genre:'Drama',language:'Hindi',durationMinutes:120,rating:7.5,description:'',posterUrl:''});
 const [theatreForm, setTheatreForm] = useState({
  name: '',
  city: '',
  address: '',
  totalSeats: 60
});

const [showForm, setShowForm] = useState({
  movie: '',
  theatre: '',
  startsAt: '',
  price: 200,
  totalSeats: 60
});

const [theatres, setTheatres] = useState([]);
 const navigate = useNavigate();

 async function loadMovies() {
   try { const r = await api.get('/movies'); setMovies(r.data); setApiOnline(true); }
   catch { setMovies([]); setApiOnline(false); }
 }
 async function loadShows(movieId) {
   try { const r = await api.get('/shows', { params: movieId ? {movieId} : {} }); setShows(r.data); }
   catch { setShows([]); }
 }
 async function loadBookings() {
   if (!user) return;
   try { const r = await api.get('/bookings'); setBookings(r.data); } catch { setBookings([]); }
 }
 useEffect(() => { loadMovies(); loadShows(); }, []);
 useEffect(() => { loadBookings(); }, [user?.id]);
 const displayed = useMemo(() => {
   const list = movies.length ? movies : fallbackMovies;
   return list.filter(m => m.title.toLowerCase().includes(query.toLowerCase()) && (genre === 'All' || m.genre === genre));
 }, [movies,query,genre]);
 const genres = ['All', ...new Set((movies.length ? movies : fallbackMovies).map(m => m.genre))];

 function logout() {
   localStorage.removeItem('imovies_token'); localStorage.removeItem('imovies_user');
   setUser(null); setBookings([]); setNotice('You have been logged out.');
 }
 async function authSubmit(e) {
   e.preventDefault(); setBusy(true); setNotice('');
   const data = new FormData(e.currentTarget);
   try {
     const path = modal.mode === 'register' ? '/auth/register' : '/auth/login';
     const payload = modal.mode === 'register'
       ? { name:data.get('name'), email:data.get('email'), password:data.get('password') }
       : { email:data.get('email'), password:data.get('password') };
     const r = await api.post(path,payload);
     localStorage.setItem('imovies_token',r.data.token); localStorage.setItem('imovies_user',JSON.stringify(r.data.user));
     setUser(r.data.user); setModal(null); setNotice(`Welcome${r.data.user.name ? `, ${r.data.user.name}` : ''}!`);
   } catch(e) { setNotice(errorText(e)); }
   finally { setBusy(false); }
 }
 async function openMovie(movie) {
   setSelectedMovie(movie); setSelectedShow(null); setSelectedSeats([]); await loadShows(movie._id.startsWith('sample') ? null : movie._id); setModal({mode:'movie'});
 }
 function requireLogin(action) {
   if (!user) { setNotice('Please log in or create an account first.'); setModal({mode:'login'}); return false; }
   action(); return true;
 }
function startCheckout() {
  if (!selectedShow || !selectedSeats.length) return;

  if (!user) {
    setNotice('Please log in to continue.');
    setModal({ mode: 'login' });
    return;
  }

  setPaymentMethod('UPI');
  setModal({ mode: 'checkout' });
}

async function bookSeats() {
  if (!selectedShow || !selectedSeats.length) return;

  setBusy(true);
  setNotice('');

  try {
    const r = await api.post('/bookings', {
      showId: selectedShow._id,
      seats: selectedSeats
    });

    setConfirmedBooking(r.data.booking);
    setSelectedSeats([]);
    setModal({ mode: 'payment-success' });

    await loadShows(selectedMovie?._id);
    await loadBookings();
  } catch (e) {
    setNotice(errorText(e));
  } finally {
    setBusy(false); }
 }
 async function cancelBooking(id) {
   try { await api.patch(`/bookings/${id}/cancel`); setNotice('Booking cancelled. Demo payment marked refunded.'); await loadBookings(); await loadShows(); }
   catch(e) { setNotice(errorText(e)); }
 }

  async function createMovie(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/movies', {
        ...adminForm,
        durationMinutes: Number(adminForm.durationMinutes),
        rating: Number(adminForm.rating)
      });
      setNotice('Movie added.');
      setAdminForm({
        title: '',
        genre: 'Drama',
        language: 'Hindi',
        durationMinutes: 120,
        rating: 7.5,
        description: '',
        posterUrl: ''
      });
      await loadMovies();
    } catch (e) {
      setNotice(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadTheatres() {
    try {
      const r = await api.get('/shows/theatres');
      setTheatres(r.data);
    } catch (e) {
      setNotice(errorText(e));
    }
  }

  async function createTheatre(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/shows/theatres', {
        ...theatreForm,
        totalSeats: Number(theatreForm.totalSeats)
      });
      setNotice('Theatre added successfully.');
      setTheatreForm({
        name: '',
        city: '',
        address: '',
        totalSeats: 60
      });
      await loadTheatres();
    } catch (e) {
      setNotice(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function createShow(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/shows', {
        ...showForm,
        price: Number(showForm.price),
        totalSeats: Number(showForm.totalSeats),
        startsAt: new Date(showForm.startsAt).toISOString()
      });
      setNotice('Showtime created successfully.');
      setShowForm({
        movie: '',
        theatre: '',
        startsAt: '',
        price: 200,
        totalSeats: 60
      });
      await loadShows();
    } catch (e) {
      setNotice(errorText(e));
    } finally {
      setBusy(false);
    }
  }

 return <div className="app-shell">
   <header className="topbar">
     <Link className="brand" to="/" onClick={()=>setModal(null)}><span className="brand-icon"><Clapperboard size={21}/></span><span>i<span className="pink">Movies</span><small>CINEMA, YOUR WAY</small></span></Link>
     <nav><a href="#movies">Movies</a><a href="#shows">Showtimes</a>{user && <button className="nav-link" onClick={()=>setModal({mode:'bookings'})}>My bookings</button>}{user?.role === 'admin' && (
  <button
    className="nav-link"
    onClick={async () => {
      setModal({ mode: 'admin' });
      await loadMovies();
      await loadTheatres();
    }}
  >
    Admin
  </button>
)}</nav>
     <div className="account">{user ? <><span className="user-pill"><UserRound size={15}/>{user.name.split(' ')[0]}</span><button className="icon-btn" title="Log out" onClick={logout}><LogOut size={17}/></button></> : <><button className="btn btn-ghost" onClick={()=>setModal({mode:'login'})}>Log in</button><button className="btn btn-primary" onClick={()=>setModal({mode:'register'})}>Join free</button></>}</div>
   </header>
   <main>
     <section className="hero">
       <div className="hero-copy"><span className="eyebrow"><span className="live-dot"/> YOUR NEXT MOVIE NIGHT STARTS HERE</span><h1>Stories worth<br/>the <span className="gradient-text">big screen.</span></h1><p>Discover your next favourite film. Find a showtime, pick your seats, and make it a night to remember.</p><a className="btn btn-primary hero-cta" href="#movies">Explore movies <span>↗</span></a><div className="hero-stats"><div><strong>6+</strong><span>Stories to explore</span></div><i/><div><strong>Easy</strong><span>Seat selection</span></div><i/><div><strong>Anytime</strong><span>Booking history</span></div></div></div>
       <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="poster-stack"><div className="hero-poster poster-back"><img src={fallbackMovies[3].posterUrl} /></div><div className="hero-poster poster-front"><img src={fallbackMovies[0].posterUrl}/><span className="poster-caption">THE NEXT BIG THING</span></div><div className="floating-rating">★ <b>8.4</b><small>Audience rating</small></div><div className="floating-ticket"><Ticket size={18}/><span>YOUR SEAT<br/><b>IS WAITING</b></span></div></div></div>
       <div className="hero-bottom"><span>NOW SHOWING</span><span>DISCOVER · BOOK · ENJOY</span></div>
     </section>
     {!apiOnline && <div className="demo-banner"><span>✦ Preview mode</span> Sample movie cards are visible. Start the API and connect MongoDB to enable live data, accounts and bookings.</div>}
     {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
     <section className="movies-section" id="movies">
       <div className="section-heading"><div><span className="eyebrow">FIND YOUR NEXT FAVOURITE</span><h2>Now <span className="pink">showing</span></h2><p>Big feelings. Bigger screens. Pick your story.</p></div><div className="movie-count"><strong>{displayed.length.toString().padStart(2,'0')}</strong><span>FILMS</span></div></div>
       <div className="filters"><label className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search movies..." /></label><div className="genre-filters">{genres.map(g=><button key={g} className={genre===g?'filter active':'filter'} onClick={()=>setGenre(g)}>{g}</button>)}</div></div>
       <div className="movie-grid">{displayed.map((m,i)=><article className="movie-card" key={m._id}><button className="poster-button" onClick={()=>openMovie(m)} aria-label={`View ${m.title}`}><img src={m.posterUrl || fallbackMovies[i%fallbackMovies.length].posterUrl} alt={m.title} loading="lazy"/><span className="poster-overlay"><span className="play-button">▶</span><span>VIEW DETAILS</span></span><span className="rating">★ {m.rating || 'NR'}</span></button><div className="movie-info"><div className="movie-meta"><span>{m.genre}</span><span>·</span><span>{m.language}</span></div><h3>{m.title}</h3><div className="movie-bottom"><span><Clock3 size={14}/> {m.durationMinutes || 120} min</span><button onClick={()=>openMovie(m)}>Book <span>↗</span></button></div></div></article>)}</div>
       {!displayed.length && <div className="empty-state">No movies match that search. Try another title or genre.</div>}
     </section>
     <section className="showcase" id="shows"><div><span className="eyebrow">YOUR SEAT. YOUR STORY.</span><h2>Make room for<br/><span className="gradient-text">a little magic.</span></h2><p>Choose a show, pick your seats and keep your booking details in one place.</p><button className="btn btn-primary" onClick={()=>requireLogin(()=>setModal({mode:'bookings'}))}>View my bookings ↗</button></div><div className="showcase-card"><div className="screen-line"/><div className="seat-preview">{Array.from({length:40},(_,i)=><span key={i} className={i===13||i===14||i===21?'seat taken':'seat'}/>)}</div><span className="screen-label">SCREEN THIS WAY</span><div className="showcase-foot"><span><Ticket size={16}/> YOUR CINEMA NIGHT</span><span>● SEATS GO FAST</span></div></div></section>
   </main>
   <footer><Link className="brand footer-brand" to="/"><span className="brand-icon"><Clapperboard size={19}/></span><span>i<span className="pink">Movies</span><small>CINEMA, YOUR WAY</small></span></Link><span>Made for movie lovers. <span className="pink">♥</span></span><span>IMovies · Student project</span></footer>

   {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><div className={`modal ${modal.mode==='movie'?'movie-modal':''}`} role="dialog" aria-modal="true">
     <button className="modal-close" onClick={()=>setModal(null)} aria-label="Close"><X size={20}/></button>
     {(modal.mode==='login'||modal.mode==='register') && <div className="auth-layout"><div className="auth-art"><Clapperboard size={34}/><h2>Every story<br/>starts somewhere.</h2><p>Your next favourite film is just a few clicks away.</p></div><div className="auth-form"><span className="eyebrow">{modal.mode==='register'?'JOIN THE CLUB':'WELCOME BACK'}</span><h2>{modal.mode==='register'?'Create account':'Log in'}</h2><p className="muted">{modal.mode==='register'?'Save your seats. Keep your movie nights close.':'Pick up where your next movie night begins.'}</p><form onSubmit={authSubmit}>{modal.mode==='register'&&<label>Full name<input name="name" required minLength="2" placeholder="Your name"/></label>}<label>Email address<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<input name="password" type="password" required minLength="8" placeholder="At least 8 characters"/></label><button className="btn btn-primary full" disabled={busy}>{busy?'Please wait…':modal.mode==='register'?'Create account':'Log in'} ↗</button></form><p className="switch-auth">{modal.mode==='register'?'Already have an account?':'New to IMovies?'} <button onClick={()=>setModal({mode:modal.mode==='register'?'login':'register'})}>{modal.mode==='register'?'Log in':'Join free'}</button></p></div></div>}
     {modal.mode==='movie' && selectedMovie && <div className="movie-detail"><img className="detail-poster" src={selectedMovie.posterUrl || fallbackMovies[0].posterUrl} alt={selectedMovie.title}/><div className="detail-content"><span className="eyebrow">MOVIE DETAILS</span><h2>{selectedMovie.title}</h2><div className="detail-meta"><span>★ {selectedMovie.rating || 'NR'}</span><span>{selectedMovie.genre}</span><span>{selectedMovie.language}</span><span>{selectedMovie.durationMinutes || 120} min</span></div><p>{selectedMovie.description || 'A movie night worth making time for.'}</p><h3><CalendarDays size={17}/> Available showtimes</h3>{shows.filter(s=>!s.movie?._id || s.movie._id===selectedMovie._id).length ? <div className="show-list">{shows.filter(s=>!s.movie?._id || s.movie._id===selectedMovie._id).map(s=><button key={s._id} className={`show-option ${selectedShow?._id===s._id?'chosen':''}`} onClick={()=>{setSelectedShow(s);setSelectedSeats([])}}><span><b>{new Date(s.startsAt).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</b><small><Clock3 size={13}/>{new Date(s.startsAt).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</small><small><MapPin size={13}/>{s.theatre?.name || 'Cinema'} · {s.theatre?.city || ''}</small></span><strong>{money(s.price)}</strong></button>)}</div>:<div className="empty-shows">No live showtimes are available yet. {user?.role==='admin'?'Add a show from the API after creating a theatre.':'Please check back soon.'}</div>}
     {selectedShow && <><h3>Select seats <span className="seat-legend"><i/> Available <i className="legend-selected"/> Selected <i className="legend-booked"/> Booked</span></h3><div className="screen-label screen-label-detail">SCREEN</div><div className="seat-grid">{selectedShow.seats?.map(s=><button key={s.number} disabled={s.status!=='available'} title={`${s.number}: ${s.status}`} className={`seat-choice ${s.status} ${selectedSeats.includes(s.number)?'selected':''}`} onClick={()=>setSelectedSeats(old=>old.includes(s.number)?old.filter(x=>x!==s.number):old.length<10?[...old,s.number]:old)}>{s.number}</button>)}</div><div className="booking-summary"><span>{selectedSeats.length} seat(s) selected<br/><b>{money(selectedShow.price*selectedSeats.length)}</b></span><button className="btn btn-primary" disabled={!selectedSeats.length||busy} onClick={startCheckout}>{busy?'Processing…':'Confirm booking'} ↗</button></div><p className="tiny-note">Demo payment only. No real payment is collected.</p></>}</div></div>}
     
{modal.mode === 'checkout' && selectedMovie && selectedShow && (
  <div className="simple-modal">
    <span className="eyebrow">SECURE CHECKOUT · DEMO</span>
    <h2>Complete your booking</h2>
    <p className="muted">
      Review your movie details and choose a simulated payment method.
      No real payment will be collected.
    </p>

    <div className="booking-row">
      <div className="booking-thumb">
        <Ticket />
      </div>
      <div className="booking-text">
        <b>{selectedMovie.title}</b>
        <span>{selectedShow.theatre?.name} · {selectedShow.theatre?.city}</span>
        <span>{new Date(selectedShow.startsAt).toLocaleString()}</span>
        <span>Seats: {selectedSeats.join(', ')}</span>
      </div>
      <div className="booking-end">
        <b>{money(selectedShow.price * selectedSeats.length)}</b>
      </div>
    </div>

    <h3>Choose payment method</h3>

    {['UPI', 'Card', 'Net Banking'].map(method => (
      <label
        key={method}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px',
          marginBottom: '8px',
          border: '1px solid var(--border, #333)',
          borderRadius: '10px',
          cursor: 'pointer'
        }}
      >
        <input
          type="radio"
          name="paymentMethod"
          value={method}
          checked={paymentMethod === method}
          onChange={() => setPaymentMethod(method)}
        />
        {method}
        {method === 'UPI' ? ' — Demo UPI' :
         method === 'Card' ? ' — Demo card' :
         ' — Demo banking'}
      </label>
    ))}

    <p className="tiny-note">
      This is a simulated payment. Do not enter actual payment details.
    </p>

    <button
      className="btn btn-primary full"
      disabled={busy}
      onClick={bookSeats}
    >
      {busy ? 'Processing…' :
        `Pay ${money(selectedShow.price * selectedSeats.length)}`}
    </button>

    <button
      className="btn btn-ghost full"
      disabled={busy}
      onClick={() => setModal({ mode: 'movie' })}
    >
      Back to seats
    </button>
  </div>
)}

{modal.mode === 'payment-success' && confirmedBooking && (
  <motion.div
  className="simple-modal"
  initial={{ opacity: 0, y: 35, scale: 0.96 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.55, ease: "easeOut" }}
>
    <div style={{ textAlign: 'center', padding: '12px' }}>
     <motion.div
  initial={{ opacity: 0, scale: 0.4 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.15, duration: 0.4, type: "spring" }}
>
  <Check size={48} color="#22c55e" />
</motion.div>
      <motion.span
  className="eyebrow"
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3, duration: 0.35 }}
>
        PAYMENT SUCCESSFUL · DEMO
      </motion.span>
      <h2>You're going to the movies!</h2>
      <motion.p className="muted" initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.6, duration: 0.4 }}>
        Your booking has been confirmed successfully.
      </motion.p>
    </div>

    <div className="booking-row">
      <div className="booking-thumb">
        <Ticket />
      </div>
      <div className="booking-text">
        <b>{selectedMovie?.title || 'Movie booking'}</b>
        <span>Seats: {confirmedBooking.seats?.join(', ')}</span>
        <span>Booking ID: {confirmedBooking._id}</span>
        <span>Payment method: {paymentMethod}</span>
        <small>Demo payment — no real money charged</small>
      </div>
      <div className="booking-end">
        <b>{money(confirmedBooking.totalAmount)}</b>
      </div>
    </div>

    <button
      className="btn btn-primary full"
      onClick={() => {
        setModal(null);
        setSelectedShow(null);
        setSelectedMovie(null);
        setConfirmedBooking(null);
      }}
    >
      Done
    </button>

    <button
      className="btn btn-ghost full"
      onClick={() => setModal({ mode: 'bookings' })}
    >
      View my bookings
    </button>
  </motion.div>
)}

     {modal.mode==='bookings' && <div className="simple-modal"><span className="eyebrow">YOUR CINEMA HISTORY</span><h2>My bookings</h2><p className="muted">Your reservations, all in one place.</p>{!bookings.length?<div className="empty-state">No bookings yet. Find a movie and book your seats to see them here.</div>:<div className="booking-list">{bookings.map(b=><div className="booking-row" key={b._id}><div className="booking-thumb"><Ticket/></div><div className="booking-text"><b>{b.show?.movie?.title || 'Movie booking'}</b><span>{b.seats.join(', ')} · {b.show?.theatre?.name || 'Cinema'}</span><span>{b.show?.startsAt?new Date(b.show.startsAt).toLocaleString():''}</span><small>{b.payment?.status==='simulated_success'?'Demo payment':'Cancelled/refunded demo'}</small></div><div className="booking-end"><b>{money(b.totalAmount)}</b><span className={b.status==='confirmed'?'status-confirmed':'status-cancelled'}>{b.status}</span>{b.status==='confirmed'&&<button onClick={()=>cancelBooking(b._id)}>Cancel</button>}</div></div>)}</div>}</div>}
     {modal.mode === 'admin' && (
  <div className="simple-modal">
    <span className="eyebrow">ADMIN CONSOLE</span>
    <h2>Manage movies, theatres & shows</h2>
    <p className="muted">
      Add movies, register theatres, and schedule upcoming showtimes.
    </p>

    {/* ADD MOVIE */}
    <h3>Add Movie</h3>
    <form className="admin-form" onSubmit={createMovie}>
      <label>
        Movie title
        <input
          required
          value={adminForm.title}
          onChange={e => setAdminForm({ ...adminForm, title: e.target.value })}
        />
      </label>

      <div className="form-row">
        <label>
          Genre
          <select
            value={adminForm.genre}
            onChange={e => setAdminForm({ ...adminForm, genre: e.target.value })}
          >
            {['Drama', 'Action', 'Comedy', 'Sci-Fi', 'Adventure', 'Thriller', 'Romance', 'Horror'].map(x =>
              <option key={x}>{x}</option>
            )}
          </select>
        </label>
        <label>
          Language
          <select
            value={adminForm.language}
            onChange={e => setAdminForm({ ...adminForm, language: e.target.value })}
          >
            {['Hindi', 'English', 'Gujarati', 'Tamil', 'Telugu', 'Malayalam'].map(x =>
              <option key={x}>{x}</option>
            )}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Duration (minutes)
          <input
            type="number"
            min="1"
            required
            value={adminForm.durationMinutes}
            onChange={e => setAdminForm({ ...adminForm, durationMinutes: e.target.value })}
          />
        </label>
        <label>
          Rating / 10
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={adminForm.rating}
            onChange={e => setAdminForm({ ...adminForm, rating: e.target.value })}
          />
        </label>
      </div>

      <label>
        Poster image URL
        <input
          type="url"
          value={adminForm.posterUrl}
          onChange={e => setAdminForm({ ...adminForm, posterUrl: e.target.value })}
          placeholder="https://..."
        />
      </label>

      <label>
        Description
        <textarea
          rows="3"
          value={adminForm.description}
          onChange={e => setAdminForm({ ...adminForm, description: e.target.value })}
        />
      </label>

      <button className="btn btn-primary full" disabled={busy}>
        {busy ? 'Saving…' : 'Add movie'}
      </button>
    </form>

    <hr />

    {/* ADD THEATRE */}
    <h3>Add Theatre</h3>
    <form className="admin-form" onSubmit={createTheatre}>
      <label>
        Theatre name
        <input
          required
          value={theatreForm.name}
          onChange={e => setTheatreForm({ ...theatreForm, name: e.target.value })}
          placeholder="e.g. Cineplex Central"
        />
      </label>

      <label>
        City
        <input
          required
          value={theatreForm.city}
          onChange={e => setTheatreForm({ ...theatreForm, city: e.target.value })}
          placeholder="e.g. Indore"
        />
      </label>

      <label>
        Address
        <input
          required
          value={theatreForm.address}
          onChange={e => setTheatreForm({ ...theatreForm, address: e.target.value })}
          placeholder="Theatre address"
        />
      </label>

      <label>
        Total seats
        <input
          type="number"
          min="1"
          max="300"
          required
          value={theatreForm.totalSeats}
          onChange={e => setTheatreForm({ ...theatreForm, totalSeats: e.target.value })}
        />
      </label>

      <button className="btn btn-primary full" disabled={busy}>
        {busy ? 'Saving…' : 'Add theatre'}
      </button>
    </form>

    <hr />

    {/* SCHEDULE SHOWTIME */}
    <h3>Schedule Showtime</h3>
    <form className="admin-form" onSubmit={createShow}>
      <label>
        Movie
        <select
          required
          value={showForm.movie}
          onChange={e => setShowForm({ ...showForm, movie: e.target.value })}
        >
          <option value="">Select a movie</option>
          {movies.map(movie => (
            <option key={movie._id} value={movie._id}>
              {movie.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        Theatre
        <select
          required
          value={showForm.theatre}
          onChange={e => setShowForm({ ...showForm, theatre: e.target.value })}
        >
          <option value="">Select a theatre</option>
          {theatres.map(theatre => (
            <option key={theatre._id} value={theatre._id}>
              {theatre.name} — {theatre.city}
            </option>
          ))}
        </select>
      </label>

      <label>
        Date and time
        <input
          type="datetime-local"
          required
          min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16)}
          value={showForm.startsAt}
          onChange={e => setShowForm({ ...showForm, startsAt: e.target.value })}
        />
      </label>

      <div className="form-row">
        <label>
          Ticket price (₹)
          <input
            type="number"
            min="1"
            required
            value={showForm.price}
            onChange={e => setShowForm({ ...showForm, price: e.target.value })}
          />
        </label>
        <label>
          Total seats
          <input
            type="number"
            min="1"
            max="300"
            required
            value={showForm.totalSeats}
            onChange={e => setShowForm({ ...showForm, totalSeats: e.target.value })}
          />
        </label>
      </div>

      <button className="btn btn-primary full" disabled={busy || !movies.length || !theatres.length}>
        {busy ? 'Saving…' : 'Create showtime'}
      </button>

      {!movies.length && <p className="muted">Add a movie first to schedule a show.</p>}
      {!theatres.length && <p className="muted">Add a theatre first to schedule a show.</p>}
    </form>
  </div>)}
   </div></div>}
 </div>;
}
export default App;
