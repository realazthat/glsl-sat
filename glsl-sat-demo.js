
const $ = require('jquery-browserify');
const resl = require('resl');
const regl = require('regl')({
  extensions: ['OES_texture_float'],
  // TODO: FIXME: dunno why we need this here, we do not read non-uint8 data from screen,
  // but it fails without this on gh-pages for some reason.
  attributes: {preserveDrawingBuffer: true}
});

const computeSat = require('./glsl-sat.js').computeSat;

const numerify = require('glsl-numerify');
const quad = require('glsl-quad');

// command to copy a texture to an FBO, assumes the texture is in opengl-order
// where the origin is the lower left of the texture.
const drawTextureToFbo = regl({
  frag: quad.shader.frag,
  vert: quad.shader.vert,
  attributes: {
    a_position: quad.verts,
    a_uv: quad.uvs
  },
  elements: quad.indices,
  uniforms: {
    u_tex: regl.prop('texture'),
    u_clip_y: 1
  },
  framebuffer: regl.prop('fbo')
});

// command to copy a texture to an FBO, but flipping the Y axis so that the uvs begin
// at the upper right corner, so that it can be drawn to canvas etc.
const drawToCanvasFBO = regl({
  frag: quad.shader.frag,
  vert: quad.shader.vert,
  attributes: {
    a_position: quad.verts,
    a_uv: quad.uvs
  },
  elements: quad.indices,
  uniforms: {
    u_tex: regl.prop('texture'),
    u_clip_y: -1
  },
  framebuffer: regl.prop('fbo')
});

function dataURIFromFBO ({fbo, width, height, regl}) {
  let canvasFBO = regl.framebuffer({
    color: regl.texture({
      width: width,
      height: height,
      stencil: false,
      format: 'rgba',
      type: 'uint8',
      depth: false,
      wrap: 'clamp',
      mag: 'nearest',
      min: 'nearest'
    })
  });

  let data = [];
  try {
    drawToCanvasFBO({texture: fbo.color[0], fbo: canvasFBO});

    let bindFbo = regl({framebuffer: canvasFBO});
    bindFbo(function () {
      data = regl.read();
    });
  } finally {
    canvasFBO.destroy();
  }

  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var context = canvas.getContext('2d');

  // Copy the pixels to a 2D canvas
  var imageData = context.createImageData(width, height);
  imageData.data.set(data);
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}

