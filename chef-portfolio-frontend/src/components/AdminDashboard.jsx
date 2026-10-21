import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

function AdminDashboard({ onLogout }) {
  const MEALS_PER_PAGE = 10;
  const BOOKINGS_PER_PAGE = 10;
  const CLIENTS_PER_PAGE = 10;
  const REVIEWS_PER_PAGE = 10;
  const MESSAGES_PER_PAGE = 10;
  const ACTIVITIES_PER_PAGE = 10;
  const [bookings, setBookings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [activityActionFilter, setActivityActionFilter] = useState('all');
  const [activityPage, setActivityPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingDateFrom, setBookingDateFrom] = useState('');
  const [bookingDateTo, setBookingDateTo] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientPage, setClientPage] = useState(0);
  const [expandedClientKey, setExpandedClientKey] = useState(null);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [messageStatusFilter, setMessageStatusFilter] = useState('all');
  const [messagePage, setMessagePage] = useState(0);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingPage, setBookingPage] = useState(0);
  const [sortOption, setSortOption] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [meals, setMeals] = useState([]);
  const [mealSearchTerm, setMealSearchTerm] = useState('');
  const [mealCategoryFilter, setMealCategoryFilter] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [reviewVisibilityFilter, setReviewVisibilityFilter] = useState('all');
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ author: '', role: '', text: '', rating: '5', published: true });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null);
  const [mealForm, setMealForm] = useState({ title: '', category: '', description: '', imageUrl: '', socialUrl: '' });
  const [editingMealId, setEditingMealId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [bioContent, setBioContent] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [bioStatus, setBioStatus] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [mealPage, setMealPage] = useState(0);
  const [authExpired, setAuthExpired] = useState(false);
  const [authToastVisible, setAuthToastVisible] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [expandedMealId, setExpandedMealId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMainSection, setActiveMainSection] = useState('bookings');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [approvingBookingId, setApprovingBookingId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [bookingForm, setBookingForm] = useState(null);
  const [savingBookingId, setSavingBookingId] = useState(null);
  const [bookingActionStatus, setBookingActionStatus] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('adminToken');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const navigate = useNavigate();
  const authTimersRef = useRef({ redirect: null, hide: null });
  const socialLaunchLockRef = useRef(0);

  const formatCategoryLabel = (category = '') => (
    String(category)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );

  const transformCloudinary = (url, width = 420) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    if (url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/f_auto,q_auto:eco,w_${width}/`);
    }
    return url;
  };

  const handleAuthExpired = () => {
    setAuthExpired(true);
    setAuthToastVisible(true);
    localStorage.removeItem('adminToken');
    if (authTimersRef.current.redirect) clearTimeout(authTimersRef.current.redirect);
    if (authTimersRef.current.hide) clearTimeout(authTimersRef.current.hide);
    authTimersRef.current.redirect = setTimeout(() => {
      navigate('/login');
    }, 2500);
    authTimersRef.current.hide = setTimeout(() => {
      setAuthToastVisible(false);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (authTimersRef.current.redirect) clearTimeout(authTimersRef.current.redirect);
      if (authTimersRef.current.hide) clearTimeout(authTimersRef.current.hide);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEsc);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    // Fetch Bookings
    fetch(`${apiUrl}/api/bookings`, { headers: authHeaders })
      .then(async res => {
        if (res.status === 401) {
          handleAuthExpired();
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
      })
      .then(data => {
        setBookings(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching bookings:', err);
        setBookings([]);
        setIsLoading(false);
      });

    // Fetch Activity Log
    fetch(`${apiUrl}/api/activity?limit=100`, { headers: authHeaders })
      .then(async res => {
        if (res.status === 401) {
          handleAuthExpired();
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to fetch activity');
        return res.json();
      })
      .then(data => setActivities(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Error fetching activity:', err);
        setActivities([]);
      });

    fetch(`${apiUrl}/api/admin/reviews`, { headers: authHeaders })
      .then(async (res) => {
        if (res.status === 401) {
          handleAuthExpired();
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return res.json();
      })
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error fetching reviews:', err);
        setReviews([]);
      });

    // Fetch Meals
    fetch(`${apiUrl}/api/meals`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch meals');
        return res.json();
      })
      .then(data => setMeals(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Error fetching meals:', err);
        setMeals([]);
      });

    // Fetch Bio
    fetch(`${apiUrl}/api/bio`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch bio');
        return res.json();
      })
      .then(data => setBioContent(data?.content || ''))
      .catch(err => {
        console.error('Error fetching bio:', err);
        setBioContent('');
      });
  }, []);

  const handleDeleteClick = (id) => {
    setBookingToDelete(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    try {
      const response = await fetch(`${apiUrl}/api/bookings/${bookingToDelete}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (response.ok) {
        setBookings(bookings.filter(b => b._id !== bookingToDelete));
        setShowModal(false);
        setBookingToDelete(null);
      } else {
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    if (!token || approvingBookingId) return;
    setApprovingBookingId(bookingId);
    setBookingActionStatus(null);

    try {
      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/approve`, {
        method: 'POST',
        headers: authHeaders
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBookingActionStatus({ type: 'error', message: data.error || 'Failed to approve booking.' });
        return;
      }

      if (data.booking) {
        setBookings((currentBookings) => (
          currentBookings.map((booking) => (booking._id === data.booking._id ? data.booking : booking))
        ));
      }
      setBookingActionStatus({ type: 'success', message: data.message || 'Booking approved and client notified.' });
    } catch {
      setBookingActionStatus({ type: 'error', message: 'Failed to approve booking.' });
    } finally {
      setApprovingBookingId(null);
    }
  };

  const handleBookingEdit = (booking) => {
    setEditingBookingId(booking._id);
    setBookingForm({
      name: booking.name || '',
      email: booking.email || '',
      phone: booking.phone || '',
      date: booking.date || '',
      time: booking.time || '',
      guests: booking.guests ?? '',
      occasion: booking.occasion || '',
      eventAddress: booking.eventAddress || '',
      eventDetails: booking.eventDetails || ''
    });
    setBookingActionStatus(null);
  };

  const handleBookingFormChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
  };

  const clearBookingFilters = () => {
    setSearchTerm('');
    setBookingDateFrom('');
    setBookingDateTo('');
    setBookingStatusFilter('all');
    setSortOption('newest');
    setBookingPage(0);
  };

  const handleBookingSave = async (event, bookingId) => {
    event.preventDefault();
    if (!token || !bookingForm) return;
    setSavingBookingId(bookingId);
    setBookingActionStatus(null);

    try {
      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          ...bookingForm,
          guests: bookingForm.guests === '' ? '' : Number(bookingForm.guests)
        })
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      const updatedBooking = await response.json().catch(() => null);
      if (!response.ok || !updatedBooking) {
        setBookingActionStatus({ type: 'error', message: 'Failed to update booking.' });
        return;
      }

      setBookings((currentBookings) => currentBookings.map((booking) => (
        booking._id === updatedBooking._id ? updatedBooking : booking
      )));
      setEditingBookingId(null);
      setBookingForm(null);
      setBookingActionStatus({ type: 'success', message: 'Booking updated.' });
    } catch {
      setBookingActionStatus({ type: 'error', message: 'Failed to update booking.' });
    } finally {
      setSavingBookingId(null);
    }
  };

  const handleExportBookings = () => {
    const columns = [
      ['Booking ID', (booking) => booking._id],
      ['Name', (booking) => booking.name],
      ['Email', (booking) => booking.email],
      ['Occasion', (booking) => booking.occasion],
      ['Date', (booking) => booking.date],
      ['Time', (booking) => booking.time],
      ['Guests', (booking) => booking.guests],
      ['Status', (booking) => booking.status || 'pending'],
      ['Created At', (booking) => booking.createdAt],
      ['Approved At', (booking) => booking.approvedAt]
    ];
    const escapeCell = (value) => {
      const text = String(value ?? '').replace(/[\r\n]+/g, ' ');
      const safeText = /^[\s]*[=+@\-\t]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const csv = [
      columns.map(([label]) => escapeCell(label)).join(','),
      ...filteredBookings.map((booking) => columns.map(([, getValue]) => escapeCell(getValue(booking))).join(','))
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const bookingDateRangeInvalid = Boolean(bookingDateFrom && bookingDateTo && bookingDateFrom > bookingDateTo);
  const filteredBookings = (bookingDateRangeInvalid ? [] : bookings).filter(booking => {
    const status = booking.status || 'pending';
    if (bookingStatusFilter !== 'all' && status !== bookingStatusFilter) return false;
    if (bookingDateFrom && (!/^\d{4}-\d{2}-\d{2}$/.test(booking.date || '') || booking.date < bookingDateFrom)) return false;
    if (bookingDateTo && (!/^\d{4}-\d{2}-\d{2}$/.test(booking.date || '') || booking.date > bookingDateTo)) return false;
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      [booking.name, booking.email, booking.phone, booking.occasion, booking.eventDetails]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }).sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    }
    if (sortOption === 'oldest') {
      return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
    }
    if (sortOption === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });
  const totalBookingPages = Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE));
  const pagedBookings = filteredBookings.slice(bookingPage * BOOKINGS_PER_PAGE, (bookingPage + 1) * BOOKINGS_PER_PAGE);
  const filteredReviews = reviews.filter((review) => {
    if (reviewVisibilityFilter === 'published' && !review.published) return false;
    if (reviewVisibilityFilter === 'hidden' && review.published) return false;
    const query = reviewSearchTerm.trim().toLowerCase();
    return !query || [review.author, review.role, review.text]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });
  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const pagedReviews = filteredReviews.slice(reviewPage * REVIEWS_PER_PAGE, (reviewPage + 1) * REVIEWS_PER_PAGE);

  const totalBookings = bookings.length;
  const activityActions = [...new Set(activities.map((item) => item.action || 'Other'))].sort();
  const filteredActivities = activities.filter((item) => {
    const query = activitySearchTerm.trim().toLowerCase();
    const action = item.action || 'Other';
    if (activityActionFilter !== 'all' && action !== activityActionFilter) return false;
    return !query || [item.actor, item.user, item.action, item.target, item.details]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });
  const totalActivityPages = Math.max(1, Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE));
  const pagedActivities = filteredActivities.slice(activityPage * ACTIVITIES_PER_PAGE, (activityPage + 1) * ACTIVITIES_PER_PAGE);
  const totalClients = new Set(bookings.map((booking) => booking.email || booking.name || booking._id)).size;
  const pendingInquiries = bookings.filter((booking) => (booking.status || 'pending') === 'pending').length;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const upcomingBookings = bookings
    .filter((booking) => /^\d{4}-\d{2}-\d{2}$/.test(booking.date || '') && booking.date >= todayKey)
    .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`));
  const messageBookings = bookings
    .filter((booking) => {
      const status = booking.status || 'pending';
      if (messageStatusFilter !== 'all' && status !== messageStatusFilter) return false;
      const query = messageSearchTerm.trim().toLowerCase();
      return !query || [booking.name, booking.email, booking.phone, booking.occasion, booking.eventDetails]
        .some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const statusOrder = (a.status || 'pending') === (b.status || 'pending') ? 0 : (a.status || 'pending') === 'pending' ? -1 : 1;
      return statusOrder || new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });
  const totalMessagePages = Math.max(1, Math.ceil(messageBookings.length / MESSAGES_PER_PAGE));
  const pagedMessageBookings = messageBookings.slice(messagePage * MESSAGES_PER_PAGE, (messagePage + 1) * MESSAGES_PER_PAGE);
  const clients = [...bookings.reduce((groups, booking) => {
    const email = String(booking.email || '').trim().toLowerCase();
    const name = String(booking.name || '').trim().toLowerCase();
    const key = email || (name ? `name:${name}` : `booking:${booking._id}`);
    const current = groups.get(key) || { key, name: booking.name || '', email: booking.email || '', bookings: [] };
    current.bookings.push(booking);
    if (!current.name && booking.name) current.name = booking.name;
    if (!current.email && booking.email) current.email = booking.email;
    groups.set(key, current);
    return groups;
  }, new Map()).values()]
    .map((client) => ({
      ...client,
      bookings: client.bookings.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    }))
    .filter((client) => {
      const query = clientSearchTerm.trim().toLowerCase();
      return !query || [client.name, client.email, ...client.bookings.map((booking) => booking.phone)]
        .some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const handleExportClients = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '').replace(/[\r\n]+/g, ' ');
      const safeText = /^[\s]*[=+@\-\t]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const columns = ['Name', 'Email', 'Phone', 'Booking Count', 'Event History'];
    const rows = clients.map((client) => {
      const phone = client.bookings.find((booking) => booking.phone)?.phone || '';
      const history = client.bookings
        .map((booking) => [booking.date, booking.time, booking.occasion, booking.status || 'pending'].filter(Boolean).join(' '))
        .join(' | ');
      return [client.name || 'Client', client.email, phone, client.bookings.length, history];
    });
    const csv = [columns, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const totalClientPages = Math.max(1, Math.ceil(clients.length / CLIENTS_PER_PAGE));
  const pagedClients = clients.slice(clientPage * CLIENTS_PER_PAGE, (clientPage + 1) * CLIENTS_PER_PAGE);
  const mealCategories = [...new Set(meals.map((meal) => String(meal.category || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const filteredMeals = meals.filter((meal) => {
    if (mealCategoryFilter !== 'all' && meal.category !== mealCategoryFilter) return false;
    const query = mealSearchTerm.trim().toLowerCase();
    return !query || [meal.title, meal.category, meal.description]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });
  const totalMealPages = Math.max(1, Math.ceil(filteredMeals.length / MEALS_PER_PAGE));
  const pagedMeals = filteredMeals.slice(mealPage * MEALS_PER_PAGE, (mealPage + 1) * MEALS_PER_PAGE);
  const expandedMeal = pagedMeals.find((meal) => meal._id === expandedMealId) || null;
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarMonthLabel = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const calendarCells = [
    ...Array(new Date(calendarYear, calendarMonthIndex, 1).getDay()).fill(null),
    ...Array.from({ length: new Date(calendarYear, calendarMonthIndex + 1, 0).getDate() }, (_, index) => index + 1)
  ];
  const selectedDayBookings = bookings
    .filter((booking) => booking.date === selectedCalendarDate)
    .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  const calendarMonthBookings = bookings
    .filter((booking) => /^\d{4}-\d{2}-\d{2}$/.test(booking.date || '')
      && booking.date.startsWith(`${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-`))
    .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`));

  const openBooking = (bookingId) => {
    const defaultSortedBookings = [...bookings].sort((a, b) => (
      new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    ));
    const bookingIndex = defaultSortedBookings.findIndex((booking) => booking._id === bookingId);
    setSearchTerm('');
    setBookingDateFrom('');
    setBookingDateTo('');
    setBookingStatusFilter('all');
    setSortOption('newest');
    setBookingPage(bookingIndex < 0 ? 0 : Math.floor(bookingIndex / BOOKINGS_PER_PAGE));
    setExpandedBookingId(bookingId);
    setActiveMainSection('bookings');
  };

  const formatCalendarDate = (year, month, day) => (
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  );

  const handleCalendarMonthChange = (event) => {
    const [year, month] = event.target.value.split('-').map(Number);
    if (!year || !month) return;
    const nextMonth = new Date(year, month - 1, 1);
    setCalendarMonth(nextMonth);
    setSelectedCalendarDate(formatCalendarDate(year, month - 1, 1));
  };

  const changeCalendarMonth = (offset) => {
    const nextMonth = new Date(calendarYear, calendarMonthIndex + offset, 1);
    setCalendarMonth(nextMonth);
    setSelectedCalendarDate(formatCalendarDate(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  };

  const showCurrentCalendarMonth = () => {
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(formatCalendarDate(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const handleExportCalendar = () => {
    const escapeIcalText = (value) => String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
    const formatDate = (value) => value.replace(/-/g, '');
    const events = calendarMonthBookings.map((booking) => {
      const lines = [
        'BEGIN:VEVENT',
        `UID:${escapeIcalText(booking._id || `${booking.date}-${booking.name || 'booking'}`)}@sortedkitchen`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        `SUMMARY:${escapeIcalText([booking.occasion || 'Booking', booking.name || 'Client'].join(' - '))}`
      ];
      const description = [
        `Client: ${booking.name || 'Client'}`,
        `Guests: ${booking.guests || 'Not specified'}`,
        `Status: ${booking.status || 'pending'}`,
        booking.phone ? `Phone: ${booking.phone}` : '',
        booking.email ? `Email: ${booking.email}` : '',
        booking.eventAddress ? `Address: ${booking.eventAddress}` : '',
        booking.eventDetails ? `Details: ${booking.eventDetails}` : ''
      ].filter(Boolean).join('\n');
      lines.push(`DESCRIPTION:${escapeIcalText(description)}`);

      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(booking.time || '')) {
        const start = new Date(`${booking.date}T${booking.time}:00`);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        const formatLocalDateTime = (date) => (
          `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}00`
        );
        lines.push(`DTSTART:${formatLocalDateTime(start)}`, `DTEND:${formatLocalDateTime(end)}`);
      } else {
        const nextDay = new Date(`${booking.date}T00:00:00`);
        nextDay.setDate(nextDay.getDate() + 1);
        lines.push(
          `DTSTART;VALUE=DATE:${formatDate(booking.date)}`,
          `DTEND;VALUE=DATE:${formatDate(formatCalendarDate(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate()))}`
        );
      }
      lines.push('END:VEVENT');
      return lines.join('\r\n');
    });
    const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sorted Kitchen//Booking Calendar//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorted-kitchen-${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const openOverviewSection = (section) => {
    if (section === 'upcoming') {
      const nextBooking = upcomingBookings[0];
      if (nextBooking) {
        const [year, month] = nextBooking.date.split('-').map(Number);
        setCalendarMonth(new Date(year, month - 1, 1));
        setSelectedCalendarDate(nextBooking.date);
      } else {
        showCurrentCalendarMonth();
      }
      setActiveMainSection('calendar');
      return;
    }
    if (section === 'pending') {
      setMessageStatusFilter('pending');
      setMessageSearchTerm('');
      setMessagePage(0);
      setActiveMainSection('messages');
      return;
    }
    if (section === 'bookings') {
      openBooking(null);
      return;
    }
    setActiveMainSection(section);
  };

  const handleSidebarNavigation = (section) => {
    if (section === 'bookings') {
      setSearchTerm('');
      setBookingDateFrom('');
      setBookingDateTo('');
      setBookingStatusFilter('all');
      setBookingPage(0);
    }
    if (section === 'clients') setClientPage(0);
    setActiveMainSection(section);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (bookingPage > totalBookingPages - 1) {
      setBookingPage(Math.max(0, totalBookingPages - 1));
    }
  }, [bookingPage, totalBookingPages]);

  useEffect(() => {
    if (clientPage > totalClientPages - 1) {
      setClientPage(Math.max(0, totalClientPages - 1));
    }
  }, [clientPage, totalClientPages]);

  useEffect(() => {
    if (reviewPage > totalReviewPages - 1) {
      setReviewPage(Math.max(0, totalReviewPages - 1));
    }
  }, [reviewPage, totalReviewPages]);

  useEffect(() => {
    if (messagePage > totalMessagePages - 1) {
      setMessagePage(Math.max(0, totalMessagePages - 1));
    }
  }, [messagePage, totalMessagePages]);

  useEffect(() => {
    if (activityPage > totalActivityPages - 1) {
      setActivityPage(Math.max(0, totalActivityPages - 1));
    }
  }, [activityPage, totalActivityPages]);

  useEffect(() => {
    if (mealPage > totalMealPages - 1) {
      setMealPage(Math.max(0, totalMealPages - 1));
    }
  }, [mealPage, totalMealPages]);

  useEffect(() => {
    if (expandedMealId && !pagedMeals.some((meal) => meal._id === expandedMealId)) {
      setExpandedMealId(null);
    }
  }, [expandedMealId, pagedMeals]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setExpandedMealId(null);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleBooking = (bookingId) => {
    setExpandedBookingId(prev => (prev === bookingId ? null : bookingId));
  };

  const handleMealTileClick = (mealId) => {
    if (typeof window !== 'undefined' && window.innerWidth > 900) return;
    setExpandedMealId((prev) => (prev === mealId ? null : mealId));
  };

  const handleMealChange = (e) => {
    const { name, value } = e.target;
    setMealForm(prev => ({ ...prev, [name]: value }));
  };

  const launchSocialApp = (appUrl, webUrl) => {
    const appWindow = window.open(appUrl, '_blank');
    if (!appWindow) {
      window.open(webUrl, '_blank');
      return;
    }

    setTimeout(() => {
      try {
        if (!appWindow.closed) {
          appWindow.location.replace(webUrl);
        }
      } catch {
        // Ignore cross-origin access issues and keep best-effort app launch.
      }
    }, 650);
  };

  const handleOpenSocialApp = () => {
    const now = Date.now();
    if (now - socialLaunchLockRef.current < 900) return;
    socialLaunchLockRef.current = now;

    const normalizedUrl = mealForm.socialUrl.trim().toLowerCase();
    if (normalizedUrl.includes('instagram.com')) {
      launchSocialApp('instagram://app', 'https://www.instagram.com/');
      return;
    }

    if (normalizedUrl.includes('tiktok.com')) {
      launchSocialApp('tiktok://', 'https://www.tiktok.com/');
      return;
    }

    launchSocialApp('tiktok://', 'https://www.tiktok.com/');
  };

  const handlePasteSocialUrl = async () => {
    if (!navigator.clipboard?.readText) {
      alert('Clipboard paste is not supported in this browser. Use Ctrl+V or Cmd+V.');
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      const pastedUrl = clipboardText.trim();
      if (!pastedUrl) {
        alert('Clipboard is empty.');
        return;
      }
      setMealForm((prev) => ({ ...prev, socialUrl: pastedUrl }));
    } catch (err) {
      console.error('Clipboard read failed:', err);
      alert('Could not read clipboard. Please paste manually with Ctrl+V or Cmd+V.');
    }
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    const normalizedMealForm = {
      title: mealForm.title.trim(),
      category: mealForm.category.trim(),
      description: mealForm.description.trim(),
      imageUrl: mealForm.imageUrl.trim(),
      socialUrl: mealForm.socialUrl.trim()
    };
    const hasSocialUrl = normalizedMealForm.socialUrl.length > 0;
    if (!hasSocialUrl && !normalizedMealForm.title) {
      alert('Please add a title when no social URL is provided.');
      return;
    }
    const payload = {
      ...normalizedMealForm,
      price: 0
    };
    try {
      const response = await fetch(
        `${apiUrl}/api/meals${editingMealId ? `/${editingMealId}` : ''}`,
        {
          method: editingMealId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        }
      );
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      if (!response.ok) {
        alert('Failed to save meal');
        return;
      }
      const saved = await response.json();
      if (editingMealId) {
        setMeals(meals.map(m => (m._id === saved._id ? saved : m)));
      } else {
        setMeals([saved, ...meals]);
      }
      setMealForm({ title: '', category: '', description: '', imageUrl: '', socialUrl: '' });
      setEditingMealId(null);
    } catch (err) {
      console.error('Error saving meal:', err);
    }
  };

  const handleMealEdit = (meal) => {
    setEditingMealId(meal._id);
    setMealForm({
      title: meal.title || '',
      category: meal.category || '',
      description: meal.description || '',
      imageUrl: meal.imageUrl || '',
      socialUrl: meal.socialUrl || ''
    });
  };

  const handleMealDelete = async (mealId) => {
    if (!token) return;
    const confirmed = window.confirm('Delete this meal and its image entry?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${apiUrl}/api/meals/${mealId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      if (response.ok) {
        setMeals(meals.filter(m => m._id !== mealId));
        setExpandedMealId(prev => (prev === mealId ? null : prev));
      }
    } catch (err) {
      console.error('Error deleting meal:', err);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      if (!response.ok) {
        alert('Image upload failed');
        return;
      }
      const data = await response.json();
      setMealForm(prev => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleBioSave = async (e) => {
    e.preventDefault();
    if (!token) return;
    setBioSaving(true);
    setBioStatus(null);
    try {
      const response = await fetch(`${apiUrl}/api/bio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ content: bioContent })
      });
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      if (!response.ok) {
        setBioStatus({ type: 'error', message: 'Failed to save chef bio.' });
        return;
      }
      setBioStatus({ type: 'success', message: 'Chef bio saved.' });
    } catch (err) {
      console.error('Error saving bio:', err);
      setBioStatus({ type: 'error', message: 'Could not connect to save the chef bio.' });
    } finally {
      setBioSaving(false);
    }
  };

  const resetReviewForm = () => {
    setReviewForm({ author: '', role: '', text: '', rating: '5', published: true });
    setEditingReviewId(null);
  };

  const handleReviewSave = async (event) => {
    event.preventDefault();
    if (!token) return;
    setReviewSaving(true);
    setReviewStatus(null);
    try {
      const response = await fetch(`${apiUrl}/api/reviews${editingReviewId ? `/${editingReviewId}` : ''}`, {
        method: editingReviewId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...reviewForm, rating: Number(reviewForm.rating) })
      });
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      const savedReview = await response.json().catch(() => null);
      if (!response.ok || !savedReview) {
        setReviewStatus({ type: 'error', message: savedReview?.error || 'Failed to save review.' });
        return;
      }
      setReviews((current) => editingReviewId
        ? current.map((review) => review._id === savedReview._id ? savedReview : review)
        : [savedReview, ...current]);
      resetReviewForm();
      setReviewStatus({ type: 'success', message: 'Review saved.' });
    } catch {
      setReviewStatus({ type: 'error', message: 'Failed to save review.' });
    } finally {
      setReviewSaving(false);
    }
  };

  const handleReviewEdit = (review) => {
    setEditingReviewId(review._id);
    setReviewForm({
      author: review.author || '',
      role: review.role || '',
      text: review.text || '',
      rating: String(review.rating || 5),
      published: review.published === true
    });
    setReviewStatus(null);
  };

  const handleReviewDelete = async (reviewId) => {
    if (!token || !window.confirm('Delete this review?')) return;
    try {
      const response = await fetch(`${apiUrl}/api/reviews/${reviewId}`, { method: 'DELETE', headers: authHeaders });
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      if (!response.ok) {
        setReviewStatus({ type: 'error', message: 'Failed to delete review.' });
        return;
      }
      setReviews((current) => current.filter((review) => review._id !== reviewId));
      if (editingReviewId === reviewId) resetReviewForm();
      setReviewStatus({ type: 'success', message: 'Review deleted.' });
    } catch {
      setReviewStatus({ type: 'error', message: 'Failed to delete review.' });
    }
  };

  const handleReviewPublishToggle = async (review) => {
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/api/reviews/${review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...review, rating: Number(review.rating || 5), published: !review.published })
      });
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      const updated = await response.json().catch(() => null);
      if (!response.ok || !updated) {
        setReviewStatus({ type: 'error', message: updated?.error || 'Failed to update publish status.' });
        return;
      }
      setReviews((current) => current.map((item) => item._id === updated._id ? updated : item));
      setReviewStatus({ type: 'success', message: updated.published ? 'Review published.' : 'Review hidden from the website.' });
    } catch {
      setReviewStatus({ type: 'error', message: 'Failed to update publish status.' });
    }
  };

  const handleAuthCheck = async () => {
    if (!token) {
      setAuthStatus({ type: 'error', message: 'No token found. Please log in again.' });
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/activity`, { headers: authHeaders });
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      if (!response.ok) {
        setAuthStatus({ type: 'error', message: 'Auth check failed.' });
        return;
      }
      setAuthStatus({ type: 'success', message: 'Auth check passed.' });
    } catch {
      setAuthStatus({ type: 'error', message: 'Auth check failed.' });
    }
  };

  const handleUploadTest = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setUploadStatus({ type: 'info', message: 'Uploading...' });
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
      if (response.status === 401) {
        handleAuthExpired();
        return;
      }
      if (!response.ok) {
        setUploadStatus({ type: 'error', message: 'Upload failed.' });
        return;
      }
      const data = await response.json();
      setUploadStatus({ type: 'success', message: 'Upload successful.', url: data.url });
    } catch {
      setUploadStatus({ type: 'error', message: 'Upload failed.' });
    }
  };

  const handleRefreshDashboard = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshStatus(null);
    try {
      const endpoints = [
        `${apiUrl}/api/bookings`,
        `${apiUrl}/api/activity?limit=100`,
        `${apiUrl}/api/admin/reviews`,
        `${apiUrl}/api/meals`
      ];
      const responses = await Promise.all(endpoints.map((endpoint, index) => fetch(endpoint, {
        headers: index < 3 ? authHeaders : {}
      })));
      if (responses.some((response) => response.status === 401)) {
        handleAuthExpired();
        throw new Error('Session expired. Please log in again.');
      }
      if (responses.some((response) => !response.ok)) {
        throw new Error('Some dashboard data could not be refreshed.');
      }
      const [nextBookings, nextActivities, nextReviews, nextMeals] = await Promise.all(
        responses.map((response) => response.json())
      );
      setBookings(Array.isArray(nextBookings) ? nextBookings : []);
      setActivities(Array.isArray(nextActivities) ? nextActivities : []);
      setReviews(Array.isArray(nextReviews) ? nextReviews : []);
      setMeals(Array.isArray(nextMeals) ? nextMeals : []);
      setLastRefreshedAt(new Date());
      setRefreshStatus({ type: 'success', message: 'Dashboard data refreshed.' });
    } catch (error) {
      setRefreshStatus({ type: 'error', message: error.message || 'Could not refresh dashboard data.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <div className="showcase-brand">
            <span className="showcase-brand-logo-wrap">
              <img src="/images/brand-logo-256.png" alt="Sorted Kitchen" className="showcase-brand-logo" />
            </span>
            <h4>SORTED KITCHEN</h4>
          </div>
        </div>
        <button
          type="button"
          className={`admin-sidebar-toggle ${sidebarOpen ? 'active' : ''}`}
          aria-label="Toggle sidebar"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((prev) => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
       
      </header>
      <button
        type="button"
        className={`admin-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="admin-layout">
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="admin-sidebar-brand">
            <span className="admin-badge">Dashboard</span>
            <p>Bookings, meals, clients, and settings.</p>
          </div>
          <nav className="admin-nav">
            <a href="#overview" className="admin-nav-link" onClick={() => handleSidebarNavigation('bookings')}>
              <span className="admin-nav-icon">D</span>
              <span className="admin-nav-label">Dashboard</span>
            </a>
            <a href="#bookings" className="admin-nav-link" onClick={() => handleSidebarNavigation('bookings')}>
              <span className="admin-nav-icon">B</span>
              <span className="admin-nav-label">Bookings</span>
            </a>
            <a href="#clients" className="admin-nav-link" onClick={() => { setActiveMainSection('clients'); setSidebarOpen(false); }}>
              <span className="admin-nav-icon">C</span>
              <span className="admin-nav-label">Clients</span>
            </a>
            <a href="#meals" className="admin-nav-link" onClick={() => handleSidebarNavigation('meals')}>
              <span className="admin-nav-icon">M</span>
              <span className="admin-nav-label">Menus and Recipes</span>
            </a>
            <a href="#calendar" className="admin-nav-link" onClick={() => { setActiveMainSection('calendar'); setSidebarOpen(false); }}>
              <span className="admin-nav-icon">K</span>
              <span className="admin-nav-label">Calendar</span>
            </a>
            <a href="#messages" className="admin-nav-link" onClick={() => { setActiveMainSection('messages'); setSidebarOpen(false); }}>
              <span className="admin-nav-icon">X</span>
              <span className="admin-nav-label">Messages</span>
            </a>
            <a href="#reviews" className="admin-nav-link" onClick={() => { setActiveMainSection('reviews'); setSidebarOpen(false); }}>
              <span className="admin-nav-icon">R</span>
              <span className="admin-nav-label">Reviews</span>
            </a>
            <a href="#settings" className="admin-nav-link" onClick={() => { setActiveMainSection('settings'); setSidebarOpen(false); }}>
              <span className="admin-nav-icon">S</span>
              <span className="admin-nav-label">Settings</span>
            </a>
          </nav>
          <div className="admin-sidebar-actions">
            <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }} onClick={() => setSidebarOpen(false)}>Home</Link>
            <button onClick={() => { setSidebarOpen(false); onLogout(); }} className="btn-primary">Logout</button>
          </div>
          
        </aside>

        <main className="admin-main">
          {authExpired && authToastVisible && (
            <div className="auth-toast" role="status" aria-live="polite">
              <span>Your session expired. Redirecting to login...</span>
              <button
                type="button"
                className="auth-toast-close"
                aria-label="Dismiss notification"
                onClick={() => setAuthToastVisible(false)}
              >
                x
              </button>
              <button
                type="button"
                className="auth-toast-btn"
                onClick={() => navigate('/login')}
              >
                Login now
              </button>
            </div>
          )}
          <div className="admin-overview-toolbar">
            <div className="admin-refresh-feedback" aria-live="polite">
              {refreshStatus ? <span className={refreshStatus.type}>{refreshStatus.message}</span> : lastRefreshedAt ? `Updated ${lastRefreshedAt.toLocaleTimeString()}` : null}
            </div>
            <button type="button" className="admin-refresh-button" onClick={handleRefreshDashboard} disabled={isRefreshing}>
              <RefreshCw size={16} aria-hidden="true" className={isRefreshing ? 'spinning' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh data'}</span>
            </button>
          </div>
          <div className="stats-container" id="overview">
            <button type="button" className="stat-card" onClick={() => openOverviewSection('bookings')}>
              <h5>All Bookings</h5>
              <p>{totalBookings}</p>
              <span className="stat-link">View all</span>
            </button>
            <button type="button" className="stat-card" onClick={() => openOverviewSection('upcoming')}>
              <h5>Upcoming Events</h5>
              <p>{upcomingBookings.length}</p>
              <span className="stat-link">View calendar</span>
            </button>
            <button type="button" className="stat-card" onClick={() => openOverviewSection('clients')}>
              <h5>Total Clients</h5>
              <p>{totalClients}</p>
              <span className="stat-link">View all</span>
            </button>
            <button type="button" className="stat-card" onClick={() => openOverviewSection('pending')}>
              <h5>Pending Inquiries</h5>
              <p>{pendingInquiries}</p>
              <span className="stat-link">Review pending</span>
            </button>
          </div>

          <div className="admin-workspace">
            <div className="admin-column admin-column-main">
              <div className="admin-main-section-tabs" role="tablist" aria-label="Admin main sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'bookings'}
                  className={`admin-main-tab ${activeMainSection === 'bookings' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('bookings')}
                >
                  Booking Overview
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'activity'}
                  className={`admin-main-tab ${activeMainSection === 'activity' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('activity')}
                >
                  Recent Activity
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'status'}
                  className={`admin-main-tab ${activeMainSection === 'status' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('status')}
                >
                  Admin Status
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'reviews'}
                  className={`admin-main-tab ${activeMainSection === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('reviews')}
                >
                  Reviews
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'messages'}
                  className={`admin-main-tab ${activeMainSection === 'messages' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('messages')}
                >
                  Messages
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'clients'}
                  className={`admin-main-tab ${activeMainSection === 'clients' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('clients')}
                >
                  Clients
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'calendar'}
                  className={`admin-main-tab ${activeMainSection === 'calendar' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('calendar')}
                >
                  Calendar
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'settings'}
                  className={`admin-main-tab ${activeMainSection === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('settings')}
                >
                  Settings
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMainSection === 'meals'}
                  className={`admin-main-tab ${activeMainSection === 'meals' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('meals')}
                >
                  Meals
                </button>
              </div>

              {activeMainSection === 'reviews' && (
                <section className="review-manager panel" id="reviews">
                  <div className="panel-head">
                    <h5>Guest Reviews</h5>
                    <span>{reviews.filter((review) => review.published).length} published · {reviews.length} total</span>
                  </div>
                  <div className="review-manager-filters">
                    <input
                      type="search"
                      className="search-input"
                      placeholder="Search guest or review text..."
                      aria-label="Search reviews"
                      value={reviewSearchTerm}
                      onChange={(event) => { setReviewSearchTerm(event.target.value); setReviewPage(0); }}
                    />
                    <select
                      className="sort-select"
                      aria-label="Filter reviews by visibility"
                      value={reviewVisibilityFilter}
                      onChange={(event) => { setReviewVisibilityFilter(event.target.value); setReviewPage(0); }}
                    >
                      <option value="all">All reviews</option>
                      <option value="published">Published</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <form className="review-editor admin-form" onSubmit={handleReviewSave}>
                    <label>
                      Guest name
                      <input
                        value={reviewForm.author}
                        onChange={(event) => setReviewForm((current) => ({ ...current, author: event.target.value }))}
                        maxLength="120"
                        required
                      />
                    </label>
                    <label>
                      Role or attribution
                      <input
                        value={reviewForm.role}
                        onChange={(event) => setReviewForm((current) => ({ ...current, role: event.target.value }))}
                        maxLength="120"
                        placeholder="Optional"
                      />
                    </label>
                    <label>
                      Rating
                      <select
                        value={reviewForm.rating}
                        onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}
                      >
                        {[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} star{rating === 1 ? '' : 's'}</option>)}
                      </select>
                    </label>
                    <label className="review-editor-text">
                      Review
                      <textarea
                        value={reviewForm.text}
                        onChange={(event) => setReviewForm((current) => ({ ...current, text: event.target.value }))}
                        maxLength="2000"
                        rows="4"
                        required
                      />
                    </label>
                    <label className="review-publish-control">
                      <input
                        type="checkbox"
                        checked={reviewForm.published}
                        onChange={(event) => setReviewForm((current) => ({ ...current, published: event.target.checked }))}
                      />
                      Published on website
                    </label>
                    <div className="review-editor-actions">
                      <button className="btn-secondary" type="submit" disabled={reviewSaving}>
                        {reviewSaving ? 'Saving...' : editingReviewId ? 'Save review' : 'Add review'}
                      </button>
                      {editingReviewId && (
                        <button className="btn-secondary" type="button" onClick={resetReviewForm} disabled={reviewSaving}>
                          Cancel edit
                        </button>
                      )}
                    </div>
                  </form>
                  {reviewStatus && <p className={`helper-text ${reviewStatus.type}`} role="status">{reviewStatus.message}</p>}
                  {filteredReviews.length === 0 ? (
                    <p className="helper-text">{reviews.length ? 'No reviews match these filters.' : 'No reviews have been added yet.'}</p>
                  ) : (
                    <div className="review-manager-list">
                      {pagedReviews.map((review) => (
                        <article className="review-manager-item" key={review._id}>
                          <div className="review-manager-copy">
                            <div className="review-manager-heading">
                              <strong>{review.author}</strong>
                              <span className="review-rating" aria-label={`${review.rating} out of 5 stars`}>
                                {'★'.repeat(Number(review.rating || 0))}{'☆'.repeat(5 - Number(review.rating || 0))}
                              </span>
                              <span className={`review-visibility ${review.published ? 'published' : 'hidden'}`}>
                                {review.published ? 'Published' : 'Hidden'}
                              </span>
                            </div>
                            {review.role && <span className="review-manager-role">{review.role}</span>}
                            <p>{review.text}</p>
                          </div>
                          <div className="review-manager-actions">
                            <button type="button" className="btn-secondary" onClick={() => handleReviewPublishToggle(review)}>
                              {review.published ? 'Hide' : 'Publish'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => handleReviewEdit(review)}>Edit</button>
                            <button type="button" className="btn-danger" onClick={() => handleReviewDelete(review._id)}>Delete</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {filteredReviews.length > REVIEWS_PER_PAGE && (
                    <div className="booking-pagination" aria-label="Review list pagination">
                      <button
                        type="button"
                        className="booking-page-button"
                        onClick={() => setReviewPage((page) => Math.max(0, page - 1))}
                        disabled={reviewPage === 0}
                        aria-label="Previous review page"
                      >
                        <ChevronLeft size={17} aria-hidden="true" />
                      </button>
                      <span>Page {reviewPage + 1} of {totalReviewPages} · {filteredReviews.length} reviews</span>
                      <button
                        type="button"
                        className="booking-page-button"
                        onClick={() => setReviewPage((page) => Math.min(totalReviewPages - 1, page + 1))}
                        disabled={reviewPage >= totalReviewPages - 1}
                        aria-label="Next review page"
                      >
                        <ChevronRight size={17} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </section>
              )}

              {activeMainSection === 'clients' && (
                <section className="client-directory panel" id="clients">
                  <div className="panel-head">
                    <h5>Client Directory</h5>
                    <span>{clients.length} client{clients.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="client-directory-toolbar">
                    <input
                      type="search"
                      className="search-input"
                      placeholder="Search name, email, or phone..."
                      aria-label="Search clients"
                      value={clientSearchTerm}
                      onChange={(event) => { setClientSearchTerm(event.target.value); setClientPage(0); }}
                    />
                    <button
                      type="button"
                      className="btn-secondary client-export-button"
                      onClick={handleExportClients}
                      disabled={clients.length === 0}
                    >
                      Export CSV ({clients.length})
                    </button>
                  </div>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : clients.length === 0 ? (
                    <p className="helper-text">No clients match this search.</p>
                  ) : (
                    <div className="client-directory-list">
                      {pagedClients.map((client) => {
                        const isExpanded = expandedClientKey === client.key;
                        const latestBooking = client.bookings[0];
                        return (
                          <article className={`client-record ${isExpanded ? 'expanded' : ''}`} key={client.key}>
                            <button
                              type="button"
                              className="client-record-summary"
                              aria-expanded={isExpanded}
                              onClick={() => setExpandedClientKey(isExpanded ? null : client.key)}
                            >
                              <span className="client-record-identity">
                                <strong>{client.name || 'Client'}</strong>
                                <span>{client.email || latestBooking.phone || 'No contact details'}</span>
                              </span>
                              <span className="client-record-last-booking">
                                <span>Latest event</span>
                                <strong>{latestBooking.date || 'Date not set'}</strong>
                              </span>
                              <span className="client-booking-count">{client.bookings.length} booking{client.bookings.length === 1 ? '' : 's'}</span>
                              <span className={`booking-chevron ${isExpanded ? 'open' : ''}`} aria-hidden="true">
                                <span className="booking-chevron-icon"></span>
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="client-booking-history">
                                {client.bookings.map((booking) => (
                                  <button
                                    type="button"
                                    className="client-history-event"
                                    key={booking._id}
                                    onClick={() => openBooking(booking._id)}
                                  >
                                    <span>{booking.date || 'Date not set'} · {booking.time || 'Time not set'}</span>
                                    <span>{booking.occasion || 'Event'} · {booking.guests || '?'} guests</span>
                                    <span className={`booking-status-pill ${(booking.status || 'pending').toLowerCase()}`}>
                                      {booking.status === 'approved' ? 'Approved' : 'Pending'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                  {!isLoading && clients.length > CLIENTS_PER_PAGE && (
                    <div className="booking-pagination" aria-label="Client directory pagination">
                      <button
                        type="button"
                        className="booking-page-button"
                        onClick={() => setClientPage((page) => Math.max(0, page - 1))}
                        disabled={clientPage === 0}
                        aria-label="Previous client page"
                      >
                        <ChevronLeft size={17} aria-hidden="true" />
                      </button>
                      <span>Page {clientPage + 1} of {totalClientPages} · {clients.length} clients</span>
                      <button
                        type="button"
                        className="booking-page-button"
                        onClick={() => setClientPage((page) => Math.min(totalClientPages - 1, page + 1))}
                        disabled={clientPage >= totalClientPages - 1}
                        aria-label="Next client page"
                      >
                        <ChevronRight size={17} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </section>
              )}

              {activeMainSection === 'calendar' && (
                <section className="admin-calendar panel" id="calendar">
                  <div className="panel-head">
                    <h5>Booking Calendar</h5>
                    <div className="calendar-controls">
                      <button type="button" className="calendar-icon-button" aria-label="Previous month" onClick={() => changeCalendarMonth(-1)}>
                        <ChevronLeft size={18} aria-hidden="true" />
                      </button>
                      <strong aria-live="polite">{calendarMonthLabel}</strong>
                      <button type="button" className="calendar-icon-button" aria-label="Next month" onClick={() => changeCalendarMonth(1)}>
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                      <input
                        type="month"
                        className="calendar-month-picker"
                        aria-label="Choose calendar month"
                        value={`${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}`}
                        onChange={handleCalendarMonthChange}
                      />
                      <button type="button" className="btn-secondary" onClick={showCurrentCalendarMonth}>Today</button>
                      <button
                        type="button"
                        className="btn-secondary calendar-export-button"
                        onClick={handleExportCalendar}
                        disabled={calendarMonthBookings.length === 0}
                      >
                        Export .ics ({calendarMonthBookings.length})
                      </button>
                    </div>
                  </div>
                  <div className="calendar-weekdays" aria-hidden="true">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
                  </div>
                  <div className="calendar-grid" role="grid" aria-label={calendarMonthLabel}>
                    {calendarCells.map((day, index) => {
                      if (!day) return <span className="calendar-empty-day" key={`empty-${index}`} aria-hidden="true" />;
                      const dateKey = formatCalendarDate(calendarYear, calendarMonthIndex, day);
                      const dayBookings = bookings.filter((booking) => booking.date === dateKey);
                      const isToday = dateKey === formatCalendarDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                      return (
                        <button
                          type="button"
                          role="gridcell"
                          key={dateKey}
                          className={`calendar-day ${dateKey === selectedCalendarDate ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayBookings.length ? 'has-bookings' : ''}`}
                          aria-label={`${calendarMonthLabel} ${day}${dayBookings.length ? `, ${dayBookings.length} booking${dayBookings.length === 1 ? '' : 's'}` : ''}`}
                          aria-pressed={dateKey === selectedCalendarDate}
                          onClick={() => setSelectedCalendarDate(dateKey)}
                        >
                          <span>{day}</span>
                          {dayBookings.length > 0 && <span className="calendar-booking-count">{dayBookings.length}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="calendar-day-events">
                    <div className="panel-head">
                      <h5>{new Date(`${selectedCalendarDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h5>
                      <span>{selectedDayBookings.length} booking{selectedDayBookings.length === 1 ? '' : 's'}</span>
                    </div>
                    {selectedDayBookings.length === 0 ? (
                      <p className="helper-text">No bookings for this date.</p>
                    ) : selectedDayBookings.map((booking) => (
                      <button
                        type="button"
                        className="calendar-event"
                        key={booking._id}
                        onClick={() => openBooking(booking._id)}
                      >
                        <span className="calendar-event-time">{booking.time || 'Time not set'}</span>
                        <span className="calendar-event-name">{booking.name || 'Client'} · {booking.guests || '?'} guests</span>
                        <span className={`booking-status-pill ${(booking.status || 'pending').toLowerCase()}`}>
                          {booking.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeMainSection === 'bookings' && (
              <section className="booking-list panel" id="bookings">
                <div className="panel-head">
                  <h5>Booking Overview</h5>
                  <button type="button" className="panel-more" aria-label="More options">...</button>
                </div>
                {bookingActionStatus && (
                  <p className={`helper-text ${bookingActionStatus.type}`}>{bookingActionStatus.message}</p>
                )}
                <div className="booking-filters">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setBookingPage(0); }}
                    className="search-input"
                  />
                  <input
                    type="date"
                    className="sort-select"
                    aria-label="Bookings from date (inclusive)"
                    value={bookingDateFrom}
                    max={bookingDateTo || undefined}
                    onChange={(event) => { setBookingDateFrom(event.target.value); setBookingPage(0); }}
                  />
                  <input
                    type="date"
                    className="sort-select"
                    aria-label="Bookings through date (inclusive)"
                    value={bookingDateTo}
                    min={bookingDateFrom || undefined}
                    onChange={(event) => { setBookingDateTo(event.target.value); setBookingPage(0); }}
                  />
                  <select
                    aria-label="Filter bookings by status"
                    value={bookingStatusFilter}
                    onChange={(e) => { setBookingStatusFilter(e.target.value); setBookingPage(0); }}
                    className="sort-select"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                  <select
                    value={sortOption}
                    onChange={(e) => { setSortOption(e.target.value); setBookingPage(0); }}
                    className="sort-select"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleExportBookings}
                    disabled={filteredBookings.length === 0}
                  >
                    Export CSV ({filteredBookings.length})
                  </button>
                  <button type="button" className="btn-secondary" onClick={clearBookingFilters}>
                    Clear filters
                  </button>
                </div>

                {bookingDateRangeInvalid && (
                  <p className="helper-text error" role="alert">The end date must be on or after the start date.</p>
                )}

                {isLoading ? (
                  <LoadingSpinner />
                ) : filteredBookings.length === 0 ? (
                  <p style={{ textAlign: 'center' }}>No bookings found.</p>
                ) : (
                  pagedBookings.map(booking => {
                    const isOpen = expandedBookingId === booking._id;
                    return (
                      <div key={booking._id} className={`booking-card ${isOpen ? 'open' : ''}`}>
                        <button
                          type="button"
                          className="booking-summary"
                          onClick={() => toggleBooking(booking._id)}
                          aria-expanded={isOpen}
                        >
                          <div className="booking-main">
                            <span className="booking-name">{booking.name}</span>
                            <span className="booking-meta">
                              {booking.date} - {booking.time} - {booking.guests} guests
                            </span>
                          </div>
                          <span className={`booking-status-pill ${(booking.status || 'pending').toLowerCase()}`}>
                            {booking.status === 'approved' ? 'Approved' : 'Pending'}
                          </span>
                          <span className={`booking-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">
                            <span className="booking-chevron-icon"></span>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="booking-details">
                            {editingBookingId === booking._id && bookingForm ? (
                              <form className="admin-form" onSubmit={(event) => handleBookingSave(event, booking._id)}>
                                <label>
                                  Name
                                  <input name="name" value={bookingForm.name} onChange={handleBookingFormChange} required />
                                </label>
                                <label>
                                  Email
                                  <input name="email" type="email" value={bookingForm.email} onChange={handleBookingFormChange} required />
                                </label>
                                <label>
                                  Phone
                                  <input name="phone" type="tel" value={bookingForm.phone} onChange={handleBookingFormChange} />
                                </label>
                                <label>
                                  Event date
                                  <input name="date" type="date" value={bookingForm.date} onChange={handleBookingFormChange} required />
                                </label>
                                <label>
                                  Event time
                                  <input name="time" type="time" value={bookingForm.time} onChange={handleBookingFormChange} required />
                                </label>
                                <label>
                                  Guests
                                  <input name="guests" type="number" min="1" step="1" value={bookingForm.guests} onChange={handleBookingFormChange} required />
                                </label>
                                <label>
                                  Occasion
                                  <input name="occasion" value={bookingForm.occasion} onChange={handleBookingFormChange} />
                                </label>
                                <label>
                                  Event address
                                  <input name="eventAddress" value={bookingForm.eventAddress} onChange={handleBookingFormChange} />
                                </label>
                                <label>
                                  Event details
                                  <textarea name="eventDetails" value={bookingForm.eventDetails} onChange={handleBookingFormChange} rows="3" />
                                </label>
                                <div className="booking-actions">
                                  <button type="submit" className="btn-secondary" disabled={savingBookingId === booking._id}>
                                    {savingBookingId === booking._id ? 'Saving...' : 'Save changes'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => { setEditingBookingId(null); setBookingForm(null); }}
                                    disabled={savingBookingId === booking._id}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                            <div><strong>Email:</strong> {booking.email}</div>
                            <div><strong>Phone:</strong> {booking.phone || '--'}</div>
                            <div><strong>Occasion:</strong> {booking.occasion || '--'}</div>
                            <div><strong>Event address:</strong> {booking.eventAddress || '--'}</div>
                            {booking.eventDetails && <div><strong>Event details:</strong> {booking.eventDetails}</div>}
                            <div><strong>Status:</strong> {booking.status === 'approved' ? 'Approved' : 'Pending approval'}</div>
                            {booking.approvedAt && (
                              <div><strong>Approved:</strong> {new Date(booking.approvedAt).toLocaleString()}</div>
                            )}
                            <div><strong>Created:</strong> {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '--'}</div>
                            <div className="booking-actions">
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleBookingEdit(booking)}
                              >
                                Edit booking
                              </button>
                              {(booking.status || 'pending') !== 'approved' && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleApproveBooking(booking._id)}
                                  disabled={approvingBookingId === booking._id}
                                >
                                  {approvingBookingId === booking._id ? 'Approving...' : 'Approve'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-danger"
                                onClick={() => handleDeleteClick(booking._id)}
                              >
                                Delete
                              </button>
                            </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {!isLoading && filteredBookings.length > BOOKINGS_PER_PAGE && (
                  <div className="booking-pagination" aria-label="Booking list pagination">
                    <button
                      type="button"
                      className="booking-page-button"
                      onClick={() => setBookingPage((page) => Math.max(0, page - 1))}
                      disabled={bookingPage === 0}
                      aria-label="Previous booking page"
                    >
                      <ChevronLeft size={17} aria-hidden="true" />
                    </button>
                    <span>Page {bookingPage + 1} of {totalBookingPages} · {filteredBookings.length} bookings</span>
                    <button
                      type="button"
                      className="booking-page-button"
                      onClick={() => setBookingPage((page) => Math.min(totalBookingPages - 1, page + 1))}
                      disabled={bookingPage >= totalBookingPages - 1}
                      aria-label="Next booking page"
                    >
                      <ChevronRight size={17} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </section>
              )}

              {activeMainSection === 'messages' && (
                <section className="message-inbox panel" id="messages">
                  <div className="panel-head">
                    <h5>Booking Inquiries</h5>
                    <span>{messageBookings.length} result{messageBookings.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="message-inbox-filters">
                    <input
                      type="search"
                      className="search-input"
                      placeholder="Search client, contact, or event notes..."
                      aria-label="Search booking inquiries"
                      value={messageSearchTerm}
                      onChange={(event) => { setMessageSearchTerm(event.target.value); setMessagePage(0); }}
                    />
                    <select
                      className="sort-select"
                      aria-label="Filter inquiries by status"
                      value={messageStatusFilter}
                      onChange={(event) => { setMessageStatusFilter(event.target.value); setMessagePage(0); }}
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                    </select>
                  </div>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : messageBookings.length === 0 ? (
                    <p className="helper-text">No booking inquiries match these filters.</p>
                  ) : (
                    <div className="message-inbox-list">
                      {pagedMessageBookings.map((booking) => {
                        const subject = `Your ${booking.occasion || 'event'} booking inquiry`;
                        const body = [
                          `Hello ${booking.name || 'there'},`,
                          '',
                          `I am following up about your event on ${booking.date || 'the requested date'} at ${booking.time || 'the requested time'}.`,
                          booking.eventDetails ? `Your notes: ${booking.eventDetails}` : '',
                          '',
                          'Regards'
                        ].filter(Boolean).join('\n');
                        return (
                          <article className="message-inquiry" key={booking._id}>
                            <div className="message-inquiry-header">
                              <div className="message-inquiry-client">
                                <strong>{booking.name || 'Client'}</strong>
                                <span>{booking.email || 'No email provided'}{booking.phone ? ` · ${booking.phone}` : ''}</span>
                              </div>
                              <span className={`booking-status-pill ${(booking.status || 'pending').toLowerCase()}`}>
                                {booking.status === 'approved' ? 'Approved' : 'Pending'}
                              </span>
                            </div>
                            <div className="message-inquiry-meta">
                              <span>{booking.occasion || 'Event'} · {booking.date || 'Date not set'} · {booking.time || 'Time not set'}</span>
                              <span>{booking.guests || '?'} guests</span>
                            </div>
                            <p className="message-inquiry-notes">
                              {booking.eventDetails || 'No additional event notes were included.'}
                            </p>
                            <div className="message-inquiry-actions">
                              {booking.email && (
                                <a className="btn-secondary" href={`mailto:${booking.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                                  Reply by email
                                </a>
                              )}
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => openBooking(booking._id)}
                              >
                                Open booking
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                  {messageBookings.length > MESSAGES_PER_PAGE && (
                    <div className="booking-pagination" aria-label="Message inbox pagination">
                      <button
                        type="button"
                        className="booking-page-button"
                        onClick={() => setMessagePage((page) => Math.max(0, page - 1))}
                        disabled={messagePage === 0}
                        aria-label="Previous message page"
                      >
                        <ChevronLeft size={17} aria-hidden="true" />
                      </button>
                      <span>Page {messagePage + 1} of {totalMessagePages} · {messageBookings.length} inquiries</span>
                      <button
                        type="button"
                        className="booking-page-button"
                        onClick={() => setMessagePage((page) => Math.min(totalMessagePages - 1, page + 1))}
                        disabled={messagePage >= totalMessagePages - 1}
                        aria-label="Next message page"
                      >
                        <ChevronRight size={17} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </section>
              )}

              {activeMainSection === 'activity' && (
              <section className="activity-section panel">
                <div className="panel-head">
                  <h5>Recent Activity</h5>
                  <span>{filteredActivities.length} of {activities.length} entries</span>
                </div>
                <div className="activity-filters">
                  <input
                    type="search"
                    className="search-input"
                    placeholder="Search actions or details..."
                    aria-label="Search activity history"
                    value={activitySearchTerm}
                    onChange={(event) => { setActivitySearchTerm(event.target.value); setActivityPage(0); }}
                  />
                  <select
                    className="sort-select"
                    aria-label="Filter activity by action"
                    value={activityActionFilter}
                    onChange={(event) => { setActivityActionFilter(event.target.value); setActivityPage(0); }}
                  >
                    <option value="all">All actions</option>
                    {activityActions.map((action) => <option key={action} value={action}>{action}</option>)}
                  </select>
                </div>
                <div className="activity-list">
                  {filteredActivities.length === 0 ? (
                    <p className="helper-text">{activities.length ? 'No activity matches these filters.' : 'No recent activity.'}</p>
                  ) : (
                    pagedActivities.map((item) => (
                      <div key={item._id || `${item.action}-${item.timestamp}`} className="activity-item">
                        <span className="activity-action">{item.actor || item.user || 'Actor not recorded'} · {item.action || 'updated dashboard'}</span>
                        <span className="activity-details">{item.target || item.details || 'System update'}</span>
                        <span className="activity-time">{item.timestamp ? new Date(item.timestamp).toLocaleString() : '--'}</span>
                      </div>
                    ))
                  )}
                </div>
                {filteredActivities.length > ACTIVITIES_PER_PAGE && (
                  <div className="booking-pagination" aria-label="Activity history pagination">
                    <button
                      type="button"
                      className="booking-page-button"
                      onClick={() => setActivityPage((page) => Math.max(0, page - 1))}
                      disabled={activityPage === 0}
                      aria-label="Previous activity page"
                    >
                      <ChevronLeft size={17} aria-hidden="true" />
                    </button>
                    <span>Page {activityPage + 1} of {totalActivityPages} · {filteredActivities.length} entries</span>
                    <button
                      type="button"
                      className="booking-page-button"
                      onClick={() => setActivityPage((page) => Math.min(totalActivityPages - 1, page + 1))}
                      disabled={activityPage >= totalActivityPages - 1}
                      aria-label="Next activity page"
                    >
                      <ChevronRight size={17} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </section>
              )}

              {activeMainSection === 'status' && (
              <section className="admin-section panel admin-section-utility" id="status">
                <div className="panel-head">
                  <h5>Admin Status</h5>
                  <button type="button" className="panel-more" aria-label="More options">...</button>
                </div>
                <div className="admin-form">
                  <button type="button" className="btn-secondary" onClick={handleAuthCheck}>
                    Check Auth
                  </button>
                  {authStatus && (
                    <p className={`helper-text ${authStatus.type}`}>{authStatus.message}</p>
                  )}

                  <label className="helper-text">Test Cloudinary Upload</label>
                  <input type="file" accept="image/*" onChange={handleUploadTest} />
                  {uploadStatus && (
                    <div className={`helper-text ${uploadStatus.type}`}>
                      {uploadStatus.message}
                      {uploadStatus.url && (
                        <div>
                          <a href={uploadStatus.url} target="_blank" rel="noreferrer">View Uploaded Image</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
              )}
            </div>

            <div className="admin-column admin-column-side">
              {activeMainSection === 'bookings' && (
                <section className="upcoming-agenda panel" aria-labelledby="upcoming-agenda-title">
                  <div className="panel-head">
                    <h5 id="upcoming-agenda-title">Upcoming Events</h5>
                    <span>{upcomingBookings.length} total</span>
                  </div>
                  {upcomingBookings.length === 0 ? (
                    <p className="helper-text">No upcoming events scheduled.</p>
                  ) : (
                    <div className="upcoming-agenda-list">
                      {upcomingBookings.slice(0, 5).map((booking) => (
                        <button
                          type="button"
                          className="upcoming-agenda-item"
                          key={booking._id}
                          onClick={() => {
                            const [year, month] = booking.date.split('-').map(Number);
                            setCalendarMonth(new Date(year, month - 1, 1));
                            setSelectedCalendarDate(booking.date);
                            setActiveMainSection('calendar');
                          }}
                        >
                          <span className="upcoming-agenda-date">
                            {new Date(`${booking.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="upcoming-agenda-details">
                            <strong>{booking.name || 'Client'} · {booking.occasion || 'Event'}</strong>
                            <span>{booking.time || 'Time not set'} · {booking.guests || '?'} guests</span>
                          </span>
                          <span className={`booking-status-pill ${(booking.status || 'pending').toLowerCase()}`}>
                            {booking.status === 'approved' ? 'Approved' : 'Pending'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {upcomingBookings.length > 5 && (
                    <button type="button" className="upcoming-agenda-more" onClick={() => openOverviewSection('upcoming')}>
                      View all upcoming dates
                    </button>
                  )}
                </section>
              )}
              {activeMainSection === 'settings' && (
                <section className="admin-section panel admin-section-main" id="settings">
                  <div className="panel-head">
                    <h5>Site Settings</h5>
                  </div>
                  <form className="admin-form" onSubmit={handleBioSave}>
                    <div className="form-group">
                      <label htmlFor="admin-chef-bio">Chef bio</label>
                      <textarea
                        id="admin-chef-bio"
                        value={bioContent}
                        onChange={(event) => { setBioContent(event.target.value); setBioStatus(null); }}
                        rows="10"
                        maxLength="10000"
                      />
                    </div>
                    <button type="submit" className="btn-primary" disabled={bioSaving}>
                      {bioSaving ? 'Saving...' : 'Save bio'}
                    </button>
                    {bioStatus && <p className={`helper-text ${bioStatus.type}`} role="status">{bioStatus.message}</p>}
                  </form>
                </section>
              )}
              {activeMainSection === 'meals' && (
              <div className="admin-section panel admin-section-main" id="meals">
              <div className="panel-head">
                <h5>Meals</h5>
                <button type="button" className="panel-more" aria-label="More options">...</button>
              </div>
              <form className="admin-form" onSubmit={handleMealSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" name="title" value={mealForm.title} onChange={handleMealChange} />
                </div>
                <div className="form-group meal-form-category">
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    value={mealForm.category}
                    onChange={handleMealChange}
                    placeholder="e.g. Chicken, Lunch, Snacks"
                  />
                </div>
                <div className="form-group meal-form-description">
                  <label>Description</label>
                  <textarea name="description" value={mealForm.description} onChange={handleMealChange} rows="3"></textarea>
                </div>
                <div className="form-group">
                  <label>Image</label>
                  <input type="file" accept="image/*" onChange={handleUpload} />
                  {uploading && <p className="helper-text">Uploading...</p>}
                  {mealForm.imageUrl && (
                    <img
                      src={transformCloudinary(mealForm.imageUrl, 420)}
                      alt="Meal preview"
                      className="meal-preview"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <div className="form-group meal-form-social-url">
                  <label>URL</label>
                  <div className="social-url-field-row">
                    <input
                      type="url"
                      name="socialUrl"
                      value={mealForm.socialUrl}
                      onChange={handleMealChange}
                      placeholder="https://instagram.com/... or https://tiktok.com/..."
                    />
                    <div className="social-url-actions">
                      <button
                        type="button"
                        className="btn-secondary social-url-action-btn"
                        onClick={handlePasteSocialUrl}
                      >
                        Paste Link
                      </button>
                      <button
                        type="button"
                        className="btn-secondary social-url-action-btn"
                        onClick={handleOpenSocialApp}
                      >
                        Open App
                      </button>
                    </div>
                  </div>
                </div>
                <div className="admin-actions-row">
                  <button type="submit" className="btn-primary">
                    {editingMealId ? 'Update Meal' : 'Add Meal'}
                  </button>
                  {editingMealId && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditingMealId(null);
                        setMealForm({ title: '', category: '', description: '', imageUrl: '', socialUrl: '' });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="meal-manager-filters">
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search meals..."
                  aria-label="Search meals"
                  value={mealSearchTerm}
                  onChange={(event) => { setMealSearchTerm(event.target.value); setMealPage(0); }}
                />
                <select
                  className="sort-select"
                  aria-label="Filter meals by category"
                  value={mealCategoryFilter}
                  onChange={(event) => { setMealCategoryFilter(event.target.value); setMealPage(0); }}
                >
                  <option value="all">All categories</option>
                  {mealCategories.map((category) => <option value={category} key={category}>{formatCategoryLabel(category)}</option>)}
                </select>
                <span className="meal-manager-count">{filteredMeals.length} meal{filteredMeals.length === 1 ? '' : 's'}</span>
              </div>

              {filteredMeals.length === 0 ? (
                <p className="helper-text">{meals.length ? 'No meals match these filters.' : 'No meals have been added yet.'}</p>
              ) : (
              <div className="meal-tile-grid">
                {pagedMeals.map((meal) => (
                  <div
                    key={meal._id}
                    className={`meal-tile ${expandedMealId === meal._id ? 'active' : ''}`}
                  >
                    <button
                      type="button"
                      className="meal-tile-trigger"
                      onClick={() => handleMealTileClick(meal._id)}
                      aria-expanded={expandedMealId === meal._id}
                    >
                      <div className="meal-tile-media">
                        {meal.imageUrl && (
                          <img
                            src={transformCloudinary(meal.imageUrl, 360)}
                            alt={meal.title}
                            className="meal-thumb"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                      <span className="meal-tile-title">{meal.title}</span>
                      {meal.category ? (
                        <span className="meal-tile-category">{formatCategoryLabel(meal.category)}</span>
                      ) : null}
                      {meal.description ? (
                        <p className="meal-tile-description">{meal.description}</p>
                      ) : null}
                    </button>
                    <div className="meal-tile-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleMealEdit(meal)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handleMealDelete(meal._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}

              {filteredMeals.length > MEALS_PER_PAGE && <div className="meal-pagination" aria-label="Meals pagination">
                <button
                  type="button"
                  className="meal-page-btn"
                  onClick={() => setMealPage(prev => Math.max(0, prev - 1))}
                  disabled={mealPage === 0}
                  aria-label="Previous recipes"
                >
                  &#8592;
                </button>
                <span className="meal-page-status">
                  Page {mealPage + 1} of {totalMealPages}
                </span>
                <button
                  type="button"
                  className="meal-page-btn"
                  onClick={() => setMealPage(prev => Math.min(totalMealPages - 1, prev + 1))}
                  disabled={mealPage >= totalMealPages - 1}
                  aria-label="Next recipes"
                >
                  &#8594;
                </button>
              </div>}
            </div>
            )}

            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this booking? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {expandedMeal && (
        <div
          className="meal-details-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${expandedMeal.title} details`}
          onClick={() => setExpandedMealId(null)}
        >
          <div className="meal-details-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="meal-details-close"
              aria-label="Close meal details"
              onClick={() => setExpandedMealId(null)}
            >
              x
            </button>
            <div className="meal-media">
              {expandedMeal.imageUrl && (
                <img
                  src={transformCloudinary(expandedMeal.imageUrl, 720)}
                  alt={expandedMeal.title}
                  className="meal-thumb"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <div className="meal-card-body">
              <div className="meal-title-row">
                <h4>{expandedMeal.title}</h4>
              </div>
              {expandedMeal.description ? <p className="helper-text meal-description">{expandedMeal.description}</p> : null}
              {expandedMeal.socialUrl && (
                <a href={expandedMeal.socialUrl} target="_blank" rel="noreferrer" className="helper-text">
                  Open social link
                </a>
              )}
              <div className="admin-actions-row meal-overlay-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    handleMealEdit(expandedMeal);
                    setExpandedMealId(null);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="btn-danger" onClick={() => handleMealDelete(expandedMeal._id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
