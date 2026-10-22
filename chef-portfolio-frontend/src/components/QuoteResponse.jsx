import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function QuoteResponse() {
  const [searchParams] = useSearchParams();
  const responseToken = searchParams.get('token') || '';
  const [quoteResponse, setQuoteResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const controller = new AbortController();
    if (!responseToken) {
      setError('This estimate link is incomplete or invalid.');
      setIsLoading(false);
      return () => controller.abort();
    }

    const loadQuote = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/quote-response/${encodeURIComponent(responseToken)}`, {
          signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error || 'This estimate link is invalid or no longer available.');
          return;
        }
        setQuoteResponse(data);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError('Could not connect to load this estimate. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadQuote();
    return () => controller.abort();
  }, [apiUrl, responseToken]);

  const handleDecision = async (decision) => {
    setSubmittingDecision(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/quote-response/${encodeURIComponent(responseToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.response) setQuoteResponse(data.response);
        setError(data.error || 'Could not record your response. Please try again.');
        return;
      }
      setQuoteResponse(data.response);
    } catch {
      setError('Could not connect to record your response. Please try again.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const isFinal = ['accepted', 'declined'].includes(quoteResponse?.status);

  return (
    <main className="quote-response-page">
      <section className="quote-response-card" aria-labelledby="quote-response-title">
        <p className="quote-response-brand">Sorted Kitchen</p>
        <h1 id="quote-response-title">Your catering estimate</h1>
        {isLoading ? (
          <p role="status">Loading your estimate...</p>
        ) : error && !quoteResponse ? (
          <p className="quote-response-error" role="alert">{error}</p>
        ) : quoteResponse ? (
          <>
            <p>
              Hello {quoteResponse.name || 'there'}{quoteResponse.occasion ? `, here is your estimate for ${quoteResponse.occasion}` : ''}.
              {quoteResponse.date ? ` Event date: ${quoteResponse.date}.` : ''}
            </p>
            <div className="quote-response-items">
              {quoteResponse.quote.items.map((item, index) => (
                <div className="quote-response-item" key={`${item.description}-${index}`}>
                  <span>
                    {item.description}
                    <small>{item.quantity} × {quoteResponse.quote.currency} {Number(item.unitPrice).toFixed(2)}</small>
                  </span>
                  <strong>{quoteResponse.quote.currency} {Number(item.lineTotal).toFixed(2)}</strong>
                </div>
              ))}
            </div>
            <p className="quote-response-total">
              Estimated total
              <strong>{quoteResponse.quote.currency} {Number(quoteResponse.quote.total).toFixed(2)}</strong>
            </p>
            <p className="quote-response-note">
              This estimate is for review only. Accepting it records your response and does not request payment.
            </p>
            {isFinal ? (
              <div className={`quote-response-result ${quoteResponse.status}`} role="status">
                <strong>You {quoteResponse.status} this estimate.</strong>
                {quoteResponse.respondedAt && (
                  <span>{new Date(quoteResponse.respondedAt).toLocaleString()}</span>
                )}
              </div>
            ) : (
              <div className="quote-response-actions">
                <button
                  type="button"
                  className="quote-response-accept"
                  onClick={() => handleDecision('accepted')}
                  disabled={submittingDecision}
                >
                  {submittingDecision ? 'Saving response...' : 'Accept estimate'}
                </button>
                <button
                  type="button"
                  className="quote-response-decline"
                  onClick={() => handleDecision('declined')}
                  disabled={submittingDecision}
                >
                  Decline estimate
                </button>
              </div>
            )}
            {error && <p className="quote-response-error" role="alert">{error}</p>}
          </>
        ) : null}
        <p className="quote-response-footer">Questions? Reply to the email that included this estimate.</p>
      </section>
    </main>
  );
}

export default QuoteResponse;
