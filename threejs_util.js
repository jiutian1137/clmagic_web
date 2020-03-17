/* <release> */
import { Vector2, Vector3, Vector4, Matrix4, Quaternion,
         Color,
         PerspectiveCamera,
         Scene,
         Clock,
         WebGLRenderer,
         Fog, FogExp2,
         Mesh,
         BoxGeometry,
         SphereGeometry,
         PlaneGeometry,
         CylinderGeometry,
         MeshLambertMaterial,
         Texture,
         TextureLoader,
         DirectionalLight,
         SpotLight,
         PointLight          } from './three/Three.js';
import { Sky }                 from "./jsm/objects/Sky.js";
import { Lensflare,
         LensflareElement    } from './jsm/objects/Lensflare.js';
import { CSS3DRenderer,
         CSS3DObject         } from './jsm/renderers/CSS3DRenderer.js';
/* </release> */


function sun_direction(_Time) {
    return (new Vector3(0.0, Math.abs(Math.sin(_Time)), Math.abs(Math.cos(_Time))));
}

function rotate2d(_Vector) {
    _Vector.x = (Math.cos(1.0) + (-Math.sin(1.0))) * 700000;
    _Vector.y = (Math.sin(1.0) + Math.cos(1.0)) * 700000;
}


/* class Camera2 */
function Camera2( fov, aspect, near, far ) {
    PerspectiveCamera.call(this, fov, aspect, near, far);

    this.movementSpeed = 1.0;
    this.rollSpeed = 0.005;

    this.yaw = function (_Radians) {
        var _Quat = new Quaternion(0, 0, 0, 1);
        _Quat.setFromAxisAngle(new Vector3(0, 1, 0), _Radians);
        this.quaternion.multiply(_Quat);
    }

    this.pitch = function (_Radians) {
        var _Quat = new Quaternion(0, 0, 0, 1);
        _Quat.setFromAxisAngle(new Vector3(1, 0, 0), _Radians);
        this.quaternion.multiply(_Quat);
    }
}
Camera2.prototype = Object.assign(Object.create(PerspectiveCamera.prototype));



