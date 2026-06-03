const request = require('supertest');
const app = require('../src/app');

describe('Disaster Alert API', () => {
  it('should return 200 for nearby disaster alerts', async () => {
    // In a real environment, we should mock the BMKG service
    const res = await request(app).get('/api/disaster-alert/nearby?lat=-7.2677&lng=112.7847&radiusKm=100');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        data: expect.any(Array),
      })
    );
  });
});
