describe("Data Model", function () {
  beforeEach(function() {
    this.data = new DataModel({
      columns: ['a', 'b', 'c'],
      rows: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    });
  });

  describe("dimensions", function() {
    it("has the right num of cols", function() {
      expect(this.data.get('columns').length).toEqual(3);
    });
  });

  describe("data selection", function() {
    it("selects the first column index", function() {
      expect(this.data.colIndex('a')).toEqual(0);
    });
    it("selects the third column index", function() {
      expect(this.data.colIndex('c')).toEqual(2);
    });
    it("selects no column index", function() {
      expect(this.data.colIndex('e')).toEqual(-1);
    });

    it("selects the first column by col", function() {
      expect(this.data.selectCol('a')).toEqual([1, 4, 7]);
    });
    it("selects the third column by col", function() {
      expect(this.data.selectCol('c')).toEqual([3, 6, 9]);
    });
    it("selects no column by col", function() {
      expect(this.data.selectCol('e')).toEqual([]);
    });
  });

  describe("to key vals", function() {
    it("did it right to row1", function() {
      expect(this.data.asKeyVals()[0]).toEqual({a: 1, b: 2, c: 3})
    });
    it("did it right to row2", function() {
      expect(this.data.asKeyVals()[2]).toEqual({a: 7, b: 8, c: 9})
    });
  });
});

describe("Plot Dimensions", function() {
  beforeEach(function() {
    this.dim = new PlotDimensionModel({
      name: 'name',
      col: 'a'
    });
  });
});
