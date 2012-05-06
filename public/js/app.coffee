leastSquares = (x_vals, y_vals) ->
  count = x_vals.length
  xMean = d3.mean(x_vals)
  yMean = d3.mean(y_vals)

  ssxx = d3.sum((xv * xv for xv in x_vals)) - count * xMean * xMean
  ssyy = d3.sum((yv * yv for yv in x_vals)) - count * yMean * yMean
  ssxy = d3.sum((x_vals[i] * y_vals[i] for i in [0..count - 1])) -
    count * xMean * yMean

  b = ssxy / ssxx
  a = yMean - b*xMean
  linFn = (x) -> a + b*x

  rr = (ssxy*ssxy) / (ssxx * ssyy)

  {"fn": linFn, "m": b, "b": a, "rr": rr}


class window.DataModel extends Backbone.Model
  replaceWithCSV: (csv) ->
    splitData = (row.split "," for row in csv.split "\n")
    columns = splitData[0]
    trows = ((parseFloat(d) for d in row) for row in splitData[1..])
    @set {columns: columns, rows: trows}

  toCSV: () ->
    colString = @get('columns').join()
    rowString = (row.join() for row in @get('rows')).join("\n")
    str = colString + "\n" + rowString
    str.trim()

  asKeyVals: () ->
    cols = @get('columns')
    _.map(@get('rows'), (row) ->
      _.reduce(_.zip(cols, row), (memo, kv) ->
        memo[kv[0]] = kv[1]
        return memo
      , {})
    )

  colIndex: (col) ->
    _.indexOf( @get('columns'), col )

  selectCol: (col) ->
    index = @colIndex(col)
    return [] if index == -1
    _.map(@get('rows'), (row) -> row[index])



class window.PlotDimensionModel extends Backbone.Model
  initialize: () ->
    @get('data').bind('change:columns', () =>
      cols = @get('data').get('columns')
      @set('col', cols[0]) if _.indexOf(cols, @get('col')) == -1)


class window.PlotDimensions extends Backbone.Collection
  model: PlotDimensionModel

margins = [60, 60, 20, 20]
width   = 460 - margins[1] - margins[3]
height  = 360 - margins[0] - margins[2]
duration = 800

# Make the default collection
window.data = new DataModel
  columns: ['X', 'Y', 'Color', 'Radius']
  rows: ((Math.floor(Math.random()*200) - 100 for y in [1..4]) for col in [1..100])

xPlotDimension = new PlotDimensionModel
  name: 'X Axis'
  col: 'X'
  data: data
  scale: d3.scale.linear().range [margins[1], width]

  transform: (circleTransitions) ->
    dataCol = data.selectCol @get('col')
    sc = @get('scale').domain [d3.min(dataCol), d3.max(dataCol)]
    circleTransitions.attr('cx', (d) => sc( d[@get('col')] ))


yPlotDimension = new PlotDimensionModel
  name: 'Y Axis'
  col: 'Y'
  data: data
  scale: d3.scale.linear().range [height, margins[2]]

  transform: (circleTransitions) ->
    dataCol = data.selectCol @get('col')
    sc = @get('scale').domain [d3.min(dataCol), d3.max(dataCol)]
    circleTransitions.attr('cy', (d) => sc( d[@get('col')] ))

rPlotDimension = new PlotDimensionModel
  name: 'Radius'
  col: 'Radius'
  data: data
  scale: d3.scale.linear().range [5, 20]

  transform: (circleTransitions) ->
    dataCol = data.selectCol @get('col')
    sc = @get('scale').domain [d3.min(dataCol), d3.max(dataCol)]
    circleTransitions.attr('r', (d) => sc( d[@get('col')] ))

colorPlotDimension = new PlotDimensionModel
  name: 'Color'
  col: 'Color'
  data: data
  scale: d3.scale.linear().range [0, 180]

  transform: (circleTransitions) ->
    numToHue = (n) -> d3.hsl((n + 180) % 360, 1, 0.5)
    dataCol = data.selectCol @get('col')
    sc = @get('scale').domain [d3.min(dataCol), d3.max(dataCol)]
    circleTransitions.style('fill', (d) => numToHue( sc( d[@get('col')] ) ))

plotDimensions = new PlotDimensions [
  xPlotDimension
  yPlotDimension
  rPlotDimension
  colorPlotDimension
]

