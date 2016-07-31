

const quad = require('glsl-quad');

const makeVert = function makeVert ({passIndex, textureSize, direction}) {
  direction = direction.toLowerCase();

  if (direction !== 'v' && direction !== 'h') {
    // console.error('direction is not "V" or "H" ... direction: ', direction);
    throw new Error('direction is not "V" or "H" ... direction: ' + direction);
  }

  let pixelSize = 1.0 / textureSize;
  let passOffset = Math.pow(16.0, passIndex) * pixelSize;

  let wzOffset = `vec2(${passOffset}, 0)`;
  let xyIOffset = `vec2((2.0 * float(i)) * float(${passOffset}), 0)`;
  let wzIOffset = `vec2((2.0 * float(i) + 1.0) * float(${passOffset}), 0)`;

  // console.log('direction:', direction);
  if (direction === 'v') {
    wzOffset = `vec2(0, ${passOffset})`;
    xyIOffset = `vec2(0, (2.0 * float(i)) * float(${passOffset}))`;
    wzIOffset = `vec2(0, (2.0 * float(i) + 1.0) * float(${passOffset}))`;
  }


  return `
  precision highp float;
  attribute vec2 a_position;
  attribute vec2 a_uv;
  uniform float u_clip_y;
  varying vec4 v_sample_uvs[8];

  
  void main() {
    gl_Position = vec4(a_position*vec2(1,u_clip_y), 0, 1);

    v_sample_uvs[0].xy = a_uv;
    v_sample_uvs[0].wz = v_sample_uvs[0].xy - ${wzOffset};
    for (int i=1; i<8; i++) {
      v_sample_uvs[i].xy = v_sample_uvs[0].xy - ${xyIOffset};
      v_sample_uvs[i].wz = v_sample_uvs[0].xy - ${wzIOffset};
    }
  }`;
};

const makeFrag = function makeFrag ({type = 'vec4', components = 'rgba'}) {
  return `

    precision highp float;
    varying vec4 v_sample_uvs[8];
    uniform highp sampler2D u_tex;
    void main () {

      highp ${type} t[8];
      // add 16 texture samples with pyramidal scheme
      // to maintain precision
      for (int i=0; i<8; i++) {
        highp ${type} lhs, rhs;

        if (any(lessThan(v_sample_uvs[i].xy, vec2(0))) || any(greaterThan(v_sample_uvs[i].xy, vec2(1))))
          lhs = ${type}(0.0);
        else
          lhs = texture2D(u_tex, v_sample_uvs[i].xy).${components};

        if (any(lessThan(v_sample_uvs[i].wz, vec2(0))) || any(greaterThan(v_sample_uvs[i].wz, vec2(1))))
          rhs = ${type}(0.0);
        else
          rhs = texture2D(u_tex, v_sample_uvs[i].wz).${components};

        t[i] = lhs + rhs;
      }
      t[0] += t[1]; t[2] += t[3];
      t[4] += t[5]; t[6] += t[7];
      t[0] += t[2]; t[4] += t[6];

      highp ${type} result = (t[0] + t[4]);

      gl_FragColor = vec4(1);
      // gl_FragColor = vec4(v_sample_uvs[0].y,0,0,1);
      gl_FragColor.${components} = result.${components};
      // gl_FragColor = texture2D(u_tex, v_sample_uvs[0].xy);

    }
  `;
};



function logtobase ({value, base}) {
  return Math.log(value) / Math.log(base);
}

function computeNumPasses({textureSize,sampleSize}){
  return Math.ceil(logtobase({value: textureSize, base: sampleSize}));
}
function computeNumBitsRequired({width,height,channel_bit_depth}){
  return Math.ceil(Math.log2(width)) + Math.ceil(Math.log2(height)) + channel_bit_depth;
}


function runPasses ({regl, inputTexture, textureSize, direction, passes, currentFboIndex, fbos, type = 'vec4', components = 'rgba', clip_y = 1, outFbo = null}) {
  for (let passIndex = 0; passIndex < passes; ++passIndex) {
    let passInTtexture = passIndex === 0 ? inputTexture : fbos[currentFboIndex].color[0];

    let vert = makeVert({ passIndex, textureSize: textureSize, direction: direction });
    let frag = makeFrag({type, components});

    console.log('vert:',vert);
    console.log('frag:',vert);

    const draw = regl({
      vert: vert,
      frag: frag,
      attributes: {
        a_position: quad.verts,
        a_uv: quad.uvs
      },
      elements: quad.indices,
      uniforms: {
        u_clip_y: clip_y,
        u_tex: regl.prop('texture')
      },
      framebuffer: regl.prop('fbo')
    });

    if (outFbo !== null && outFbo !== undefined && passIndex === passes - 1) {
      // if runPasses was passed an outFbo, we want to write to that.
      draw({texture: passInTtexture, fbo: outFbo});
    } else {
      // otherwise ping-pong to the next intermediary fbo
      currentFboIndex += 1;
      currentFboIndex %= fbos.length;
      // console.log('writing to currentFboIndex: ',currentFboIndex)
      draw({texture: passInTtexture, fbo: fbos[currentFboIndex]});
    }
  }

  return {currentFboIndex};
}

function computeSat ({texture, fbos, regl, outFbo = null, type = 'vec4', components = 'rgba', clip_y = 1, currentFboIndex = 0}) {
  // http://developer.amd.com/wordpress/media/2012/10/GDC2005_SATEnvironmentReflections.pdf

  if (fbos.length < 2) {
    throw new Error('fbos.length must be >= 2');
  }

  let sampleSize = 16;
  let textureSize = Math.max(texture.width, texture.height);


  // console.log(`logtobase(${textureSize}, ${sampleSize}):`, logtobase({value: textureSize, base: sampleSize}));
  let passes = computeNumPasses({textureSize, sampleSize});
  console.log('passes:',passes);


  ({currentFboIndex} = runPasses({  inputTexture: texture
                                  , textureSize
                                  , direction: 'V'
                                  , passes
                                  , currentFboIndex
                                  , fbos
                                  , type
                                  , components
                                  , clip_y
                                  , regl
                                  , outFbo: null}));
  // console.log('currentFboIndex:',currentFboIndex)
  ({currentFboIndex} = runPasses({  inputTexture: fbos[currentFboIndex].color[0]
                                  , textureSize
                                  , direction: 'H'
                                  , passes
                                  , currentFboIndex
                                  , fbos
                                  , type
                                  , components
                                  , clip_y
                                  , regl
                                  , outFbo: outFbo}));

  return {currentFboIndex};
}

module.exports = {computeSat, makeFrag, makeVert, computeNumPasses, computeNumBitsRequired, runPasses};
