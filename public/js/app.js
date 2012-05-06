(function() {
  var col, colorPlotDimension, duration, height, leastSquares, margins, plotDimensions, rPlotDimension, width, xPlotDimension, y, yPlotDimension,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  leastSquares = function(x_vals, y_vals) {
    var a, b, count, i, linFn, rr, ssxx, ssxy, ssyy, xMean, xv, yMean, yv;
    count = x_vals.length;
    xMean = d3.mean(x_vals);
    yMean = d3.mean(y_vals);
    ssxx = d3.sum((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = x_vals.length; _i < _len; _i++) {
        xv = x_vals[_i];
        _results.push(xv * xv);
      }
      return _results;
    })()) - count * xMean * xMean;
    ssyy = d3.sum((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = x_vals.length; _i < _len; _i++) {
        yv = x_vals[_i];
        _results.push(yv * yv);
      }
      return _results;
    })()) - count * yMean * yMean;
    ssxy = d3.sum((function() {
      var _ref, _results;
      _results = [];
      for (i = 0, _ref = count - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
        _results.push(x_vals[i] * y_vals[i]);
      }
      return _results;
    })()) - count * xMean * yMean;
    b = ssxy / ssxx;
    a = yMean - b * xMean;
    linFn = function(x) {
      return a + b * x;
    };
    rr = (ssxy * ssxy) / (ssxx * ssyy);
    return {
      "fn": linFn,
      "m": b,
      "b": a,
      "rr": rr
    };
  };

  window.DataModel = (function(_super) {

    __extends(DataModel, _super);

    function DataModel() {
      DataModel.__super__.constructor.apply(this, arguments);
    }

    DataModel.prototype.replaceWithCSV = function(csv) {
      var columns, d, parseDat, row, splitData, trows;
      splitData = (function() {
        var _i, _len, _ref, _results;
        _ref = csv.split("\n");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          _results.push(row.split(","));
        }
        return _results;
      })();
      columns = splitData[0];
      parseDat = function(d) {
        if (isNaN(d)) {
          return d;
        } else {
          return parseFloat(d);
        }
      };
      trows = (function() {
        var _i, _len, _ref, _results;
        _ref = splitData.slice(1);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          _results.push((function() {
            var _j, _len2, _results2;
            _results2 = [];
            for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
              d = row[_j];
              _results2.push(parseDat(d));
            }
            return _results2;
          })());
        }
        return _results;
      })();
      return this.set({
        columns: columns,
        rows: trows
      });
    };

    DataModel.prototype.toCSV = function() {
      var colString, row, rowString, str;
      colString = this.get('columns').join();
      rowString = ((function() {
        var _i, _len, _ref, _results;
        _ref = this.get('rows');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          _results.push(row.join());
        }
        return _results;
      }).call(this)).join("\n");
      str = colString + "\n" + rowString;
      return str.trim();
    };

    DataModel.prototype.asKeyVals = function() {
      var cols;
      cols = this.get('columns');
      return _.map(this.get('rows'), function(row) {
        return _.reduce(_.zip(cols, row), function(memo, kv) {
          memo[kv[0]] = kv[1];
          return memo;
        }, {});
      });
    };

    DataModel.prototype.colIndex = function(col) {
      return _.indexOf(this.get('columns'), col);
    };

    DataModel.prototype.selectCol = function(col) {
      var index;
      index = this.colIndex(col);
      if (index === -1) return [];
      return _.map(this.get('rows'), function(row) {
        return row[index];
      });
    };

    DataModel.prototype.isColForcedCategory = function(col) {
      var filteredCol;
      filteredCol = _.filter(this.selectCol(col), function(d) {
        return typeof d !== 'number';
      });
      if (filteredCol.length > 0) {
        return true;
      } else {
        return false;
      }
    };

    return DataModel;

  })(Backbone.Model);

  window.PlotDimensionModel = (function(_super) {

    __extends(PlotDimensionModel, _super);

    function PlotDimensionModel() {
      this.updateCol = __bind(this.updateCol, this);
      PlotDimensionModel.__super__.constructor.apply(this, arguments);
    }

    PlotDimensionModel.prototype.initialize = function() {
      this.set('showData', true);
      this.updateCol();
      this.on('change:col', this.updateCol);
      this.get('data').on('change:rows', this.updateCol);
      return this.get('data').on('change:columns', function() {
        var cols;
        cols = this.get('data').get('columns');
        if (_.indexOf(cols, this.get('col')) === -1) {
          return this.set('col', cols[0]);
        }
      });
    };

    PlotDimensionModel.prototype.updateCol = function() {
      var isForcedCategory;
      isForcedCategory = this.get('data').isColForcedCategory(this.get('col'));
      return this.set({
        isCategory: isForcedCategory,
        isForcedCategory: isForcedCategory
      });
    };

    return PlotDimensionModel;

  })(Backbone.Model);

  window.PlotDimensions = (function(_super) {

    __extends(PlotDimensions, _super);

    function PlotDimensions() {
      PlotDimensions.__super__.constructor.apply(this, arguments);
    }

    PlotDimensions.prototype.model = PlotDimensionModel;

    return PlotDimensions;

  })(Backbone.Collection);

  margins = [60, 60, 20, 20];

  width = 460 - margins[1] - margins[3];

  height = 360 - margins[0] - margins[2];

  duration = 800;

  window.data = new DataModel({
    columns: ['X', 'Y', 'Color', 'Radius'],
    rows: (function() {
      var _results;
      _results = [];
      for (col = 1; col <= 100; col++) {
        _results.push((function() {
          var _results2;
          _results2 = [];
          for (y = 1; y <= 4; y++) {
            _results2.push(Math.floor(Math.random() * 200) - 100);
          }
          return _results2;
        })());
      }
      return _results;
    })()
  });

  xPlotDimension = new PlotDimensionModel({
    name: 'X Axis',
    col: 'X',
    data: data,
    scale: d3.scale.linear().range([margins[1], width]),
    transform: function(circleTransitions) {
      var dataCol, sc,
        _this = this;
      dataCol = data.selectCol(this.get('col'));
      sc = this.get('scale').domain([d3.min(dataCol), d3.max(dataCol)]);
      return circleTransitions.attr('cx', function(d) {
        return sc(d[_this.get('col')]);
      });
    }
  });

  yPlotDimension = new PlotDimensionModel({
    name: 'Y Axis',
    col: 'Y',
    data: data,
    scale: d3.scale.linear().range([height, margins[2]]),
    transform: function(circleTransitions) {
      var dataCol, sc,
        _this = this;
      dataCol = data.selectCol(this.get('col'));
      sc = this.get('scale').domain([d3.min(dataCol), d3.max(dataCol)]);
      return circleTransitions.attr('cy', function(d) {
        return sc(d[_this.get('col')]);
      });
    }
  });

  rPlotDimension = new PlotDimensionModel({
    name: 'Radius',
    col: 'Radius',
    data: data,
    scale: d3.scale.linear().range([5, 20]),
    transform: function(circleTransitions) {
      var dataCol, sc,
        _this = this;
      dataCol = data.selectCol(this.get('col'));
      sc = this.get('scale').domain([d3.min(dataCol), d3.max(dataCol)]);
      return circleTransitions.attr('r', function(d) {
        return sc(d[_this.get('col')]);
      });
    }
  });

  colorPlotDimension = new PlotDimensionModel({
    name: 'Color',
    col: 'Color',
    data: data,
    scale: d3.scale.linear().range([0, 180]),
    transform: function(circleTransitions) {
      var dataCol, numToHue, sc,
        _this = this;
      numToHue = function(n) {
        return d3.hsl((n + 180) % 360, 1, 0.5);
      };
      dataCol = data.selectCol(this.get('col'));
      sc = this.get('scale').domain([d3.min(dataCol), d3.max(dataCol)]);
      return circleTransitions.style('fill', function(d) {
        return numToHue(sc(d[_this.get('col')]));
      });
    }
  });

  plotDimensions = new PlotDimensions([xPlotDimension, yPlotDimension, rPlotDimension, colorPlotDimension]);

  window.PlotView = (function(_super) {

    __extends(PlotView, _super);

    function PlotView() {
      this.render = __bind(this.render, this);
      PlotView.__super__.constructor.apply(this, arguments);
    }

    PlotView.prototype.initialize = function() {
      this.collection.bind('change', this.render);
      this.model.bind('change', this.render);
      this.svg = d3.select(this.el).append('svg:svg').attr('width', width + margins[1] + margins[3]).attr('height', height + margins[0] + margins[2]).append('svg:g');
      this.xAxis = d3.svg.axis().tickSize(6, 3, 1).ticks(5).tickSubdivide(3);
      this.yAxis = d3.svg.axis().tickSize(6, 3, 1).ticks(5).tickSubdivide(3).orient("left");
      this.svg.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(this.xAxis);
      return this.svg.append("svg:g").attr("class", "y axis").attr("transform", "translate(" + margins[1] + ",0 )").call(this.yAxis);
    };

    PlotView.prototype.render = function() {
      var circleTransitions, circles, makeScale, svg, t, xDimScale, yDimScale,
        _this = this;
      svg = this.svg;
      circles = svg.selectAll('circle').data(this.model.asKeyVals());
      circles.enter().append('circle').attr('fill-opacity', 0.5).attr('stroke-width', 1).attr('stroke', '#000').attr('r', 20);
      circles.exit().transition().duration(800).remove();
      makeScale = function(dim) {
        var dataCol;
        dataCol = _this.model.selectCol(dim.get('col'));
        return dim.get('scale').domain([d3.min(dataCol), d3.max(dataCol)]);
      };
      xDimScale = makeScale(this.collection.find(function(dim) {
        return dim.get('name') === 'X Axis';
      }));
      this.xAxis.scale(xDimScale);
      yDimScale = makeScale(this.collection.find(function(dim) {
        return dim.get('name') === 'Y Axis';
      }));
      this.yAxis.scale(yDimScale);
      circleTransitions = circles.transition().duration(duration);
      this.collection.each(function(dim) {
        return dim.get('transform').bind(dim)(circleTransitions);
      });
      t = svg.transition().duration(duration);
      t.select(".x.axis").call(this.xAxis);
      t.select(".y.axis").call(this.yAxis);
      return this;
    };

    return PlotView;

  })(Backbone.View);

  window.PlotControlView = (function(_super) {

    __extends(PlotControlView, _super);

    function PlotControlView() {
      this.render = __bind(this.render, this);
      PlotControlView.__super__.constructor.apply(this, arguments);
    }

    PlotControlView.prototype.template = _.template($('#plot-control-template').html());

    PlotControlView.prototype.tagName = 'li';

    PlotControlView.prototype.events = {
      'change select': 'updateModelCol'
    };

    PlotControlView.prototype.updateModelCol = function() {
      return this.model.set('col', this.$('select').val());
    };

    PlotControlView.prototype.initialize = function() {
      this.model.bind('change', this.render);
      return this.options.dataModel.bind('change', this.render);
    };

    PlotControlView.prototype.render = function() {
      $(this.el).html(this.template({
        dimName: this.model.get('name'),
        colName: this.model.get('col'),
        showData: this.model.get('showData'),
        isCategory: this.model.get('isCategory'),
        isForcedCategory: this.model.get('isForcedCategory'),
        columns: this.options.dataModel.get('columns')
      }));
      return this;
    };

    return PlotControlView;

  })(Backbone.View);

  window.PlotControlsView = (function(_super) {

    __extends(PlotControlsView, _super);

    function PlotControlsView() {
      this.render = __bind(this.render, this);
      PlotControlsView.__super__.constructor.apply(this, arguments);
    }

    PlotControlsView.prototype.template = _.template($('#plot-controls-template').html());

    PlotControlsView.prototype.idName = 'select-list';

    PlotControlsView.prototype.tagName = 'ul';

    PlotControlsView.prototype.className = 'unstyled';

    PlotControlsView.prototype.initialize = function() {
      return this.collection.bind('reset', this.render);
    };

    PlotControlsView.prototype.render = function() {
      var _this = this;
      $(this.el).html(this.template);
      this.collection.each(function(dim) {
        var view;
        view = new PlotControlView({
          model: dim,
          dataModel: _this.model
        });
        return $(_this.el).append(view.render().el);
      });
      return this;
    };

    return PlotControlsView;

  })(Backbone.View);

  window.DataFormView = (function(_super) {

    __extends(DataFormView, _super);

    function DataFormView() {
      this.render = __bind(this.render, this);
      DataFormView.__super__.constructor.apply(this, arguments);
    }

    DataFormView.prototype.template = _.template($('#data-form-template').html());

    DataFormView.prototype.className = 'row-fluid';

    DataFormView.prototype.events = {
      'change #data-textarea': 'fillData',
      'click .submit': 'toTabular'
    };

    DataFormView.prototype.toTabular = function() {
      return App.navigate('tabular', true);
    };

    DataFormView.prototype.fillData = function() {
      return this.model.replaceWithCSV($('#data-textarea').val());
    };

    DataFormView.prototype.render = function() {
      $(this.el).html(this.template({
        csv: this.model.toCSV()
      }));
      return this;
    };

    return DataFormView;

  })(Backbone.View);

  window.DataTableView = (function(_super) {

    __extends(DataTableView, _super);

    function DataTableView() {
      this.render = __bind(this.render, this);
      DataTableView.__super__.constructor.apply(this, arguments);
    }

    DataTableView.prototype.template = _.template($('#data-table-template').html());

    DataTableView.prototype.tagName = 'table';

    DataTableView.prototype.className = 'table table-bordered table-striped .table-condensed';

    DataTableView.prototype.initialize = function() {
      return this.model.bind('change', this.render);
    };

    DataTableView.prototype.render = function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    };

    return DataTableView;

  })(Backbone.View);

  window.SandTrace = (function(_super) {

    __extends(SandTrace, _super);

    function SandTrace() {
      SandTrace.__super__.constructor.apply(this, arguments);
    }

    SandTrace.prototype.routes = {
      '': 'home'
    };

    SandTrace.prototype.initialize = function() {
      this.plotControls = new PlotControlsView({
        collection: plotDimensions,
        model: data
      });
      $('#plot-control-div').append(this.plotControls.render().el);
      this.plotView = new PlotView({
        collection: plotDimensions,
        model: data
      });
      $('#plot-div').append(this.plotView.render().el);
      this.dataFormView = new DataFormView({
        model: data
      });
      $('#form-div').append(this.dataFormView.render().el);
      this.dataTableView = new DataTableView({
        model: data
      });
      return $('#tabular-div').append(this.dataTableView.render().el);
    };

    SandTrace.prototype.home = function() {
      return null;
    };

    return SandTrace;

  })(Backbone.Router);

  $(function() {
    window.App = new SandTrace();
    return Backbone.history.start({
      pushState: true
    });
  });

}).call(this);
