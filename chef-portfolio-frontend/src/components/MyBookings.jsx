import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../utils/authStorage';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatKes = (amount) => `KES ${Number(amount || 0).toLocaleString('en-KE')}`;

const paymentStatusLabel = (status) => ({
  pending: 'Awaiting M-Pesa confirmation',
  completed: 'Deposit received',
  failed: 'Payment failed',
  review: 'Payment needs support review'
}[status] || 'Not paid');

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [phoneByBooking, setPhoneByBooking] = useState({});
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const token = getToken();

  const refreshBookings = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load your bookings');
      setBookings(Array.isArray(data) ? data : []);
      setError('');
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load your bookings');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshBookings(true);
  }, [refreshBookings]);

  const hasPendingPayments = bookings.some((booking) => (
    booking.mpesaPayment?.payments?.some((payment) => payment.status === 'pending')
  ));

  useEffect(() => {
    if (!hasPendingPayments) return undefined;
    const intervalId = window.setInterval(() => refreshBookings(), 10000);
    return () => window.clearInterval(intervalId);
  }, [hasPendingPayments, refreshBookings]);

  const startPayment = async (booking) => {
    setPayingBookingId(booking.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/api/my-bookings/${booking.id}/payments/mpesa/stk-push`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneByBooking[booking.id] || '' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not start M-Pesa payment');
      setMessage(data.message || 'Payment request sent. Approve it on your phone.');
      await refreshBookings();
    } catch (paymentError) {
      setError(paymentError.message || 'Could not start M-Pesa payment');
      await refreshBookings();
    } finally {
      setPayingBookingId(null);
    }
  };

  return (
    <main className="customer-bookings-page">
      <header className="customer-bookings-header">
        <div>
          <p className="customer-bookings-eyebrow">Sorted Kitchen</p>
          <h1>Your bookings</h1>
          <p>Track your booking requests and pay the deposit for eligible approved bookings.</p>
        </div>
        <Link to="/" className="btn-secondary">Home</Link>
      </header>

      <section className="customer-bookings-content" aria-live="polite">
        {error && <p className="customer-bookings-alert error" role="alert">{error}</p>}
        {message && <p className="customer-bookings-alert success" role="status">{message}</p>}
        {loading ? (
          <p className="customer-bookings-empty">Loading your bookings…</p>
        ) : bookings.length === 0 ? (
          <div className="customer-bookings-empty">
            <h2>No bookings yet</h2>
            <p>Your booking requests will appear here after you submit one.</p>
            <Link to="/booking" className="btn-primary">Make a booking</Link>
          </div>
        ) : bookings.map((booking) => {
          const payments = booking.mpesaPayment?.payments || [];
          const latestPayment = payments[0];
          const canPay = booking.mpesaPayment?.eligible
            && !payments.some((payment) => ['pending', 'completed', 'review'].includes(payment.status));

          return (
            <article className="customer-booking-card" key={booking.id}>
              <div className="customer-booking-heading">
                <div>
                  <h2>{booking.occasion || 'Booking request'}</h2>
                  <p>
                    {booking.date ? new Date(`${booking.date}T00:00:00`).toLocaleDateString() : 'Date not set'}
                    {booking.time ? ` · ${booking.time}` : ''}
                  </p>
                </div>
                <span className={`customer-booking-status ${booking.status}`}>
                  {booking.status === 'approved' ? 'Approved' : 'Awaiting approval'}
                </span>
              </div>

              {booking.selectedPackage && (
                <div className="customer-booking-package">
                  <strong>{booking.selectedPackage.name}</strong>
                  <span>
                    {booking.selectedPackage.currency} {Number(booking.selectedPackage.totalPrice || 0).toLocaleString('en-KE')}
                    {' · '}{booking.selectedPackage.guestCount} guests
                  </span>
                </div>
              )}

              {booking.status === 'approved' && booking.mpesaPayment?.eligible && (
                <section className="customer-payment-panel" aria-label="M-Pesa deposit">
                  <div>
                    <h3>Booking deposit</h3>
                    <p>
                      {booking.mpesaPayment.percentage}% deposit · {formatKes(booking.mpesaPayment.amount)}
                    </p>
                  </div>
                  {latestPayment && (
                    <p className={`customer-payment-status ${latestPayment.status}`}>
                      {paymentStatusLabel(latestPayment.status)}
                      {latestPayment.mpesaReceiptNumber ? ` · Receipt ${latestPayment.mpesaReceiptNumber}` : ''}
                    </p>
                  )}
                  {canPay && (
                    <form
                      className="customer-payment-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        startPayment(booking);
                      }}
                    >
                      <label htmlFor={`mpesa-phone-${booking.id}`}>Safaricom phone number</label>
                      <input
                        id={`mpesa-phone-${booking.id}`}
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="0712345678"
                        value={phoneByBooking[booking.id] || ''}
                        onChange={(event) => setPhoneByBooking((current) => ({
                          ...current,
                          [booking.id]: event.target.value
                        }))}
                        required
                      />
                      <button type="submit" className="btn-primary" disabled={payingBookingId === booking.id}>
                        {payingBookingId === booking.id ? 'Sending request…' : `Pay ${formatKes(booking.mpesaPayment.amount)} with M-Pesa`}
                      </button>
                    </form>
                  )}
                  {latestPayment?.status === 'pending' && (
                    <p className="customer-payment-help">Complete the prompt on your phone. This page checks for an update automatically.</p>
                  )}
                  {latestPayment?.status === 'review' && (
                    <p className="customer-payment-help">Please contact Sorted Kitchen before making another payment.</p>
                  )}
                </section>
              )}

              {booking.quote && (
                <p className="customer-booking-quote">
                  Estimate: {booking.quote.currency} {Number(booking.quote.total || 0).toLocaleString('en-KE')}
                  {' · '}{booking.quote.items.length} item(s)
                </p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default MyBookings;