const sat8x8pnguri = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYA
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`.replace(/\s*/g, '');

resl({
  manifest: {
    texture: {
      type: 'image',
      src: sat8x8pnguri,
      parser: (data) => regl.texture({
        data: data,
        mag: 'nearest',
        min: 'nearest',
        flipY: true
      })
    }, digitsTexture: {
      type: 'image',
      src: numerify.digits.uri,
      parser: (data) => regl.texture({
        data: data,
        mag: 'nearest',
        min: 'nearest',
        flipY: true
      })
    }
  },
  onDone: ({texture, digitsTexture}) => {
    // make a bunch of fbos for ping-ponging intermediate computations, and the output buffer etc.
    let fbos = [null, null, null, null].map(function () {
      return regl.framebuffer({
        color: regl.texture({
          width: texture.width,
          height: texture.height,
          stencil: false,
          format: 'rgba',
          type: 'float',
          depth: false,
          wrap: 'clamp',
          mag: 'nearest',
          min: 'nearest'
        }),
        stencil: false,
        depth: false,
        depthStencil: false,
        wrap: 'clamp',
        mag: 'nearest',
        min: 'nearest'
      });
    });

    // use one FBO for the output.
    let outFbo = fbos.pop();

    // and another for the input, for later use.
    let inFbo = fbos.pop();

    computeSat({texture: texture, fbos: fbos, outFbo: outFbo, regl, components: 'rgb', type: 'vec3'});

    let upscaledCellWidth = 32;
    let upscaledCellHeight = 32;
    let upscaledWidth = texture.width * Math.max(upscaledCellWidth, upscaledCellHeight);
    let upscaledHeight = texture.height * Math.max(upscaledCellWidth, upscaledCellHeight);

    // a command to take an input texture and "numerify" it and place it in a destination FBO.
    const drawNumbersToFbo = regl({
      frag: numerify.makeFrag({ multiplier: 256.0,
                                sourceSize: `vec2(${texture.width}, ${texture.height})`,
                                destinationCellSize: `vec2(${upscaledCellWidth - 1}, ${upscaledCellHeight - 1})`,
                                destinationSize: `vec2(${upscaledWidth}, ${upscaledHeight})`,
                                component: 'r'}),
      vert: numerify.makeVert(),
      attributes: {
        a_position: quad.verts,
        a_uv: quad.uvs
      },
      elements: quad.indices,
      uniforms: {
        digits_texture: digitsTexture,
        source_texture: regl.prop('texture'),
        u_clip_y: 1
      },
      framebuffer: regl.prop('fbo')
    });

    // allocate two FBOS to store the numerified textures.
    let numbersFBOs = [null, null].map(function () {
      return regl.framebuffer({
        color: regl.texture({
          width: upscaledWidth,
          height: upscaledHeight,
          stencil: false,
          format: 'rgba',
          type: 'uint8',
          depth: false,
          wrap: 'clamp',
          mag: 'nearest',
          min: 'nearest'
        })
      });
    });

    // one FBO to store the input texture as a numerified texture.
    let inNumbersFBO = numbersFBOs[0];
    // and a second FBO to store the SAT result texture as a numerified texture.
    let outNumbersFBO = numbersFBOs[1];

    // copy the input texture to the `inFbo`.
    drawTextureToFbo({texture, fbo: inFbo});
    // "numerify" the input texture.
    drawNumbersToFbo({texture: inFbo.color[0], fbo: inNumbersFBO});
    // "numerify" the SAT result texture.
    drawNumbersToFbo({texture: outFbo.color[0], fbo: outNumbersFBO});

    // draw the stuff to img tags, and put everything into the DOM for display.

    let $srcDiv = $('<div class="source-images"></div>').css('text-align', 'center').appendTo('body');
    $('<h3>').appendTo($srcDiv).css('text-align', 'center').text('Source image (upscaled)');

    let $resultDiv = $('<div class="result-images"></div>').css('text-align', 'center').appendTo('body');
    $('<h3>').appendTo($resultDiv).css('text-align', 'center').text('Result image (upscaled)');

    function figureTemplate ({src, captionHtml = '', alt = ''}) {
      return `
      <figure>
        <img src="${src}" alt="${alt}">
        <figcaption>${captionHtml}</figcaption>
      </figure>
      `;
    }

    let $srcImg = $.parseHTML(figureTemplate({src: dataURIFromFBO({fbo: inFbo, width: upscaledWidth, height: upscaledHeight, regl}),
                                               alt: 'Source image (Rescaled)',
                                               captionHtml: '<strong>Source image (Rescaled)</strong>'}));
    let $srcNumbersImg = $.parseHTML(figureTemplate({src: dataURIFromFBO({fbo: inNumbersFBO, width: upscaledWidth, height: upscaledHeight, regl}),
                                                      alt: 'Source image numerified red',
                                                      captionHtml: '<strong>Source image, numerified red</strong>'}));
    let $satImg = $.parseHTML(figureTemplate({src: dataURIFromFBO({fbo: outFbo, width: upscaledWidth, height: upscaledHeight, regl}),
                                               alt: 'Result SAT image (Rescaled)',
                                               captionHtml: '<strong>Result SAT image (Rescaled)</strong>'}));
    let $satNumbersImg = $.parseHTML(figureTemplate({src: dataURIFromFBO({fbo: outNumbersFBO, width: upscaledWidth, height: upscaledHeight, regl}),
                                                      alt: 'Result SAT image numerified red',
                                                      captionHtml: '<strong>Result SAT image, numerified red</strong>'}));

    $($srcImg).css('display', 'inline-block').appendTo($srcDiv);
    $($srcNumbersImg).css('display', 'inline-block').appendTo($srcDiv);
    $($satImg).css('display', 'inline-block').appendTo($resultDiv);
    $($satNumbersImg).css('display', 'inline-block').appendTo($resultDiv);
  }
});
