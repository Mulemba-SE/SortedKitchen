import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

const response = (data, ok = true) => ({ ok, json: async () => data });

describe('ForgotPassword form', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('submits the email and displays the server confirmation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      message: 'If an account with that email exists, a reset link will be sent.'
    }));
    vi.stubGlobal('fetch', fetchMock);
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'amina@example.test' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Send reset link' }).closest('form'));

    expect((await screen.findByRole('status')).textContent).toContain(
      'If an account with that email exists, a reset link will be sent.'
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/forgot-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'amina@example.test' })
      })
    );
  });

  it('displays API errors and allows another attempt', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ error: 'Please wait before retrying.' }, false))
      .mockResolvedValueOnce(response({ message: 'Reset request received.' })));
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'amina@example.test' } });

    fireEvent.submit(screen.getByRole('button', { name: 'Send reset link' }).closest('form'));
    expect((await screen.findByRole('alert')).textContent).toContain('Please wait before retrying.');

    fireEvent.submit(screen.getByRole('button', { name: 'Send reset link' }).closest('form'));
    expect((await screen.findByRole('status')).textContent).toContain('Reset request received.');
  });
});
