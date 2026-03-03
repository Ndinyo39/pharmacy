/**
 * Backend Test Example - Authentication
 * Using Jest and Supertest
 * 
 * Run with: npm test
 */

const request = require('supertest');
const app = require('../server');

describe('Authentication API', () => {
  
  describe('POST /api/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          name: 'Test User',
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          role: 'pharmacist'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          name: 'Test User'
          // missing email and password
        });
      
      expect(response.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate${Date.now()}@example.com`;
      
      // First registration
      await request(app)
        .post('/api/register')
        .send({
          name: 'User One',
          email,
          password: 'password123'
        });
      
      // Duplicate registration
      const response = await request(app)
        .post('/api/register')
        .send({
          name: 'User Two',
          email,
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('exists');
    });
  });

  describe('POST /api/login', () => {
    let testUser = {
      name: 'Login Test User',
      email: `logintest${Date.now()}@example.com`,
      password: 'testpass123'
    };

    beforeAll(async () => {
      // Create test user
      await request(app)
        .post('/api/register')
        .send(testUser);
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
    });
  });
});

describe('Medicine API', () => {
  let authToken = '';

  beforeAll(async () => {
    // Login to get token (assuming test user exists)
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    
    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
    }
  });

  describe('GET /api/medicines', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/medicines');
      expect(response.status).toBe(401);
    });

    it('should return medicines with valid token', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token available');
        return;
      }
      
      const response = await request(app)
        .get('/api/medicines')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
