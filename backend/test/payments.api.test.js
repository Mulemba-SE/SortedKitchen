process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'automated-test-secret';
process.env.MPESA_ENV = 'sandbox';
process.env.MPESA_CONSUMER_KEY = 'test-consumer-key';
process.env.MPESA_CONSUMER_SECRET = 'test-consumer-secret';
process.env.MPESA_SHORTCODE = '174379';
process.env.MPESA_PASSKEY = 'test-passkey';
process.env.MPESA_CALLBACK_URL = 'https://example.test/api/payments/mpesa/callback';
process.env.MPESA_DEPOSIT_PERCENTAGE = '30';

const http = require('node:http');
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../server');
const { Booking, MpesaPayment } = app.locals.testModels;

let server;
let apiBaseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  apiBaseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

const tokenFor = (role, userId = new mongoose.Types.ObjectId().toString()) => jwt.sign({
  userId,
  email: `${role}@example.test`,
  role
}, process.env.JWT_SECRET);

const request = (method, path, { token, body } = {}) => new Promise((resolve, reject) => {
  const payload = body === undefined ? null : JSON.stringify(body);
  const req = http.request(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
    }
  }, (response) => {
    let responseBody = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => { responseBody += chunk; });
    response.on('end', () => {
      let parsed;
      try {
        parsed = responseBody ? JSON.parse(responseBody) : null;
      } catch (error) {
        reject(error);
        return;
      }
      resolve({ status: response.statusCode, body: parsed });
    });
  });
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

test('admin booking API rejects anonymous and non-admin requests', async (context) => {
  const anonymous = await request('GET', '/api/bookings');
  assert.equal(anonymous.status, 401);

  const customer = await request('GET', '/api/bookings', { token: tokenFor('customer') });
  assert.equal(customer.status, 403);

  const bookingQuery = context.mock.method(Booking, 'find', () => ({
    sort: () => ({ lean: async () => [] })
  }));
  const paymentQuery = context.mock.method(MpesaPayment, 'find', () => ({
    sort: () => ({ lean: async () => [] })
  }));
  const admin = await request('GET', '/api/bookings', { token: tokenFor('admin') });

  assert.equal(admin.status, 200);
  assert.deepEqual(admin.body, []);
  assert.equal(bookingQuery.mock.callCount(), 1);
  assert.equal(paymentQuery.mock.callCount(), 1);
});

test('customer payment endpoint validates auth, booking ID, and ownership', async (context) => {
  const path = '/api/my-bookings/not-an-id/payments/mpesa/stk-push';
  const anonymous = await request('POST', path, { body: { phone: '0712345678' } });
  assert.equal(anonymous.status, 401);

  const invalidId = await request('POST', path, {
    token: tokenFor('customer'),
    body: { phone: '0712345678' }
  });
  assert.equal(invalidId.status, 400);

  const bookingId = new mongoose.Types.ObjectId();
  context.mock.method(Booking, 'findOne', async () => null);
  const missingBooking = await request('POST', `/api/my-bookings/${bookingId}/payments/mpesa/stk-push`, {
    token: tokenFor('customer'),
    body: { phone: '0712345678' }
  });
  assert.equal(missingBooking.status, 404);
});

test('customer bookings include their deposit and safe payment status only', async (context) => {
  const customerId = new mongoose.Types.ObjectId();
  const booking = {
    _id: new mongoose.Types.ObjectId(),
    userId: customerId,
    status: 'approved',
    approvedBy: 'admin@example.test',
    date: '2030-02-10',
    selectedPackage: {
      packageId: 'package-1',
      name: 'Dinner',
      currency: 'KES',
      pricePerGuest: 1000,
      guestCount: 5,
      totalPrice: 5000
    }
  };
  const payment = {
    _id: new mongoose.Types.ObjectId(),
    bookingId: booking._id,
    checkoutRequestId: 'provider-internal-id',
    amount: 1500,
    currency: 'KES',
    phone: '254712345678',
    status: 'completed',
    mpesaReceiptNumber: 'QWE1234567',
    createdAt: new Date('2030-01-01T00:00:00Z'),
    updatedAt: new Date('2030-01-01T00:01:00Z')
  };
  context.mock.method(Booking, 'find', (query) => {
    assert.equal(String(query.userId), String(customerId));
    return { sort: () => ({ lean: async () => [booking] }) };
  });
  context.mock.method(MpesaPayment, 'find', (query) => {
    assert.ok(query.bookingId.$in.some((id) => String(id) === String(booking._id)));
    return { sort: () => ({ lean: async () => [payment] }) };
  });

  const response = await request('GET', '/api/my-bookings', { token: tokenFor('customer', String(customerId)) });

  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].mpesaPayment.amount, 1500);
  assert.equal(response.body[0].mpesaPayment.percentage, 30);
  assert.equal(response.body[0].mpesaPayment.payments[0].mpesaReceiptNumber, 'QWE1234567');
  assert.equal(response.body[0].mpesaPayment.payments[0].checkoutRequestId, undefined);
  assert.equal(response.body[0].approvedBy, undefined);
});

