
const computeSat = require('./glsl-sat.js').computeSat;
const μs = require('microseconds');
const range = require('array-range');

function benchSatCompute ({regl, size, textureData = null, N, components = 'rgba', type = 'vec4'}) {
  return new Promise(function (resolve, reject) {
    let fbos = range(2).map(function () {
      return regl.framebuffer({
        color: regl.texture({
          width: size,
          height: size,
          format: 'rgba',
          type: 'float',
          depth: false,
          stencil: false,
          wrap: 'clamp',
          mag: 'nearest',
          min: 'nearest'
        }),
        depth: false,
        stencil: false,
        depthStencil: false,
        depthTexture: false,
        wrap: 'clamp',
        mag: 'nearest',
        min: 'nearest'
      });
    });

    let outFbo = regl.framebuffer({
      color: regl.texture({
        width: size,
        height: size,
        format: 'rgba',
        type: 'uint8',
        depth: false,
        stencil: false,
        wrap: 'clamp',
        mag: 'nearest',
        min: 'nearest'
      }),
      depth: false,
      stencil: false,
      depthStencil: false,
      depthTexture: false,
      wrap: 'clamp',
      mag: 'nearest',
      min: 'nearest'
    });

    if (textureData === null || textureData === undefined) {
      textureData = new Uint8Array(size * size * 4);
    }

    let texture = regl.texture({
      data: textureData,
      width: size,
      height: size,
      format: 'rgba',
      type: 'uint8',
      depth: false,
      stencil: false,
      wrap: 'clamp',
      mag: 'nearest',
      min: 'nearest'
    });

    let results = {
      microseconds: {
        samples: [],
        total: 0
      }
    };

    let scope = regl({
      profile: true
    });

    let t0 = μs.now();

    function setTimeoutPromise (f, t) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          Promise.resolve()
            .then(f)
            .then(function (result) {
              return resolve(result);
            })
            .catch(function (err) {
              return reject(err);
            });
        }, t);
      });
    }

    setTimeoutPromise(function () {
      regl.poll();
    })
    .then(function () {
      t0 = μs.now();
      for (let i = 0; i < N; ++i) {
        let samplet0 = μs.now();

        scope(() => {
          computeSat({texture: texture, fbos: fbos, outFbo: outFbo, regl, components, type});
        });

        results.microseconds.samples.push(μs.since(samplet0));
      }
    })
    .then(function () {
      return setTimeoutPromise(function () {
        regl.poll();
      });
    })
    .then(function () {
      results.cpuTime = scope.stats.cpuTime;
      results.gpuTime = scope.stats.gpuTime;

      results.microseconds.total = μs.since(t0);

      return resolve(results);
    })
    .catch(function (err) {
      return reject(err);
    });
  }); // new Promise()
}

module.exports = {sat: {compute: benchSatCompute}};