class window.PlotView extends Backbone.View
  initialize: () ->
    @collection.bind('change', @render)
    @model.bind('change', @render)

    @svg = d3.select(@el).append('svg:svg')
      .attr('width', width + margins[1] + margins[3])
      .attr('height', height + margins[0] + margins[2])
      .append('svg:g')

    @xAxis = d3.svg.axis()
      .tickSize(6, 3, 1)
      .ticks(5)
      .tickSubdivide(3)

    @yAxis = d3.svg.axis()
      .tickSize(6, 3, 1)
      .ticks(5)
      .tickSubdivide(3)
      .orient("left")

    @svg.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(@xAxis)

    @svg.append("svg:g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margins[1] + ",0 )")
      .call(@yAxis)


  render: () =>
    svg = @svg
    circles = svg.selectAll('circle')
      .data(@model.asKeyVals())

    circles
      .enter().append('circle')
      .attr('fill-opacity', 0.5)
      .attr('stroke-width', 1)
      .attr('stroke', '#000')
      .attr('r', 20)

    circles.exit()
    .transition().duration(800)
    .remove()


    makeScale = (dim) =>
      dataCol = @model.selectCol(dim.get('col'))
      dim.get('scale').domain [d3.min(dataCol), d3.max(dataCol)]

    xDimScale = makeScale(@collection.find((dim) -> dim.get('name') == 'X Axis'))
    @xAxis.scale(xDimScale)

    yDimScale = makeScale(@collection.find((dim) -> dim.get('name') == 'Y Axis'))
    @yAxis.scale(yDimScale)

    circleTransitions = circles.transition().duration(duration)
    @collection.each (dim) ->
      dim.get('transform').bind(dim) circleTransitions

    t = svg.transition().duration(duration)
    t.select(".x.axis").call(@xAxis)
    t.select(".y.axis").call(@yAxis)

    @


class window.PlotControlView extends Backbone.View
  template: _.template $('#plot-control-template').html()
  tagName: 'li'
  events: {'change select': 'updateModelCol'}

  updateModelCol: () ->
    @model.set('col', @$('select').val())

  initialize: () ->
    @model.bind('change', @render)
    @options.dataModel.bind('change', @render)

  render: () =>
    $(@el).html @template
      dimName: @model.get('name')
      colName: @model.get('col')
      columns: @options.dataModel.get('columns')

    @

class window.PlotControlsView extends Backbone.View
  template: _.template $('#plot-controls-template').html()
  idName: 'select-list'
  tagName: 'ul'
  className: 'unstyled'

  initialize: () ->
    @collection.bind('reset', @render)

  render: () =>
    $(@el).html @template

    @collection.each (dim) =>
      view = new PlotControlView
        model: dim
        dataModel: @model
      $(@el).append(view.render().el)

    @

class window.DataFormView extends Backbone.View
  template: _.template $('#data-form-template').html()
  className: 'row-fluid'

  events:
    'change #data-textarea': 'fillData'
    'click .submit': 'toTabular'

  toTabular: () ->
    App.navigate('tabular', true)

  fillData: () ->
    @model.replaceWithCSV $('#data-textarea').val()

  render: () =>
    $(@el).html @template({csv: @model.toCSV()})
    return this


class window.DataTableView extends Backbone.View
  template: _.template $('#data-table-template').html()
  tagName: 'table'
  className: 'table table-bordered table-striped .table-condensed'

  initialize: () ->
    @model.bind('change', @render)

  render: () =>
    $(@el).html(@template(@model.toJSON()))
    return this

class window.SandTrace extends Backbone.Router
  routes:
    '': 'home'

  initialize: () ->
    @plotControls = new PlotControlsView
      collection: plotDimensions
      model: data
    $('#plot-control-div').append @plotControls.render().el

    @plotView = new PlotView
      collection: plotDimensions
      model: data
    $('#plot-div').append @plotView.render().el

    @dataFormView = new DataFormView {model: data}
    $('#form-div').append @dataFormView.render().el

    @dataTableView = new DataTableView {model: data}
    $('#tabular-div').append @dataTableView.render().el

  home: () ->
    return null

$ () ->
  window.App = new SandTrace()
  Backbone.history.start( {pushState: true} )