/* class RendererSystem */
function RenderSystem( _Params ) {
    var _Renderer   = new WebGLRenderer();
        _Renderer.setSize(window.innerWidth, window.innerHeight);
        _Renderer.setPixelRatio(window.devicePixelRatio);

    var _Camera = _Params.camera == undefined ? new Camera2(60, window.innerWidth / window.innerHeight, 10, 100000.0) : _Params.camera;
    _Camera.position.y = 10.0;
    var _Background = _Params.background == undefined ? new Color(0, 0, 0) : _Params.background;
    var _Fog        = _Params.fog        == undefined ? new FogExp2() : _Params.fog;
    var _Scene      = new Scene();
    _Scene.fog      = _Fog;
    _Scene.background = _Background;
    _Scene.castShadow = true;
    _Scene.receiveShadow = true;

    var _Sun = new Mesh(new SphereGeometry(20000, 16, 8), new MeshLambertMaterial({ color: 0xffffff }) );
        _Sun.position.y = 700000.0;
    var _Sunlight = new DirectionalLight(new Color(0.8, 0.8, 0.1), 2.0);
    var _Sky = new Sky();
        _Sky.scale.setScalar(450000.0);
        _Sky.material.uniforms["turbidity"].value = 10;
        _Sky.material.uniforms["rayleigh"].value = 2;
        _Sky.material.uniforms["mieCoefficient"].value = 0.005;
        _Sky.material.uniforms["mieDirectionalG"].value = 0.8;
        _Sky.material.uniforms["luminance"].value = 1;
        _Sky.material.uniforms["turbidity"].value = 10;
        _Sky.material.uniforms["sunPosition"].value = _Sun.position.clone();
    var _Ground = new Mesh(new PlaneGeometry(10000, 10000, 100, 100), new MeshLambertMaterial({ color: 0x77aa77 }));
    _Ground.geometry.rotateX(-1.57);
    _Ground.castShadow    = false;
    _Ground.receiveShadow = true;
    _Scene.add(_Sky, _Sun, _Sunlight, _Ground);

    this.renderer = _Renderer;
    this.scene      = _Scene;
    this.background = _Scene.background;
    this.fog    = _Scene.fog;
    this.camera = _Camera;
    this.sun    = _Sun;
    this.sunlight = _Sunlight;
    this.sky    = _Sky;
    this.ground = _Ground;

    /** render(): void;
     */
    this.render = function() {
        this.sky.material.uniforms["sunPosition"].value = this.sun.position.clone();
        this.sunlight.position.copy(this.sun.position.clone());
        this.renderer.render(this.scene, this.camera);
    }

    /** set_sky(_Param_sky: SkyParameter): void;
     * @param SkyParameter _Params_sky
     */
    this.set_sky = function(_Params_sky) {
        var _Uniforms = _Sky.material.uniforms;
        if (_Params_sky.luminance !== undefined)
            _Uniforms["luminance"].value = _Params_sky.luminance;
        if (_Params_sky.turbidity !== undefined)
            _Uniforms["turbidity"].value = _Params_sky.turbidity;
        if (_Params_sky.rayleigh !== undefined)
            _Uniforms["rayleigh"].value = _Params_sky.rayleigh;
        if (_Params_sky.mieCoefficient !== undefined)
            _Uniforms["mieCoefficient"].value = _Params_sky.mieCoefficient;
        if (_Params_sky.sunPosition !== undefined)
            _Uniforms["sunPosition"].value = _Params_sky.sunPosition;
        if (_Params_sky.mieDirectionalG !== undefined)
            _Uniforms["mieDirectionalG"].value = _Params_sky.mieDirectionalG;
        if (_Params_sky.up !== undefined)
            _Uniforms["up"].value = _Params_sky.up;
    }

    /** update_sun(_Time: number): void;
     * @param number _Time
     */
    this.update_sun = function (_Time) {
        var _Sunpos = sun_direction(_Time);
        this.sun.position.copy(_Sunpos);
    } 
}


/* class TextureArray */
function TextureArray() {
    this.textures = [];

    this.push = function (_Key, _Val) {
        this.textures.push({ key: _Key, value:_Val });
    }

    this.getByKey = function(_Key) {
        for (var i = 0; i != this.textures.length; ++i) {
            if (this.textures[i].key == _Key) {
                return (this.textures[i].value);
            }
        }
        return (undefined);
    }
};


//function LensflareLight(_Position, _Lightcolor, _Tex_lightsource, _Size, _Distance) {
//    this.light = new PointLight(_Lightcolor !== undefined ? _Lightcolor : 0xffffff, 1.5, _Distance);
//    this.lensflare = new Lensflare();
//    this.lensflare.addElement(new LensflareElement(_Tex_lightsource, _Size, _Distance, this.light.color));
//    this.light.add(this.lensflare);

//    this.getPosition = function () {
//        return (this.light.position);
//    }

//    this.setPosition = function (_Newpos) {
//        this.light.position.copy(_Newpos);
//        this.lensflare.position.copy(_Newpos);
//    }

//    this.rotateOnAxis = function (_Axis, _Angle) {
//        this.light.rotateOnAxis(_Axis, _Angle);
//        this.lensflare.rotateOnAxis(_Axis, _Angle);
//    }

//    this.setPosition(_Position);
//}



export {
    /* three */
    Vector2, Vector3, Vector4, Matrix4, Quaternion,
    Color,
    PerspectiveCamera,
    Scene,
    Clock,
    WebGLRenderer,
    Fog, FogExp2,
    Mesh,
    BoxGeometry,
    SphereGeometry,
    PlaneGeometry,
    CylinderGeometry,
    MeshLambertMaterial,
    Texture,
    TextureLoader,
    DirectionalLight,
    SpotLight,
    PointLight,
    /* jsm */
    Sky,
    Lensflare, LensflareElement, LensflareLight,
    CSS3DRenderer, CSS3DObject,
    /* clmagic */
    RenderSystem, Camera2, TextureArray
};


