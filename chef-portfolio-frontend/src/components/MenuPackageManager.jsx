import { useEffect, useMemo, useRef, useState } from 'react';

const EMPTY_PACKAGE = {
  name: '',
  description: '',
  currency: 'KES',
  pricePerGuest: '',
  mealIds: [],
  isActive: true
};

function MenuPackageManager({ meals, apiUrl, token, onAuthExpired }) {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const [packages, setPackages] = useState([]);
  const [packageForm, setPackageForm] = useState(EMPTY_PACKAGE);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const onAuthExpiredRef = useRef(onAuthExpired);
  onAuthExpiredRef.current = onAuthExpired;

  useEffect(() => {
    const controller = new AbortController();
    const loadPackages = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/admin/menu-packages`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal
        });
        if (response.status === 401) {
          onAuthExpiredRef.current();
          return;
        }
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data.error || 'Could not load menu packages');
        setPackages(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Load menu packages error:', error);
          setStatus({ type: 'error', message: error.message || 'Could not load menu packages.' });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    loadPackages();
    return () => controller.abort();
  }, [apiUrl, token]);

  const categories = useMemo(() => (
    [...new Set(meals.map((meal) => String(meal.category || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
  ), [meals]);

  const filteredMeals = useMemo(() => meals.filter((meal) => {
    if (categoryFilter !== 'all' && meal.category !== categoryFilter) return false;
    const query = searchTerm.trim().toLowerCase();
    return !query || [meal.title, meal.category, meal.description]
      .some((value) => String(value || '').toLowerCase().includes(query));
  }), [categoryFilter, meals, searchTerm]);

  const setFormField = (field, value) => {
    setPackageForm((current) => ({ ...current, [field]: value }));
    setStatus(null);
  };

  const toggleMeal = (mealId) => {
    setPackageForm((current) => ({
      ...current,
      mealIds: current.mealIds.includes(mealId)
        ? current.mealIds.filter((id) => id !== mealId)
        : [...current.mealIds, mealId]
    }));
    setStatus(null);
  };

  const resetForm = () => {
    setPackageForm(EMPTY_PACKAGE);
    setEditingPackageId(null);
    setStatus(null);
  };

  const handleEdit = (menuPackage) => {
    setEditingPackageId(menuPackage._id);
    setPackageForm({
      name: menuPackage.name || '',
      description: menuPackage.description || '',
      currency: menuPackage.currency || 'KES',
      pricePerGuest: String(menuPackage.pricePerGuest ?? ''),
      mealIds: (menuPackage.mealIds || []).filter(Boolean).map((meal) => typeof meal === 'string' ? meal : meal._id),
      isActive: menuPackage.isActive !== false
    });
    setStatus(null);
    document.getElementById('menu-package-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving) return;
    if (packageForm.mealIds.length < 1) {
      setStatus({ type: 'error', message: 'Choose at least one dish for this package.' });
      return;
    }
    const price = Number(packageForm.pricePerGuest);
    if (!Number.isFinite(price) || price < 0) {
      setStatus({ type: 'error', message: 'Enter a valid price per guest.' });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      const packageUrl = editingPackageId
        ? `${apiUrl}/api/admin/menu-packages/${editingPackageId}`
        : `${apiUrl}/api/admin/menu-packages`;
      const response = await fetch(packageUrl, {
        method: editingPackageId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          ...packageForm,
          pricePerGuest: price
        })
      });
      if (response.status === 401) {
        onAuthExpired();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data._id) {
        setStatus({ type: 'error', message: data.error || 'Could not save this package.' });
        return;
      }
      setPackages((current) => editingPackageId
        ? current.map((item) => item._id === data._id ? data : item)
        : [data, ...current]);
      setStatus({ type: 'success', message: `${data.name} ${editingPackageId ? 'updated' : 'created'} successfully.` });
      setPackageForm(EMPTY_PACKAGE);
      setEditingPackageId(null);
    } catch (error) {
      console.error('Save menu package error:', error);
      setStatus({ type: 'error', message: 'Could not connect to save this package.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (menuPackage) => {
    const action = menuPackage.isActive ? 'archive' : 'make available again';
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} "${menuPackage.name}"?`)) return;
    setStatus(null);
    try {
      const response = menuPackage.isActive
        ? await fetch(`${apiUrl}/api/admin/menu-packages/${menuPackage._id}`, {
          method: 'DELETE',
          headers: authHeaders
        })
        : await fetch(`${apiUrl}/api/admin/menu-packages/${menuPackage._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            name: menuPackage.name,
            description: menuPackage.description,
            currency: menuPackage.currency,
            pricePerGuest: menuPackage.pricePerGuest,
            mealIds: (menuPackage.mealIds || []).filter(Boolean).map((meal) => typeof meal === 'string' ? meal : meal._id),
            isActive: true
          })
        });
      if (response.status === 401) {
        onAuthExpired();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus({ type: 'error', message: data.error || `Could not ${action} this package.` });
        return;
      }
      if (menuPackage.isActive) {
        setPackages((current) => current.map((item) => (
          item._id === menuPackage._id ? { ...item, isActive: false } : item
        )));
      } else {
        setPackages((current) => current.map((item) => item._id === data._id ? data : item));
      }
      setStatus({ type: 'success', message: `${menuPackage.name} ${menuPackage.isActive ? 'archived' : 'made available'}.` });
    } catch (error) {
      console.error('Change menu package availability error:', error);
      setStatus({ type: 'error', message: `Could not ${action} this package.` });
    }
  };

  return (
    <section className="menu-package-manager panel" id="menu-packages">
      <div className="panel-head">
        <div>
          <h5>Menu Packages</h5>
          <p className="helper-text">Build per-guest menus using dishes from your meal catalog.</p>
        </div>
        <span>{packages.filter((item) => item.isActive).length} active · {packages.length} total</span>
      </div>

      <form id="menu-package-form" className="menu-package-form" onSubmit={handleSubmit}>
        <h6>{editingPackageId ? 'Edit package' : 'Create a package'}</h6>
        <div className="menu-package-fields">
          <label>
            Package name
            <input
              type="text"
              value={packageForm.name}
              onChange={(event) => setFormField('name', event.target.value)}
              maxLength={100}
              required
              placeholder="e.g. Signature celebration"
            />
          </label>
          <label>
            Currency
            <select value={packageForm.currency} onChange={(event) => setFormField('currency', event.target.value)}>
              <option value="KES">KES</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
          <label>
            Price per guest
            <input
              type="number"
              value={packageForm.pricePerGuest}
              onChange={(event) => setFormField('pricePerGuest', event.target.value)}
              min="0"
              max="1000000000"
              step="0.01"
              required
              placeholder="0.00"
            />
          </label>
        </div>
        <label className="menu-package-description">
          Description
          <textarea
            value={packageForm.description}
            onChange={(event) => setFormField('description', event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Describe what this package is best suited for."
          />
        </label>

        <div className="menu-package-meal-picker">
          <div className="menu-package-picker-heading">
            <strong>Included dishes ({packageForm.mealIds.length})</strong>
            <span>Select at least one dish</span>
          </div>
          <div className="menu-package-meal-filters">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search meals to add to package"
              placeholder="Search meals..."
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter meals by category"
            >
              <option value="all">All categories</option>
              {categories.map((category) => <option value={category} key={category}>{category}</option>)}
            </select>
          </div>
          {meals.length === 0 ? (
            <p className="helper-text">Add meals to the catalog before creating packages.</p>
          ) : filteredMeals.length === 0 ? (
            <p className="helper-text">No meals match your search.</p>
          ) : (
            <div className="menu-package-meal-grid">
              {filteredMeals.map((meal) => (
                <label className="menu-package-meal-option" key={meal._id}>
                  <input
                    type="checkbox"
                    checked={packageForm.mealIds.includes(meal._id)}
                    onChange={() => toggleMeal(meal._id)}
                  />
                  {meal.imageUrl && <img src={meal.imageUrl} alt="" loading="lazy" />}
                  <span>
                    <strong>{meal.title || 'Untitled dish'}</strong>
                    <small>{meal.category || meal.description || 'Meal catalog item'}</small>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        {status && <p className={`helper-text ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}
        <div className="admin-actions-row">
          <button type="submit" className="btn-primary" disabled={isSaving || meals.length === 0}>
            {isSaving ? 'Saving...' : editingPackageId ? 'Save package' : 'Create package'}
          </button>
          {editingPackageId && (
            <button type="button" className="btn-secondary" onClick={resetForm} disabled={isSaving}>Cancel</button>
          )}
        </div>
      </form>

      <div className="menu-package-list">
        {isLoading ? (
          <p className="helper-text">Loading packages...</p>
        ) : packages.length === 0 ? (
          <p className="helper-text">No packages created yet.</p>
        ) : packages.map((menuPackage) => (
          <article className={`menu-package-card ${menuPackage.isActive ? '' : 'archived'}`} key={menuPackage._id}>
            <div className="menu-package-card-heading">
              <div>
                <h6>{menuPackage.name}</h6>
                <p>{menuPackage.description || 'No description provided.'}</p>
              </div>
              <span className={`menu-package-state ${menuPackage.isActive ? 'active' : 'archived'}`}>
                {menuPackage.isActive ? 'Active' : 'Archived'}
              </span>
            </div>
            <strong className="menu-package-price">
              {menuPackage.currency} {Number(menuPackage.pricePerGuest || 0).toFixed(2)} / guest
            </strong>
            <ul>
              {(menuPackage.mealIds || []).filter(Boolean).map((meal) => (
                <li key={typeof meal === 'string' ? meal : meal._id}>
                  {typeof meal === 'string' ? 'Meal no longer available' : meal.title || 'Untitled dish'}
                </li>
              ))}
            </ul>
            <div className="menu-package-card-actions">
              <button type="button" className="btn-secondary" onClick={() => handleEdit(menuPackage)}>Edit</button>
              <button type="button" className="btn-secondary" onClick={() => handleArchive(menuPackage)}>
                {menuPackage.isActive ? 'Archive' : 'Make active'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default MenuPackageManager;