test('STK push computes the KES deposit server-side and callback completes it once', async (context) => {
  const customerId = new mongoose.Types.ObjectId();
  const booking = {
    _id: new mongoose.Types.ObjectId(),
    userId: customerId,
    status: 'approved',
    selectedPackage: { currency: 'KES', totalPrice: 10001 }
  };
  let paymentRecord;
  let stkRequest;
  context.mock.method(Booking, 'findOne', async (query) => {
    assert.equal(String(query._id), String(booking._id));
    assert.equal(String(query.userId), String(customerId));
    return booking;
  });
  context.mock.method(MpesaPayment, 'findOne', () => ({
    sort: async () => paymentRecord || null,
    then(resolve, reject) {
      return Promise.resolve(paymentRecord || null).then(resolve, reject);
    }
  }));
  context.mock.method(MpesaPayment.prototype, 'save', async function savePayment() {
    paymentRecord = this;
    return this;
  });
  context.mock.method(MpesaPayment, 'updateOne', async (filter, update) => {
    if (filter.status !== 'pending' || paymentRecord.status !== 'pending') {
      return { modifiedCount: 0 };
    }
    Object.assign(paymentRecord, update.$set);
    return { modifiedCount: 1 };
  });
  context.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    if (String(url).includes('/oauth/')) {
      return { ok: true, json: async () => ({ access_token: 'sandbox-access-token' }) };
    }
    stkRequest = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        ResponseCode: '0',
        CheckoutRequestID: 'ws_CO_test_123456',
        MerchantRequestID: 'merchant-test',
        CustomerMessage: 'Prompt sent'
      })
    };
  });

  const response = await request('POST', `/api/my-bookings/${booking._id}/payments/mpesa/stk-push`, {
    token: tokenFor('customer', String(customerId)),
    body: { phone: '+254 712 345 678', amount: 1 }
  });

  assert.equal(response.status, 202);
  assert.equal(response.body.payment.amount, 3001);
  assert.equal(response.body.payment.phone, '254712345678');
  assert.equal(paymentRecord.depositPercentage, 30);
  assert.equal(stkRequest.body.Amount, 3001);
  assert.equal(stkRequest.body.PhoneNumber, '254712345678');
  assert.equal(stkRequest.body.CallBackURL, process.env.MPESA_CALLBACK_URL);
  assert.equal(stkRequest.options.headers.Authorization, 'Bearer sandbox-access-token');

  const callbackBody = {
    Body: {
      stkCallback: {
        CheckoutRequestID: 'ws_CO_test_123456',
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 3001 },
            { Name: 'MpesaReceiptNumber', Value: 'QWE1234567' },
            { Name: 'PhoneNumber', Value: 254712345678 }
          ]
        }
      }
    }
  };
  const callback = await request('POST', '/api/payments/mpesa/callback', { body: callbackBody });
  assert.equal(callback.status, 200);
  assert.equal(paymentRecord.status, 'completed');
  assert.equal(paymentRecord.mpesaReceiptNumber, 'QWE1234567');

  const duplicate = await request('POST', '/api/payments/mpesa/callback', { body: callbackBody });
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.body.result, 'Callback already processed');
});

test('callback success with mismatched payment metadata is marked for review', async (context) => {
  const paymentRecord = {
    _id: new mongoose.Types.ObjectId(),
    status: 'pending',
    amount: 3000,
    phone: '254712345678',
    checkoutRequestId: 'ws_CO_mismatch'
  };
  context.mock.method(MpesaPayment, 'findOne', () => ({
    then(resolve, reject) {
      return Promise.resolve(paymentRecord).then(resolve, reject);
    }
  }));
  context.mock.method(MpesaPayment, 'updateOne', async (filter, update) => {
    Object.assign(paymentRecord, update.$set);
    return { modifiedCount: 1 };
  });

  const response = await request('POST', '/api/payments/mpesa/callback', {
    body: {
      Body: {
        stkCallback: {
          CheckoutRequestID: paymentRecord.checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'Processed',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 3001 },
              { Name: 'MpesaReceiptNumber', Value: 'QWE1234567' },
              { Name: 'PhoneNumber', Value: 254712345678 }
            ]
          }
        }
      }
    }
  });

  assert.equal(response.status, 200);
  assert.equal(paymentRecord.status, 'review');
  assert.equal(paymentRecord.mpesaReceiptNumber, undefined);
  assert.match(paymentRecord.resultDescription, /could not be verified/i);
});
