const { OrmQueryBuilder } = require('orm-query-builder');
const { spy } = require('sinon');

const expressFixtures = require('../spec/fixtures/express');
const locationFixtures = require('../spec/fixtures/location');
const { cleanDatabase, expect, setUp } = require('../spec/utils');
const Abstract = require('./abstract');
const Location = require('./location');

setUp();

describe('Abstract model', function() {
  describe('query builder', function() {

    let locations;
    beforeEach(async function() {
      await cleanDatabase();

      // All the following tests are meant to test the Abstract model, but it's difficult
      // to test it without an actual model and database table, so we use the Location model.
      // This assertion makes sure that it does indeed inherit from the Abstract model (in
      // case that changes in the future).
      expect(Location.prototype).to.be.an.instanceof(Abstract);

      locations = await Promise.all([
        locationFixtures.location({ name: 'Location A - Somewhere' }),
        locationFixtures.location({ name: 'Location C - Somewhere else' }),
        locationFixtures.location({ name: 'Location B - Wheeeeeeee' })
      ]);
    });

    // An ORM Query Builder plugin that adds an "ORDER BY name" clause to the query.
    const orderByName = {
      use: builder => builder.before('end', context => context.set('query', context.get('query').query(qb => qb.orderBy('name'))))
    };

    /**
     * Execute the specified query builder with a mock request and response,
     * using the specified request options (if any).
     *
     * @param {OrmQueryBuilder} queryBuilder - The query builder to execute.
     * @param {object} [options] - Mock request options.
     * @returns {object} An object with "mockRequest", "mockResponse" and "result" properties,
     *                   "result" being the query execution result.
     */
    async function execute(queryBuilder, requestOptions = {}) {
      const mockRequest = expressFixtures.req(requestOptions);
      const mockResponse = expressFixtures.res();
      const result = await queryBuilder.execute({ req: mockRequest, res: mockResponse });
      return { mockRequest, mockResponse, result };
    }

    it('should create a query builder from a model', async function() {

      const queryBuilder = Location.queryBuilder();
      expect(queryBuilder).to.be.an.instanceof(OrmQueryBuilder);

      const { mockResponse, result } = await execute(queryBuilder.use(orderByName));
      expect(result.pluck('name')).to.eql(locations.map(location => location.get('name')).sort());

      expect(mockResponse.set).to.have.callCount(0);
    });

    it('should create a paginated query builder from a model', async function() {

      const queryBuilder = Location.paginatedQueryBuilder();
      expect(queryBuilder).to.be.an.instanceof(OrmQueryBuilder);

      const { mockResponse, result } = await execute(queryBuilder.use(orderByName), { query: { offset: 1, limit: 1 } });
      expect(result.pluck('name')).to.eql([ locations[2].get('name') ]);

      expect(mockResponse.set).to.have.been.calledWithExactly('Pagination-Offset', 1);
      expect(mockResponse.set).to.have.been.calledWithExactly('Pagination-Limit', 1);
      expect(mockResponse.set).to.have.been.calledWithExactly('Pagination-Total', 3);
      expect(mockResponse.set).to.have.been.calledWithExactly('Pagination-Filtered-Total', 3);
      expect(mockResponse.set).to.have.callCount(4);
    });

    it('should create a query builder from a record', async function() {

      // The builder should inherit the base query set by the record.
      // Only location C should match in this case.
      const location = new Location().where('name', 'LIKE', '%else');
      const queryBuilder = location.queryBuilder();
      expect(queryBuilder).to.be.an.instanceof(OrmQueryBuilder);

      const { mockResponse, result } = await execute(queryBuilder.use(orderByName));
      expect(result.pluck('name')).to.eql([ locations[1].get('name') ]);

      expect(mockResponse.set).to.have.callCount(0);
    });

    it('should create a paginated query builder from a model', async function() {

      // The builder should inherit the base query set by the record.
      // Only locations A and C should match in this case.
      const location = new Location().where('name', 'LIKE', '%Somewhere%');
      const queryBuilder = location.paginatedQueryBuilder();
      expect(queryBuilder).to.be.an.instanceof(OrmQueryBuilder);

      // Only location C should be found with an offset of 1.
      const { mockResponse, result } = await execute(queryBuilder.use(orderByName), { query: { offset: 1, limit: 5 } });
      expect(result.pluck('name')).to.eql([ locations[1].get('name') ]);

      expect(mockResponse.set).to.have.been.calledWithExactly('Pagination-Offset', 1);
      expect(mockResponse.set).to.have.been.calledWithExactly('Pagination-Limit', 5);
      expect(mockResponse.set).to.have.been.calledWithExactly('Pagination-Total', 2);
      expect(mockResponse.set).to.have.been.calledWithExactly('Pagination-Filtered-Total', 2);
      expect(mockResponse.set).to.have.callCount(4);
    });
  });
});
