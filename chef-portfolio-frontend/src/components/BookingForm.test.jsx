import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import BookingForm from './BookingForm';

vi.mock('react-datepicker', () => ({
  default: ({ selected, onChange, ...props }) => (
    <input
      {...props}
      aria-label="Date"
      type="date"
      value={selected ? [
        selected.getFullYear(),
        String(selected.getMonth() + 1).padStart(2, '0'),
        String(selected.getDate()).padStart(2, '0')
      ].join('-') : ''}
      onChange={(event) => onChange(event.target.value ? new Date(`${event.target.value}T12:00:00`) : null)}
    />
  )
}));

vi.mock('../utils/authStorage', () => ({ getToken: () => 'customer-test-token' }));

const availableDates = { unavailableDates: [], bookedDates: [] };
const packages = [{
  _id: 'package-123',
  name: 'Celebration Menu',
  currency: 'KES',
  pricePerGuest: 1250,
  mealIds: []
}];

const response = (data, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data
});

const fillBooking = () => {
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Amina Customer' } });
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'amina@example.test' } });
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2030-01-03' } });
  fireEvent.change(screen.getByLabelText('Time'), { target: { value: '18:30' } });
};

describe('BookingForm', () => {
  beforeEach(() => {
    availableDates.unavailableDates = [];
    availableDates.bookedDates = [];
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).endsWith('/api/availability')) return response(availableDates);
      if (String(url).endsWith('/api/menu-packages')) return response(packages);
      if (String(url).endsWith('/api/book')) return response({ message: 'Created' });
      throw new Error(`Unexpected fetch: ${url}`);
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows validation errors and does not submit when no date is selected', async () => {
    const fetchMock = globalThis.fetch;
    render(<BookingForm />);
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'amina@example.test' } });

    fireEvent.submit(screen.getByRole('button', { name: 'Reserve' }).closest('form'));

    expect(await screen.findByText('Please select a date.')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a date reported unavailable by the API', async () => {
    availableDates.unavailableDates = ['2030-01-02'];
    render(<BookingForm />);
    await screen.findByText('Dates that are booked or unavailable cannot be selected.');
    fillBooking();
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2030-01-02' } });

    fireEvent.submit(screen.getByRole('button', { name: 'Reserve' }).closest('form'));

    expect(await screen.findByText('This date is unavailable. Please select another date.')).toBeTruthy();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('submits a valid booking with the selected package and auth token', async () => {
    const fetchMock = globalThis.fetch;
    render(<BookingForm defaultOccasion="Birthday" />);
    await screen.findByRole('option', { name: /Celebration Menu/ });
    fillBooking();
    fireEvent.change(screen.getByLabelText('Menu package (optional)'), { target: { value: 'package-123' } });

    fireEvent.submit(screen.getByRole('button', { name: 'Reserve' }).closest('form'));

    expect(await screen.findByText('Thank you, Amina Customer! Your request has been received.')).toBeTruthy();
    const bookingCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/book'));
    expect(bookingCall).toBeTruthy();
    expect(bookingCall[1].headers.Authorization).toBe('Bearer customer-test-token');
    expect(JSON.parse(bookingCall[1].body)).toMatchObject({
      name: 'Amina Customer',
      email: 'amina@example.test',
      date: '2030-01-03',
      time: '18:30',
      occasion: 'Birthday',
      packageId: 'package-123'
    });
  });

  it('shows the server validation error when the booking is rejected', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).endsWith('/api/availability')) return response(availableDates);
      if (String(url).endsWith('/api/menu-packages')) return response(packages);
      return response({ error: 'This date is already booked.' }, false, 409);
    });
    render(<BookingForm />);
    fillBooking();

    fireEvent.submit(screen.getByRole('button', { name: 'Reserve' }).closest('form'));

    expect(await screen.findByText('This date is already booked.')).toBeTruthy();
  });
});
