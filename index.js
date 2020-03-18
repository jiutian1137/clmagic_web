import * as THREE from './threejs_util.js';

var g_render_system = new THREE.RenderSystem({});
var g_clock = new THREE.Clock();
var g_mouse_pos = new THREE.Vector2(0, 0);
var g_mouse_move = false;

var g_high_ladder = new THREE.Mesh(new THREE.CylinderGeometry(10, 3, 1000, 32, 32), new THREE.MeshLambertMaterial({ color: new THREE.Color(255.0, 0.0, 0.0) }));
var g_plane2      = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 1, 64, 64), new THREE.MeshLambertMaterial({ color: new THREE.Color(0.0, 0.1, 0.1) }));

function initialier() {
    document.getElementById("render_div").appendChild(g_render_system.renderer.domElement);
    //document.body.appendChild(g_render_system.renderer.domElement);

    g_render_system.camera.position.y = 111.0;
    g_render_system.camera.position.z = 35.0;

    g_high_ladder.position.z = -30.0;
    g_high_ladder.receiveShadow = true;
    g_high_ladder.castShadow = true;
    g_render_system.scene.add(g_high_ladder);

    g_plane2.position.z = -30.0;
    g_plane2.position.y = 100.0;
    g_plane2.castShadow = true;
    g_render_system.scene.add(g_plane2);

    for(var i = 0; i < 1000; ++i){
        var _Rng_width  = Math.random() * 5.0 + 1.0;
        var _Rng_height = Math.random() * 20.0 + 1.0;
        var _Rng_color  = Math.random();
        var _Obj = new THREE.Mesh(
            new THREE.BoxGeometry(_Rng_width, _Rng_height, _Rng_width, 1, 1, 1), 
            new THREE.MeshLambertMaterial( { color: new THREE.Color(_Rng_color, _Rng_color, _Rng_color) } ) );
        var _Rng_theta   = Math.random() * 6.28;
        var _Rng_radians = Math.random() * 3000 + 10;
        _Obj.position.x = Math.cos(_Rng_theta) * _Rng_radians;
        _Obj.position.z = Math.sin(_Rng_theta) * _Rng_radians;
        g_render_system.scene.add(_Obj);
    }

    window.addEventListener(
        "resize",
        function () {
            g_render_system.camera.aspect = window.innerWidth / window.innerHeight;
            g_render_system.camera.updateProjectionMatrix();
            g_render_system.renderer.setSize(window.innerWidth, window.innerHeight);
        },
        false
    );

    g_render_system.renderer.domElement.addEventListener(
        "mousemove",
        function (event) {
            var _Mousepos = new THREE.Vector2(event.clientX, window.innerHeight - event.clientY);
            if (g_mouse_move) {
                g_render_system.camera.yaw(0.001 * (_Mousepos.x - g_mouse_pos.x));
                g_render_system.camera.pitch(0.001 * (_Mousepos.y - g_mouse_pos.y));
            }
            g_mouse_pos.copy(_Mousepos);
        },
        false
    );

    g_render_system.renderer.domElement.addEventListener(
        "mousedown",
        function (event) {
            g_mouse_move = true;
        },
        false
    );

    g_render_system.renderer.domElement.addEventListener(
        "mouseup",
        function (event) {
            g_mouse_move = false;
        },
        false
    );

    g_render_system.renderer.domElement.addEventListener(
        "contextmenu",
        function (event) {
            event.preventDefault();
        },
        false
    );
}

function display() {
    requestAnimationFrame(display);

    var _Delta = g_clock.getDelta();
    var _Epsilon = g_clock.getElapsedTime();
    //alert(_Delta);
    g_render_system.update_sun(_Epsilon * 0.02);
    g_render_system.render();
}



initialier();
display();
