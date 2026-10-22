import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const RANGE_OPTIONS = [6, 12, 24];
const CHART_WIDTH = 920;
const CHART_HEIGHT = 300;
const CHART_PADDING = { top: 22, right: 24, bottom: 50, left: 58 };

const formatMonth = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1))
    .toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' });
};

const formatNumber = (value) => new Intl.NumberFormat().format(value);

const formatMoney = (currency, value) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(Math.round(value))}`;
  }
};

function Chart({ title, description, values, color, valueFormat, axisFormat = valueFormat, type = 'line' }) {
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const maximum = Math.max(1, ...values.map((point) => point.value));
  const step = maximum / 4;
  const points = values.map((point, index) => {
    const x = values.length === 1
      ? CHART_PADDING.left + plotWidth / 2
      : CHART_PADDING.left + (index * plotWidth) / (values.length - 1);
    const y = CHART_PADDING.top + plotHeight - (point.value / maximum) * plotHeight;
    return { ...point, x, y };
  });
  const barWidth = values.length ? Math.max(4, Math.min(30, (plotWidth / values.length) * 0.55)) : 0;
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <section className="analytics-chart-card">
      <div className="analytics-chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {values.length === 0 ? (
        <p className="analytics-empty">No monthly data is available for this period.</p>
      ) : (
        <div className="analytics-chart-scroll">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            role="img"
            aria-label={`${title}. ${values.map((point) => `${point.label}: ${valueFormat(point.value)}`).join('; ')}`}
          >
            {[0, 1, 2, 3, 4].map((tick) => {
              const value = maximum - step * tick;
              const y = CHART_PADDING.top + (plotHeight * tick) / 4;
              return (
                <g key={tick}>
                  <line
                    x1={CHART_PADDING.left}
                    y1={y}
                    x2={CHART_WIDTH - CHART_PADDING.right}
                    y2={y}
                    className="analytics-chart-gridline"
                  />
                  <text x={CHART_PADDING.left - 10} y={y + 4} textAnchor="end" className="analytics-chart-axis-label">
                    {axisFormat(value)}
                  </text>
                </g>
              );
            })}
            {type === 'bar' ? points.map((point) => {
              const height = CHART_PADDING.top + plotHeight - point.y;
              return (
                <rect
                  key={point.key}
                  x={point.x - barWidth / 2}
                  y={point.y}
                  width={barWidth}
                  height={Math.max(0, height)}
                  rx="3"
                  fill={color}
                  className="analytics-chart-bar"
                >
                  <title>{point.label}: {valueFormat(point.value)}</title>
                </rect>
              );
            }) : (
              <>
                <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {points.map((point) => (
                  <circle key={point.key} cx={point.x} cy={point.y} r="4" fill={color} className="analytics-chart-point">
                    <title>{point.label}: {valueFormat(point.value)}</title>
                  </circle>
                ))}
              </>
            )}
            {points.map((point) => (
              <text
                key={point.key}
                x={point.x}
                y={CHART_HEIGHT - 17}
                textAnchor="middle"
                className="analytics-chart-axis-label"
              >
                {point.label}
              </text>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
}

function AdminAnalytics({ apiUrl, token, onAuthExpired }) {
  const [monthCount, setMonthCount] = useState(12);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const authExpiredRef = useRef(onAuthExpired);
  authExpiredRef.current = onAuthExpired;

  useEffect(() => {
    const controller = new AbortController();
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${apiUrl}/api/admin/analytics?months=${monthCount}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal
        });
        if (response.status === 401) {
          authExpiredRef.current();
          return;
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load analytics.');
        setAnalytics(data);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          console.error('Fetch booking analytics error:', fetchError);
          setError(fetchError.message || 'Could not load analytics.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    loadAnalytics();
    return () => controller.abort();
  }, [apiUrl, monthCount, token]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/admin/analytics?months=${monthCount}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.status === 401) {
        authExpiredRef.current();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not refresh analytics.');
      setAnalytics(data);
    } catch (fetchError) {
      console.error('Refresh booking analytics error:', fetchError);
      setError(fetchError.message || 'Could not refresh analytics.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const months = analytics?.months || [];
  const bookingValues = months.map((period) => ({
    key: period.month,
    label: formatMonth(period.month),
    value: Number(period.bookingCount || 0)
  }));
  const approvedCount = months.reduce((sum, period) => sum + Number(period.approvedCount || 0), 0);
  const bookingCount = months.reduce((sum, period) => sum + Number(period.bookingCount || 0), 0);
  const approvalRate = bookingCount ? Math.round((approvedCount / bookingCount) * 100) : 0;
  const currencies = analytics?.currencies || [];
  const revenueTotals = currencies.map((currency) => ({
    currency,
    amount: months.reduce((sum, period) => sum + Number(period.revenueByCurrency?.[currency] || 0), 0)
  }));

  return (
    <section className="admin-analytics panel" aria-labelledby="admin-analytics-title">
      <div className="admin-analytics-header">
        <div>
          <h2 id="admin-analytics-title">Booking analytics</h2>
          <p>Monthly booking activity and projected revenue from approved menu packages.</p>
        </div>
        <div className="admin-analytics-controls">
          <label htmlFor="analytics-month-range">Date range</label>
          <select
            id="analytics-month-range"
            value={monthCount}
            onChange={(event) => setMonthCount(Number(event.target.value))}
          >
            {RANGE_OPTIONS.map((range) => <option value={range} key={range}>Last {range} months</option>)}
          </select>
          <button type="button" className="btn-secondary" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
            <RefreshCw size={16} aria-hidden="true" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <p className="analytics-revenue-disclaimer">
        Projected package value is not collected revenue. Only approved bookings with a selected menu package are included.
        Estimates and bookings without packages are excluded. Revenue is shown separately by currency.
      </p>

      {error && <p className="helper-text error" role="alert">{error}</p>}
      {isLoading && !analytics ? (
        <p className="analytics-empty" role="status">Loading analytics...</p>
      ) : analytics ? (
        <>
          <div className="analytics-summary-cards">
            <article>
              <span>Bookings in period</span>
              <strong>{formatNumber(bookingCount)}</strong>
              <small>By event date</small>
            </article>
            <article>
              <span>Approved bookings</span>
              <strong>{formatNumber(approvedCount)}</strong>
              <small>{approvalRate}% of booking requests</small>
            </article>
            {revenueTotals.length === 0 ? (
              <article>
                <span>Projected package value</span>
                <strong>--</strong>
                <small>No approved package bookings in this period</small>
              </article>
            ) : revenueTotals.map(({ currency, amount }) => (
              <article key={currency}>
                <span>Projected package value · {currency}</span>
                <strong>{formatMoney(currency, amount)}</strong>
                <small>Approved package bookings</small>
              </article>
            ))}
          </div>

          <div className="analytics-chart-grid">
            <Chart
              title="Bookings by month"
              description="All requests grouped by their event date."
              values={bookingValues}
              color="#e8730c"
              valueFormat={(value) => formatNumber(Math.round(value))}
              type="bar"
            />
            {currencies.length === 0 ? (
              <Chart
                title="Projected revenue by month"
                description="No approved menu package bookings to chart for this range."
                values={months.map((period) => ({
                  key: period.month,
                  label: formatMonth(period.month),
                  value: 0
                }))}
                color="#76c88c"
                valueFormat={(value) => formatNumber(Math.round(value))}
              />
            ) : currencies.map((currency) => (
              <Chart
                key={currency}
                title={`Projected revenue by month · ${currency}`}
                description="Approved menu package totals grouped by event date."
                values={months.map((period) => ({
                  key: period.month,
                  label: formatMonth(period.month),
                  value: Number(period.revenueByCurrency?.[currency] || 0)
                }))}
                color="#76c88c"
                valueFormat={(value) => formatMoney(currency, value)}
                axisFormat={(value) => `${currency} ${new Intl.NumberFormat(undefined, {
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(value)}`}
              />
            ))}
          </div>

          <div className="analytics-data-table-wrap">
            <table className="analytics-data-table">
              <caption>Monthly booking and projected package totals</caption>
              <thead>
                <tr>
                  <th scope="col">Event month</th>
                  <th scope="col">Bookings</th>
                  <th scope="col">Approved</th>
                  {currencies.map((currency) => <th scope="col" key={currency}>{currency} projected</th>)}
                </tr>
              </thead>
              <tbody>
                {months.map((period) => (
                  <tr key={period.month}>
                    <th scope="row">{formatMonth(period.month)}</th>
                    <td>{formatNumber(period.bookingCount || 0)}</td>
                    <td>{formatNumber(period.approvedCount || 0)}</td>
                    {currencies.map((currency) => (
                      <td key={currency}>{formatMoney(currency, Number(period.revenueByCurrency?.[currency] || 0))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : !error ? (
        <p className="analytics-empty">Analytics are not available right now.</p>
      ) : null}
    </section>
  );
}

export default AdminAnalytics;
