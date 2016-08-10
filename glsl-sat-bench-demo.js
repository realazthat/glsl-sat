
const work = require('webworkify');
const $ = require('jquery-browserify');
const satbench = require('./glsl-sat-bench.js');
const μs = require('microseconds');

const regl = require('regl')({
  extensions: ['OES_texture_float'],
  optionalExtensions: ['EXT_disjoint_timer_query'],
  attributes: {preserveDrawingBuffer: true}
});



$(document).ready(function(){



  let $results = $('<table style="width: 100%">').appendTo($('body'));
  $results.append($('<thead><tr><th>Experiment</th><th>Size</th><th>N</th><th>Total Time</th><th>Time Per</th></tr></thead>'));
  let $tbody = $('<tbody>').appendTo($results);

  setTimeout(function(){
    let experimentIndex = 1;
    let size = 256;
    let N = 64;
    let results = satbench.sat.compute({regl, size, N});
    console.log(results);

    let timePer = μs.parse(results.microseconds.total / N).toString();

    let $tr = $('<tr>')
                .append($('<td>').text(`${experimentIndex}`).css('padding', '2em'))
                .append($('<td>').text(`${size}`).css('padding', '2em'))
                .append($('<td>').text(`${N}`).css('padding', '2em'))
                .append($('<td>').text(μs.parse(results.microseconds.total).toString()).css('padding', '2em'))
                .append($('<td>').text(timePer).css('padding', '2em'));
    $tr.appendTo($results);
  });

});
