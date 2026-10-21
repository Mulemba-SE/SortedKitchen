import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

function AdminDashboard({ onLogout }) {
  const MEALS_PER_PAGE = 10;
  const [bookings, setBookings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [meals, setMeals] = useState([]);
  const [mealForm, setMealForm] = useState({ title: '', category: '', description: '', imageUrl: '', socialUrl: '' });
  const [editingMealId, setEditingMealId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [bioContent, setBioContent] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [mealPage, setMealPage] = useState(0);
  const [authExpired, setAuthExpired] = useState(false);
  const [authToastVisible, setAuthToastVisible] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [expandedMealId, setExpandedMealId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMainSection, setActiveMainSection] = useState('bookings');
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
    fetch(`${apiUrl}/api/activity`, { headers: authHeaders })
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

  const filteredBookings = bookings.filter(booking => {
    const status = booking.status || 'pending';
    if (bookingStatusFilter !== 'all' && status !== bookingStatusFilter) return false;
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      booking.name?.toLowerCase().includes(query) ||
      booking.email?.toLowerCase().includes(query) ||
      booking.occasion?.toLowerCase().includes(query)
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

  const totalBookings = bookings.length;
  const totalClients = new Set(bookings.map((booking) => booking.email || booking.name || booking._id)).size;
  const pendingInquiries = bookings.filter((booking) => (booking.status || 'pending') === 'pending').length;
  const upcomingEvents = filteredBookings.slice(0, 3);
  const totalMealPages = Math.max(1, Math.ceil(meals.length / MEALS_PER_PAGE));
  const pagedMeals = meals.slice(mealPage * MEALS_PER_PAGE, (mealPage + 1) * MEALS_PER_PAGE);
  const expandedMeal = pagedMeals.find((meal) => meal._id === expandedMealId) || null;

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
        alert('Failed to save bio');
      }
    } catch (err) {
      console.error('Error saving bio:', err);
    } finally {
      setBioSaving(false);
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
            <a href="#overview" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
              <span className="admin-nav-icon">D</span>
              <span className="admin-nav-label">Dashboard</span>
            </a>
            <a href="#bookings" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
              <span className="admin-nav-icon">B</span>
              <span className="admin-nav-label">Bookings</span>
            </a>
            <a href="#overview" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
              <span className="admin-nav-icon">C</span>
              <span className="admin-nav-label">Clients</span>
            </a>
            <a href="#meals" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
              <span className="admin-nav-icon">M</span>
              <span className="admin-nav-label">Menus and Recipes</span>
            </a>
            <a href="#overview" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
              <span className="admin-nav-icon">K</span>
              <span className="admin-nav-label">Calendar</span>
            </a>
            <a href="#status" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
              <span className="admin-nav-icon">X</span>
              <span className="admin-nav-label">Messages</span>
            </a>
            <a href="#overview" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
              <span className="admin-nav-icon">R</span>
              <span className="admin-nav-label">Reviews</span>
            </a>
            <a href="#bio" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
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
          <div className="stats-container" id="overview">
            <div className="stat-card">
              <h5>New Bookings</h5>
              <p>{totalBookings}</p>
              <span className="stat-link">View all</span>
            </div>
            <div className="stat-card">
              <h5>Upcoming Events</h5>
              <p>{upcomingEvents.length}</p>
              <span className="stat-link">View all</span>
            </div>
            <div className="stat-card">
              <h5>Total Clients</h5>
              <p>{totalClients}</p>
              <span className="stat-link">View all</span>
            </div>
            <div className="stat-card">
              <h5>Pending Inquiries</h5>
              <p>{pendingInquiries}</p>
              <span className="stat-link">View all</span>
            </div>
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
                  aria-selected={activeMainSection === 'meals'}
                  className={`admin-main-tab ${activeMainSection === 'meals' ? 'active' : ''}`}
                  onClick={() => setActiveMainSection('meals')}
                >
                  Meals
                </button>
              </div>

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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <select
                    aria-label="Filter bookings by status"
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="sort-select"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
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
                </div>

                {isLoading ? (
                  <LoadingSpinner />
                ) : filteredBookings.length === 0 ? (
                  <p style={{ textAlign: 'center' }}>No bookings found.</p>
                ) : (
                  filteredBookings.map(booking => {
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
              </section>
              )}

              {activeMainSection === 'activity' && (
              <section className="activity-section panel">
                <div className="panel-head">
                  <h5>Recent Activity</h5>
                  <button type="button" className="panel-more" aria-label="More options">...</button>
                </div>
                <div className="activity-list">
                  {activities.length === 0 ? (
                    <p className="helper-text">No recent activity.</p>
                  ) : (
                    activities.slice(0, 6).map((item) => (
                      <div key={item._id || `${item.action}-${item.timestamp}`} className="activity-item">
                        <span className="activity-action">{item.user || 'Chef Admin'} {item.action || 'updated dashboard'}</span>
                        <span className="activity-details">{item.target || item.details || 'System update'}</span>
                        <span className="activity-time">{item.timestamp ? new Date(item.timestamp).toLocaleString() : '--'}</span>
                      </div>
                    ))
                  )}
                </div>
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

              <div className="meal-pagination" aria-label="Meals pagination">
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
              </div>
            </div>
            )}

            <div className="admin-section panel admin-section-main" id="bio">
              <div className="panel-head">
                <h5>Bio</h5>
                <button type="button" className="panel-more" aria-label="More options">...</button>
              </div>
              <form className="admin-form" onSubmit={handleBioSave}>
                <div className="form-group">
                  <label>Bio Content</label>
                  <textarea value={bioContent} onChange={(e) => setBioContent(e.target.value)} rows="6"></textarea>
                </div>
                <button type="submit" className="btn-primary" disabled={bioSaving}>
                  {bioSaving ? 'Saving...' : 'Save Bio'}
                </button>
              </form>
            </div>
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
