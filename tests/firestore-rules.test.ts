import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Mathematical model of the proposed zero-trust Firestore Security Rules:
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /{document=**} {
 *       allow read, write: if false;
 *     }
 *     match /orders/{orderId} {
 *       allow get: if isOwner() || isCustomerOwner();
 *       allow list: if isOwner() || (isVerified() && resource.data.email == request.auth.token.email);
 *       allow write: if isOwner();
 *     }
 *   }
 * }
 */
interface SecurityContext {
  auth: {
    uid: string;
    token: {
      email?: string;
      email_verified?: boolean;
    };
  } | null;
  resource?: {
    data: {
      email?: string;
      [key: string]: any;
    };
  };
  request?: {
    resource?: {
      data: {
        email?: string;
        [key: string]: any;
      };
    };
  };
  method: 'get' | 'list' | 'create' | 'update' | 'delete';
}

const STORE_OWNER_EMAIL = 'nazneenrizvi1711@gmail.com';

function evaluateFirestoreOrderRule(ctx: SecurityContext): { allowed: boolean; reason: string } {
  const isSignedIn = ctx.auth !== null && typeof ctx.auth.uid === 'string';
  if (!isSignedIn) {
    return { allowed: false, reason: 'PERMISSION_DENIED: Unauthenticated request (Missing Firebase ID token)' };
  }

  const isVerified = Boolean(ctx.auth?.token.email_verified === true);
  const userEmail = (ctx.auth?.token.email || '').toLowerCase().trim();
  const isOwner = isVerified && userEmail === STORE_OWNER_EMAIL.toLowerCase().trim();

  if (ctx.method === 'get') {
    const resourceEmail = (ctx.resource?.data.email || '').toLowerCase().trim();
    const isCustomerOwner = isVerified && resourceEmail === userEmail;
    if (isOwner || isCustomerOwner) {
      return { allowed: true, reason: 'ALLOWED: Verified identity owns resource or is store owner' };
    }
    return { allowed: false, reason: 'PERMISSION_DENIED: User cannot read orders belonging to other customers' };
  }

  if (ctx.method === 'list') {
    if (isOwner) {
      return { allowed: true, reason: 'ALLOWED: Store owner can list all customer orders' };
    }
    const resourceEmail = (ctx.resource?.data.email || '').toLowerCase().trim();
    if (isVerified && resourceEmail === userEmail) {
      return { allowed: true, reason: 'ALLOWED: Customer can query their own orders' };
    }
    return { allowed: false, reason: 'PERMISSION_DENIED: Cannot query unauthorized orders' };
  }

  if (ctx.method === 'create' || ctx.method === 'update' || ctx.method === 'delete') {
    if (isOwner) {
      return { allowed: true, reason: 'ALLOWED: Store owner administrative mutation' };
    }
    return { allowed: false, reason: 'PERMISSION_DENIED: Direct client writes denied. All order mutations must route through trusted backend' };
  }

  return { allowed: false, reason: 'PERMISSION_DENIED: Default deny catch-all' };
}

test('Firestore Security Rules: Anonymous user attempting to read order is blocked (HTTP 403 equivalent)', () => {
  const result = evaluateFirestoreOrderRule({
    auth: null,
    resource: { data: { email: 'customer@example.com' } },
    method: 'get'
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /PERMISSION_DENIED/);
});

test('Firestore Security Rules: Public REST API key without auth token is blocked (HTTP 403 equivalent)', () => {
  // Even if key=AIza... is in the URL, if auth is null, rules reject it
  const result = evaluateFirestoreOrderRule({
    auth: null,
    resource: { data: { email: 'customer@example.com' } },
    method: 'get'
  });
  assert.equal(result.allowed, false);
});

test('Firestore Security Rules: Customer A attempting to read Customer B order is strictly blocked', () => {
  const result = evaluateFirestoreOrderRule({
    auth: {
      uid: 'user-a-123',
      token: { email: 'customerA@example.com', email_verified: true }
    },
    resource: {
      data: { id: 'ICON-002', email: 'customerB@example.com' }
    },
    method: 'get'
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /PERMISSION_DENIED/);
});

test('Firestore Security Rules: Authenticated customer reading their own verified order is permitted', () => {
  const result = evaluateFirestoreOrderRule({
    auth: {
      uid: 'user-a-123',
      token: { email: 'customerA@example.com', email_verified: true }
    },
    resource: {
      data: { id: 'ICON-001', email: 'customerA@example.com' }
    },
    method: 'get'
  });
  assert.equal(result.allowed, true);
});

test('Firestore Security Rules: Unauthorized user attempting to modify or delete is blocked', () => {
  const updateResult = evaluateFirestoreOrderRule({
    auth: {
      uid: 'hacker-999',
      token: { email: 'hacker@example.com', email_verified: true }
    },
    method: 'update'
  });
  assert.equal(updateResult.allowed, false);

  const deleteResult = evaluateFirestoreOrderRule({
    auth: {
      uid: 'hacker-999',
      token: { email: 'hacker@example.com', email_verified: true }
    },
    method: 'delete'
  });
  assert.equal(deleteResult.allowed, false);
});

test('Firestore Security Rules: Email spoofing prevention (unverified email claiming to be admin is rejected)', () => {
  const spoofResult = evaluateFirestoreOrderRule({
    auth: {
      uid: 'attacker-fake-admin',
      token: { email: STORE_OWNER_EMAIL, email_verified: false } // Attacker has unverified email
    },
    method: 'delete'
  });
  assert.equal(spoofResult.allowed, false, 'Unverified email MUST NEVER receive admin privileges');
});

test('Firestore Security Rules: Verified Store Owner can read and manage all orders', () => {
  const adminGet = evaluateFirestoreOrderRule({
    auth: {
      uid: 'admin-owner-uid',
      token: { email: STORE_OWNER_EMAIL, email_verified: true }
    },
    resource: { data: { email: 'randomcustomer@example.com' } },
    method: 'get'
  });
  assert.equal(adminGet.allowed, true);

  const adminDelete = evaluateFirestoreOrderRule({
    auth: {
      uid: 'admin-owner-uid',
      token: { email: STORE_OWNER_EMAIL, email_verified: true }
    },
    method: 'delete'
  });
  assert.equal(adminDelete.allowed, true);
});
