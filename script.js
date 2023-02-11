window.onload = function () {
  // #region Global constants
  const PRECISION_DURATION = 3;
  const PRECISION_PERCENTAGE = 2;
  const COLOR_WHITE = '#ffffff';
  const COLOR_GREY = '#555555';
  const COLOR_BLACK = '#000000';
  // #endregion Global constants

  // #region Sample data
  // The severities and their info
  const severities = [
    {
      code: 'disaster',
      name: 'Disaster',
      color: '#a90300'
    },
    {
      code: 'high',
      name: 'High',
      color: '#ce4400'
    },
    {
      code: 'average',
      name: 'Average',
      color: '#f16a09'
    },
    {
      code: 'warning',
      name: 'Warning',
      color: '#fdcf0a'
    },
    {
      code: 'info',
      name: 'Info',
      color: '#73aefa'
    },
    {
      code: 'error',
      name: 'Error',
      color: '#b441e0'
    },
    {
      code: 'not_classified',
      name: 'Not classified',
      color: '#d4d4d4'
    }
  ];

  // Data of events received from backend
  const events = [
    { id: 1, severity: 'disaster', duration: 332 },
    { id: 2, severity: 'warning', duration: 32 },
    { id: 3, severity: 'average', duration: 42 },
    { id: 4, severity: 'error', duration: 123 },
    { id: 5, severity: 'warning', duration: 12 },
    { id: 6, severity: 'info', duration: 89 }
  ];
  // #endregion Sample data

  // #region Utility functions - universal
  /**
   * Returns sum that is calculated by property from array of objects
   * @param {array} arr The array of objects
   * @param {string} prop The property name in objects
   * @returns {number} The sum of property values
   */
  function getObjectPropValueSum(arr, prop) {
    return Object.keys(arr)
      ?.map((e) => arr[e]?.[prop])
      ?.reduce((a, b) => a + b, 0);
  }

  function drawLine(
    ctx,
    startX,
    startY,
    endX,
    endY,
    color
  ) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  }

  function drawBar(
    ctx,
    upperLeftCornerX,
    upperLeftCornerY,
    width,
    height,
    color
  ) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(upperLeftCornerX, upperLeftCornerY, width, height);
    ctx.restore();
  }

  function drawArc(
    ctx,
    centerX,
    centerY,
    radius,
    startAngle,
    endAngle,
    color
  ) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();
  }

  function drawPieSlice(
    ctx,
    centerX,
    centerY,
    radius,
    startAngle,
    endAngle,
    fillColor,
    strokeColor
  ) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // #endregion Utility functions - universal

  // #region Utility functions - local
  function drawLegend() {
    const ul = document.createElement('ul');
    const legend = document.querySelector('legend[for="canvas"]');
    legend.append(ul);

    severities?.forEach((severity) => {
      const li = document.createElement('li');
      li.style.borderLeftColor = severity.color;
      li.textContent = severity.name;
      ul.append(li);
    });
  }

  function calculateDurationTotal() {
    const seconds = getObjectPropValueSum(events, 'duration'); // Total seconds
    const time = new Date(seconds * 1000).toISOString().substring(11, 19); // String of hh:mm:ss

    const hoursEl = document.querySelector('#event-duration-total .hours');
    const hoursValEl = document.querySelector('#event-duration-total .hours .val');
    const minutesEl = document.querySelector('#event-duration-total .minutes');
    const minutesValEl = document.querySelector('#event-duration-total .minutes .val');
    const secondsEl = document.querySelector('#event-duration-total .seconds');
    const secondsValEl = document.querySelector('#event-duration-total .seconds .val');

    let h = (time.charAt(0) + time.charAt(1)).replace(/^0+/, '');
    if (h) {
      hoursValEl.innerText = h;
      hoursEl.style.display = 'flex';
    } else {
      hoursEl.style.display = 'none';
    }

    let m = (time.charAt(3) + time.charAt(4)).replace(/^0+/, '');
    if (m) {
      minutesValEl.innerText = m;
      minutesEl.style.display = 'flex';
    } else {
      minutesEl.style.display = 'none';
    }

    let s = (time.charAt(6) + time.charAt(7)).replace(/^0+/, '');
    if (s) {
      secondsValEl.innerText = s;
      secondsEl.style.display = 'flex';
    } else {
      secondsEl.style.display = 'none';
    }
  }
  // #endregion Utility functions - local

  // #region Global variables
  const severityCodes = severities?.map(severity => severity.code) || [];
  const severityColors = severities?.map(severity => severity.color) || [];

  const canvas = document.getElementById('canvas');

  const eventCountTotal = document.getElementById('event-count-total');

  const chartTypes = document.querySelectorAll('input[name="chart-type"]');
  let chartType = document.querySelector('input[name="chart-type"]:checked');
  const eventMeasurements = document.querySelectorAll('input[name="event-measurement"]');
  let eventMeasurement = document.querySelector('input[name="event-measurement"]:checked');
  const measurementMethods = document.querySelectorAll('input[name="measurement-method"]');
  let measurementMethod = document.querySelector('input[name="measurement-method"]:checked');

  const buttonSimulateEvent = document.getElementById('simulate-event');
  // #endregion Global variables

  // #region Event listeners
  chartTypes.forEach((element) => {
    element.addEventListener('change', () => {
      chartType = document.querySelector('input[name="chart-type"]:checked');
      drawChart();
    });
  });

  eventMeasurements.forEach((element) => {
    element.addEventListener('change', () => {
      eventMeasurement = document.querySelector('input[name="event-measurement"]:checked');
      drawChart();

      // Hide measurement method block if 'count' event measurement is set
      const measurementMethodBlock = document.getElementById('measurement-method');
      if (eventMeasurement.id === 'count' && measurementMethodBlock) {
        measurementMethodBlock.style.display = 'none';
      } else {
        measurementMethodBlock.style.display = 'block';
      }
    });
  });

  measurementMethods.forEach((element) => {
    element.addEventListener('change', () => {
      measurementMethod = document.querySelector('input[name="measurement-method"]:checked');
      drawChart();
    });
  });

  buttonSimulateEvent.addEventListener('click', () => {
    // Get random severity
    const severity = severities[Math.floor(Math.random() * severities.length)].code;

    // Get random duration in range
    const min = 1;
    const max = 50;
    const duration = Number((Math.random() * (max - min + 1) + min).toPrecision(PRECISION_DURATION));

    // Add created random event
    events.push({ severity: severity, duration: duration });

    // Update total counts
    eventCountTotal.innerText = events?.length;
    calculateDurationTotal();

    drawChart();
  });
  // #endregion Event listeners

  // #region Chart classes
  class BarChart {
    constructor(options) {
      this.options = options;
      this.canvas = options.canvas;
      this.ctx = this.canvas.getContext('2d');
      this.colors = options.colors;
      this.maxValue = Math.max(...Object.values(this.options.data));
    }
    drawGridLines() {
      const canvasActualHeight = this.canvas.height - this.options.padding * 2;
      let gridValue = 0;
      while (gridValue <= this.maxValue) {
        const gridY =
          canvasActualHeight * (1 - gridValue / this.maxValue) +
          this.options.padding;
        drawLine(
          this.ctx,
          0,
          gridY,
          this.canvas.width,
          gridY,
          this.options.gridColor
        );
        drawLine(
          this.ctx,
          20,
          this.options.padding / 2,
          20,
          gridY + this.options.padding / 2,
          this.options.gridColor
        );
        this.ctx.save();
        this.ctx.fillStyle = this.options.gridColor;
        this.ctx.textBaseline = 'bottom';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillText(gridValue, 0, gridY - 2);
        this.ctx.restore();
        gridValue += this.options.gridStep;
      }
    }
    drawBars() {
      const canvasActualWidth = this.canvas.width - this.options.padding * 2;
      const canvasActualHeight = this.canvas.height - this.options.padding * 2;
      const numberOfBars = Object.keys(this.options.data).length;
      const barSize = canvasActualWidth / numberOfBars;
      const values = Object.values(this.options.data);
      let barIndex = 0;
      for (let val of values) {
        const barHeight = Math.round((canvasActualHeight * val) / this.maxValue);
        drawBar(
          this.ctx,
          this.options.padding + barIndex * barSize,
          this.canvas.height - barHeight - this.options.padding,
          barSize,
          barHeight,
          this.colors[barIndex % this.colors.length]
        );
        barIndex++;
      }
    }
    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGridLines();
      this.drawBars();
    }
  }

  class PieChart {
    constructor(options) {
      this.options = options;
      this.canvas = options.canvas;
      this.ctx = this.canvas.getContext('2d');
      this.colors = options.colors;
      this.totalValue = [...Object.values(this.options.data)].reduce((a, b) => a + b, 0);
      this.radius = Math.min(this.canvas.width / 2, this.canvas.height / 2) - options.padding;
    }
    drawSlices() {
      let colorIndex = 0;
      let startAngle = -Math.PI / 2;

      for (const categ in this.options.data) {
        const val = this.options.data[categ];
        const sliceAngle = (2 * Math.PI * val) / this.totalValue;

        if (sliceAngle) {
          drawPieSlice(
            this.ctx,
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.radius,
            startAngle,
            startAngle + sliceAngle,
            this.colors[colorIndex % this.colors.length],
            COLOR_GREY
          );
        }

        startAngle += sliceAngle;
        colorIndex++;
      }

      if (this.options.doughnutHoleSize) {
        drawPieSlice(
          this.ctx,
          this.canvas.width / 2,
          this.canvas.height / 2,
          this.options.doughnutHoleSize * this.radius,
          0,
          2 * Math.PI,
          COLOR_WHITE,
          COLOR_WHITE
        );

        drawArc(
          this.ctx,
          this.canvas.width / 2,
          this.canvas.height / 2,
          this.options.doughnutHoleSize * this.radius,
          0,
          2 * Math.PI,
          COLOR_GREY
        );
      }
    }
    drawLabels() {
      let startAngle = -Math.PI / 2;

      for (const categ in this.options.data) {
        const val = this.options.data[categ];
        const sliceAngle = (2 * Math.PI * val) / this.totalValue;

        if (sliceAngle && sliceAngle > 0.2) {
          let labelX =
            this.canvas.width / 2 +
            (this.radius / 1.4) * Math.cos(startAngle + sliceAngle / 2);
          let labelY =
            this.canvas.height / 2 +
            (this.radius / 1.4) * Math.sin(startAngle + sliceAngle / 2);

          if (this.options.doughnutHoleSize) {
            const offset = (this.radius * this.options.doughnutHoleSize) / 2;
            labelX =
              this.canvas.width / 2 +
              (offset + this.radius / 2) * Math.cos(startAngle + sliceAngle / 2);
            labelY =
              this.canvas.height / 2 +
              (offset + this.radius / 2) * Math.sin(startAngle + sliceAngle / 2);
          }

          const percent = Number(((100 * val) / this.totalValue).toPrecision(PRECISION_PERCENTAGE));
          this.ctx.fillStyle = COLOR_BLACK;
          this.ctx.font = '18px Arial';
          this.ctx.fillText(percent + '%', labelX, labelY);
        }

        startAngle += sliceAngle;
      }
    }
    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawSlices();
      this.drawLabels();
    }
  }
  // #endregion Chart classes

  // #region Functions for controls
  function getCounts() {
    const counts = {};

    // Set 0 as a counting start for each severity code
    severityCodes?.forEach((code) => {
      counts[code] = 0;
    });

    // Add up vaules
    events?.forEach((event) => {
      counts[event.severity]++;
    });

    return counts;
  }


  function getSums() {
    const sums = {};

    // Set 0 as a counting start for each severity code
    severityCodes?.forEach((code) => {
      sums[code] = 0;
    });

    // Add up vaules
    events?.forEach((event) => {
      switch (eventMeasurement.id) {
        case 'duration':
          sums[event.severity] += event.duration;
          sums[event.severity] = Number(sums[event.severity].toPrecision(PRECISION_DURATION));
          break;
        default:
          break;
      }
    });

    return sums;
  }

  function getAverages() {
    const values = {};
    const averages = {};

    switch (eventMeasurement.id) {
      case 'duration':
        // Set an empty array as a counting start for each severity code
        severityCodes?.forEach((code) => {
          values[code] = [];
        });

        // Collect durations of each severity
        events?.forEach((event) => {
          values[event.severity].push(event.duration);
        });

        // Calculate average duration of each severity
        Object.keys(values)?.forEach((severity) => {
          const sum = values[severity].reduce((a, b) => a + b, 0);
          const average = (sum / values[severity].length) || 0;
          averages[severity] = Number(average.toPrecision(PRECISION_DURATION));
        });
        break;
      default:
        break;
    }

    return averages;
  }

  function getData() {
    switch (eventMeasurement.id) {
      case 'count':
        return getCounts();
      case 'duration':
        switch (measurementMethod.id) {
          case 'sum':
            return getSums();
          case 'average':
            return getAverages();
          default:
            return {};
        }
      default:
        return {};
    }
  }
  // #endregion Functions for controls

  // #region Functions for drawing charts
  function createNewBarChart() {
    const data = getData();

    const maxValue = Math.max(...Object.values(data));
    const stepCount = 10;
    const gridStep = Math.floor(maxValue / stepCount) || 1;

    new BarChart({
      canvas: canvas,
      padding: 40,
      gridStep: gridStep,
      gridColor: COLOR_GREY,
      data: data,
      colors: severityColors,
    }).draw();
  }

  function createNewPieChart(isDoughnut = false) {
    new PieChart({
      canvas: canvas,
      padding: 40,
      data: getData(),
      colors: severityColors,
      doughnutHoleSize: isDoughnut ? 0.5 : 0 // Can be from 0 to 1
    }).draw();
  }

  function drawChart() {
    switch (chartType.id) {
      case 'bar':
        createNewBarChart();
        break;
      case 'pie':
        createNewPieChart();
        break;
      case 'doughnut':
        createNewPieChart(true);
        break;
      default:
        break;
    }
  }
  // #endregion Functions for drawing charts

  (function () {
    canvas.width = 500;
    canvas.height = 500;
    eventCountTotal.innerText = events.length;
    calculateDurationTotal();
    drawChart();
    drawLegend();
  })();
}
