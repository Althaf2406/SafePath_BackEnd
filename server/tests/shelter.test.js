const request = require('supertest');
const app = require('../src/app');

describe('Shelter API', () => {
  it('should return all shelters successfully', async () => {
    const res = await request(app).get('/api/shelters');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        data: expect.any(Array),
      })
    );
  });

  it('should return nearby shelters', async () => {
    const res = await request(app).get('/api/shelters/nearby?lat=-7.2677&lng=112.7847&radiusKm=5');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('distanceKm');
    }
  });
});
