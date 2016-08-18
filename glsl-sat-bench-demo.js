
const $ = require('jquery-browserify');
const satbench = require('./glsl-sat-bench.js');
const μs = require('microseconds');

const regl = require('regl')({
  extensions: ['OES_texture_float', 'EXT_disjoint_timer_query'],
  optionalExtensions: [],
  attributes: {preserveDrawingBuffer: true}
});

$(document).ready(function () {
  $('canvas').css('z-index', '-5');
  let $results = $('<table style="width: 100%">').appendTo($('body'));
  $results.append($(`
    <thead>
      <tr>
        <th>Experiment</th>
        <th>Size</th>
        <th>N</th>
        <th>Total Time</th>
        <th>Total regl CPU Time</th>
        <th>Total regl GPU Time</th>
        <th>Time Per</th>
        <th>CPU Time Per</th>
        <th>GPU Time Per</th>
      </tr>
    </thead>
  `));
  let $tbody = $('<tbody>').appendTo($results);

  setTimeout(function () {
    let experimentIndex = 1;
    let size = 256;
    let N = 256;

    satbench.sat.compute({regl, size, N})
      .then(function (results) {
        console.log(results);

        let timePer = μs.parse(results.microseconds.total / N).toString();
        let cpuTimePer = μs.parse(results.cpuTime * 1000 / N).toString();
        let gpuTimePer = μs.parse(results.gpuTime * 1000 / N).toString();

        let $tr = $('<tr>')
                    .append($('<td>').text(`${experimentIndex}`).css('padding', '2em'))
                    .append($('<td>').text(`${size}`).css('padding', '2em'))
                    .append($('<td>').text(`${N}`).css('padding', '2em'))
                    .append($('<td>').text(μs.parse(results.microseconds.total).toString()).css('padding', '2em'))
                    .append($('<td>').text(μs.parse(1000 * results.cpuTime).toString()).css('padding', '2em'))
                    .append($('<td>').text(μs.parse(1000 * results.gpuTime).toString()).css('padding', '2em'))
                    .append($('<td>').text(timePer).css('padding', '2em'))
                    .append($('<td>').text(cpuTimePer).css('padding', '2em'))
                    .append($('<td>').text(gpuTimePer).css('padding', '2em'));
        $tr.appendTo($tbody);
      });
  });
});
