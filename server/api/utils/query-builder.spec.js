const { stub } = require('sinon');

const Abstract = require('../../models/abstract');
const expressFixtures = require('../../spec/fixtures/express');
const { expect } = require('../../spec/utils');
const { filter: filterFactory, queryBuilder: queryBuilderFactory } = require('./query-builder');

describe('Query builder utilities', function() {
  describe('filter', function() {
    it('should modify a query using a value and filter functions', async function() {

      const Model = Abstract.extend({});

      const mockQuery = new Model(); // The base query.
      const updatedQuery = mockQuery.clone().where('foo', 'bar'); // The updated query.

      const valueFunc = stub().returns(42); // The value function that retrieves the value that will be used by the filter function.
      const filterFunc = stub().returns(updatedQuery); // The filter function.
      const filter = filterFactory(valueFunc, filterFunc);

      const mockContext = {
        get: stub().returns(mockQuery),
        set: stub()
      };

      await expect(filter(mockContext)).to.eventually.equal(undefined);

      expect(valueFunc).to.have.been.calledWithExactly(mockContext);
      expect(valueFunc).to.have.callCount(1);
      expect(mockContext.get).to.have.been.calledWithExactly('query');
      expect(mockContext.get).to.have.been.calledImmediatelyAfter(valueFunc);
      expect(mockContext.get).to.have.callCount(1);
      expect(filterFunc).to.have.been.calledWithExactly(mockQuery, 42, mockContext);
      expect(filterFunc).to.have.been.calledImmediatelyAfter(mockContext.get);
      expect(filterFunc).to.have.callCount(1);
      expect(mockContext.set).to.have.been.calledWithExactly('query', updatedQuery); // Make sure the query was updated.
      expect(mockContext.set).to.have.been.calledImmediatelyAfter(filterFunc);
      expect(mockContext.set).to.have.callCount(1);
    });

    it('should not call the filter function or modify the query if the value function returns undefined', async function() {

      const valueFunc = stub(); // Returns undefined.
      const filterFunc = stub(); // Will not be called.
      const filter = filterFactory(valueFunc, filterFunc);

      const mockQuery = {};
      const mockContext = {
        get: stub().returns(mockQuery),
        set: stub()
      };

      await expect(filter(mockContext)).to.eventually.equal(undefined);

      expect(valueFunc).to.have.been.calledWithExactly(mockContext);
      expect(valueFunc).to.have.callCount(1);
      expect(mockContext.get).to.have.callCount(0);
      expect(filterFunc).to.have.callCount(0); // Make sure the filter function was not called.
      expect(mockContext.set).to.have.callCount(0); // Make sure the query was not modified.
    });

    it('should check that the provided filter function returns a result', async function() {

      const valueFunc = stub().returns(42);
      const filterFunc = stub(); // Will be called but returns no result.
      const filter = filterFactory(valueFunc, filterFunc);

      const mockQuery = {};
      const mockContext = {
        get: stub().returns(mockQuery),
        set: stub()
      };

      await expect(filter(mockContext)).to.eventually.be.rejectedWith('The filter function returned a falsy result');

      expect(valueFunc).to.have.been.calledWithExactly(mockContext);
      expect(valueFunc).to.have.callCount(1);
      expect(mockContext.get).to.have.been.calledWithExactly('query');
      expect(mockContext.get).to.have.been.calledImmediatelyAfter(valueFunc);
      expect(mockContext.get).to.have.callCount(1);
      expect(filterFunc).to.have.been.calledWithExactly(mockQuery, 42, mockContext);
      expect(filterFunc).to.have.been.calledImmediatelyAfter(mockContext.get);
      expect(filterFunc).to.have.callCount(1);
      expect(mockContext.set).to.have.callCount(0); // Make sure the query was not modified.
    });

    it('should check that the provided filter function returns a valid query', async function() {

      const valueFunc = stub().returns(42);
      const filterFunc = stub().returns('foo'); // Returns something that is not a query.
      const filter = filterFactory(valueFunc, filterFunc);

      const mockQuery = {};
      const mockContext = {
        get: stub().returns(mockQuery),
        set: stub()
      };

      await expect(filter(mockContext)).to.eventually.be.rejectedWith('The modified query is not of the same type');

      expect(valueFunc).to.have.been.calledWithExactly(mockContext);
      expect(valueFunc).to.have.callCount(1);
      expect(mockContext.get).to.have.been.calledWithExactly('query');
      expect(mockContext.get).to.have.been.calledImmediatelyAfter(valueFunc);
      expect(mockContext.get).to.have.callCount(1);
      expect(filterFunc).to.have.been.calledWithExactly(mockQuery, 42, mockContext);
      expect(filterFunc).to.have.been.calledImmediatelyAfter(mockContext.get);
      expect(filterFunc).to.have.callCount(1);
      expect(mockContext.set).to.have.callCount(0); // Make sure the query was not modified.
    });

    it('should check that the provided filter function returns a query of the same type', async function() {

      // Prepare two different models.
      const FirstModel = Abstract.extend({});
      const SecondModel = Abstract.extend({});

      const valueFunc = stub().returns(42);
      const filterFunc = stub().returns(new SecondModel()); // Return a query that is not of the same model as the base query.
      const filter = filterFactory(valueFunc, filterFunc);

      const mockQuery = new FirstModel(); // The base query.
      const mockContext = {
        get: stub().returns(mockQuery),
        set: stub()
      };

      await expect(filter(mockContext)).to.eventually.be.rejectedWith('The modified query is not of the same type');

      expect(valueFunc).to.have.been.calledWithExactly(mockContext);
      expect(valueFunc).to.have.callCount(1);
      expect(mockContext.get).to.have.been.calledWithExactly('query');
      expect(mockContext.get).to.have.been.calledImmediatelyAfter(valueFunc);
      expect(mockContext.get).to.have.callCount(1);
      expect(filterFunc).to.have.been.calledWithExactly(mockQuery, 42, mockContext);
      expect(filterFunc).to.have.been.calledImmediatelyAfter(mockContext.get);
      expect(filterFunc).to.have.callCount(1);
      expect(mockContext.set).to.have.callCount(0); // Make sure the query was not modified.
    });
  });

  describe('queryBuilder', function() {
    it('should return a query builder that requires the "req" option when executed', async function() {
      const queryBuilder = queryBuilderFactory();
      await expect(queryBuilder.execute()).to.eventually.be.rejectedWith('The Express request must be passed to the query builder as the "req" option at construction or execution');
    });

    it('should return a query builder that requires the "req" option to be an Express request when executed', async function() {
      const queryBuilder = queryBuilderFactory();
      const options = { req: {} };
      await expect(queryBuilder.execute(options)).to.eventually.be.rejectedWith('The "req" option passed to the query builder does not appear to be an Express request object');
    });

    it('should return a query builder that requires the "req" option when executed', async function() {
      const queryBuilder = queryBuilderFactory();
      const options = { req: expressFixtures.req() };
      await expect(queryBuilder.execute(options)).to.eventually.be.rejectedWith('The Express response must be passed to the query builder as the "res" option at construction or execution');
    });

    it('should return a query builder that requires the "req" option to be an Express request when executed', async function() {
      const queryBuilder = queryBuilderFactory();
      const options = { req: expressFixtures.req(), res: {} };
      await expect(queryBuilder.execute(options)).to.eventually.be.rejectedWith('The "res" option passed to the query builder does not appear to be an Express response object');
    });
  });
});
