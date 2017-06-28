document.addEventListener('DOMContentLoaded', contentLoadedCb)

function contentLoadedCb(req) {
  const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'
  req = new XMLHttpRequest()
  req.open('GET', url, true)
  req.send()
  req.onload = function () {
    json = JSON.parse(req.responseText)
    chartIt(json)
  }
}

function chartIt(json) {
  const dataset = json.monthlyVariance
  const baseTemperature = json.baseTemperature
  const years = dataset.map(obj => new Date(obj.year, 0, 1))

  const w = 800
  const h = 400
  const padding = 60

  const xScale = d3.scaleTime()
    .domain(d3.extent(years))
    .range([padding, w - (padding / 2)])

  const yScale = d3.scaleBand()
    .domain(Array(12).fill().map((e, i) => i))
    .rangeRound([padding, h - padding])

  const variance = dataset.map(obj => obj.variance)
  const minTemp = baseTemperature + d3.min(variance)
  const maxTemp = baseTemperature + d3.max(variance)

  const tempColors = ['#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd'].reverse() // http://colorbrewer2.org/#type=diverging&scheme=Spectral&n=9

  const getTempThresholdDomain = function (min, max, rangeLength) {
    const domain = []
    const step = (max - min) / rangeLength
    const start = min + step
    var i = start
    while (i < max) {
      domain.push(i)
      i += step
    }
    return domain
  }

  const tempThresholdDomain = getTempThresholdDomain(minTemp, maxTemp, tempColors.length)

  const colorScale = d3.scaleThreshold()
    .domain(tempThresholdDomain)
    .range(tempColors)

  const svg = d3.select('div#container')
    .append('svg')
    .attr('preserveAspectRation', 'xMinYMin meet')
    .attr('viewBox', '0 0 ' + w + ' ' + h)

  const tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .attr('id', 'tooltip')

  const onMouseOverCB = (d, i) => {
    tooltip.text(d.year)
    tooltip.attr('data-year', d.year)
    return tooltip.style('visibility', 'visible')
  }

  svg.selectAll('.cell')
    .data(dataset)
    .enter().append('rect')
    .attr('width', 3)
    .attr('height', 23)
    .attr('x', (d, i) => xScale(years[i]))
    .attr('y', d => yScale(d.month - 1))
    .attr('class', 'cell')
    .attr('data-month', d => d.month - 1)
    .attr('data-year', d => d.year)
    .attr('data-temp', d => baseTemperature + d.variance)
    .attr('fill', d => colorScale(baseTemperature + +d.variance))
    .on('mouseover', onMouseOverCB)
    .on('mousemove', function () { return tooltip.style('top', (d3.event.pageY - 10) + 'px').style('left', (d3.event.pageX + 10) + 'px') })
    .on('mouseout', function () { return tooltip.style('visibility', 'hidden') })

  const info = svg.append('g')
    .attr('transform', 'translate(' + (w / 2) + ',' + padding / 2 + ')')
    .style('text-anchor', 'middle')

  const title = info.append('text')
    .text('Monthly Global Land-Surface Temperature')
    .attr('id', 'title')

  const description = info.append('text')
    .text(d3.min(years, d => d.getFullYear()) + ' - ' + d3.max(years, d => d.getFullYear()) + ': base temperature ' + baseTemperature + '°C')
    .attr('id', 'description')
    .attr('dy', '1.5em')
    .attr('font-size', 'small')

  const xAxis = d3.axisBottom(xScale)

  svg.append('g')
    .attr('transform', 'translate(0,' + (h - padding) + ')')
    .call(xAxis)
    .attr('id', 'x-axis')

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(monthNum => {
      const date = new Date(0)
      date.setUTCMonth(monthNum)
      return d3.utcFormat('%B')(date)
    })
    .tickSizeOuter(0)

  svg.append('g')
    .attr('transform', 'translate(' + padding + ',0)')
    .call(yAxis)
    .attr('id', 'y-axis')

  // This is basically verbatim from https://bl.ocks.org/mbostock/4573883

  const legend = svg.append('g')
    .attr('transform', 'translate(' + (padding * 2) + ',' + (h - (padding / 2)) + ')')
    .attr('id', 'legend')

  const legendScale = d3.scaleLinear()
    .domain([minTemp, maxTemp])
    .range([0, 240])

  const legendAxis = d3.axisBottom(legendScale)
    .tickValues(tempThresholdDomain)
    .tickFormat(d3.format(".1f"))
    .tickSize(13)

  const g = legend.append('g').call(legendAxis)

  g.select('.domain')
    .remove()

  g.selectAll('rect')
    .data(colorScale.range().map(function (color) {
      const d = colorScale.invertExtent(color)
      if (d[0] == null) d[0] = legendScale.domain()[0]
      if (d[1] == null) d[1] = legendScale.domain()[1]
      return d
    }))
    .enter().insert('rect', '.tick')
    .attr('height', 13)
    .attr('x', d => legendScale(d[0]))
    .attr('width', d => legendScale(d[1]) - legendScale(d[0]))
    .attr('fill', d => colorScale(d[0]))

}