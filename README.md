
glsl-sat
---


####Description

glsl-sat is a shader generator for WebGL, to generate a summed-area-table texture of an input texture.

Based on [**Summed-Area Tables Area Tables** And Their Application to Dynamic And Their Application to
Dynamic Glossy Environment Reflections](http://amd-dev.wpengine.netdna-cdn.com/wordpress/media/2012/10/GDC2005_SATEnvironmentReflections.pdf)


See `glsl-sat-demo.js` for usage.

####Dependencies

* nodejs
* browserify
* [glsl-quad](https://github.com/realazthat/glsl-quad)
* [glsl-quad](https://github.com/realazthat/glsl-numerify) (for demo)
* [regl](https://github.com/mikolalysenko/regl) (for demo)
* [resl](https://github.com/mikolalysenko/resl) (for demo)
* budo (for quick demo as an alternative to running browserify) 


####Demo

To run the demo, run:

```
    cd ./glsl-sat
    
    #install npm dependencies
    npm install
    
    #browser should open with the demo
    budo glsl-sat-demo.js --open


```

Results:

branch | demo
-------|-------
master | [glsl-sat-demo](https://realazthat.github.io/glsl-sat/master/www/glsl-sat-demo/index.html)
develop | [glsl-sat-demo](https://realazthat.github.io/glsl-sat/master/www/glsl-sat-demo/index.html)

####Docs

```
const sat = require('./glsl-sat.js');
```

##### `quad.verts`

* A list of vertices that can be used for webgl positions, that make up a quad (two triangles).
ts/` directory.


####Usage

See `glsl-sat-demo.js` for a full demo using [regl](https://github.com/mikolalysenko/regl)
and [resl](https://github.com/mikolalysenko/resl).

An excerpt:

```

    const drawTexture = regl({
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
      }
    });

    drawTexture({texture});


```


