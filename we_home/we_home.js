import * as THREE from '../three.module.js';
import { PLYLoader } from '../jsm/loaders/PLYLoader.js';
import { OBJLoader } from '../jsm/loaders/OBJLoader.js'
import { FlyControls } from '../jsm/controls/FlyControls.js';
import { FirstPersonControls } from '../jsm/controls/FirstPersonControls.js';
import { ImprovedNoise } from '../jsm/math/ImprovedNoise.js'
import { Sky } from '../jsm/objects/Sky.js'

// system elements
var gClock = new THREE.Clock();
var gContainer, gRenderer;

// object elements
var gCamera, gScene;
var gControl;
var gSunPosition;

var gSky;
var gCommonMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC, specular: 0xCCCCCC });
var gWaterMaterial  = new THREE.MeshLambertMaterial({ color: 0x0000CC, specular: 0xCCCCCC, opeque: 0.2 });
var gTreeGeometry;
var gSunflowerGeometry;
var gCrocodileGeometry;

var gLoadInformation_fence100m;
var gLoadInformation_fence47_5m;
var gLoadInformation_home;
var gLoadInformation_tree_leaf;
var gLoadInformation_sunflower;
var gLoadInformation_static_pond;
var gLoadInformation_crocodile;


init();
animate();

function update_infotable() {
	var _Infotable = document.getElementById("main_infotable");
	var _Str = gLoadInformation_fence100m + '</br>'
		+ gLoadInformation_fence47_5m + '</br>'
		+ gLoadInformation_home + '</br>'
		+ gLoadInformation_tree_leaf + '</br>'
		+ gLoadInformation_sunflower + '</br>'
		+ gLoadInformation_static_pond + '</br>'
		+ gLoadInformation_crocodile;
	_Infotable.innerHTML = '<font style="color:red">' + _Str + '</font>';
}

function generateHeight(width, height) {

	var size = width * height, data = new Uint8Array(size),
		perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

	for (var j = 0; j < 4; j++) {

		for (var i = 0; i < size; i++) {

			var x = i % width, y = ~ ~(i / width);
			data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

		}

		quality *= 1.1;

	}

	return data;

}

function height_map(left, right, bottom, top, texture_width, texture_height) {
	this._Myleft   = left;
	this._Myright  = right;
	this._Mybottom = bottom;
	this._Mytop    = top;
	this._Mytexture        = generateHeight(texture_width, texture_height);
	this._Mytexture_width  = texture_width;
	this._Mytexture_height = texture_height;

	this.dx = function () { return (this._Myright - this._Myleft) / this._Mytexture_width; };
	this.dy = function () { return (this._Mytop - this._Mybottom) / this._Mytexture_height; };
	this.get = function (x, y) {
		if (x < this._Myright && x > this._Myleft && y < this._Mytop && y > this._Mybottom) {
			var xx = x + (this._Myright - this._Myleft) / 2;
			var yy = y + (this._Mytop - this._Mybottom) / 2;
			var fx = xx / this.dx();
			var fy = yy / this.dy();
			var ix = Math.floor(fx);
			var iy = Math.floor(fy);
			return THREE.Math.lerp(THREE.Math.lerp(this._Mytexture[iy * this._Mytexture_width + ix], this._Mytexture[iy * this._Mytexture_width + ix + 1], fx - ix),
								   THREE.Math.lerp(this._Mytexture[(iy + 1) * this._Mytexture_width + ix], this._Mytexture[(iy + 1) * this._Mytexture_width + ix + 1], fx - ix),
								   fy - iy);
		} else {
			if (x == this._Myleft && y == this._Mybottom) {
				return this._Mytexture[0];
			}
			if (x == this._Myleft && y == this._Mytop) {
				return this._Mytexture[this._Mytexture_width * (this._Mytexture_height - 1)];
			}
			if (x == this._Myright && y == this._Mybottom) {
				return this._Mytexture[this._Mytexture_width - 1];
			}
			if (x == this._Myright && y == this._Mytop) {
				return this._Mytexture[this._Mytexture_width * this._Mytexture_height - 1];
			}

			return 0;
		}
	} 
}

function terrain_geometry(_Heightmap, _Pred) {

	var _Geometry = new THREE.PlaneBufferGeometry(
		_Heightmap._Myright - _Heightmap._Myleft,
		_Heightmap._Mytop   - _Heightmap._Mybottom,
		_Heightmap._Mytexture_width  - 1,
		_Heightmap._Mytexture_height - 1);
	_Geometry.rotateX(- Math.PI / 2);

	var _Vertices = _Geometry.attributes.position.array;
	//var  dx       = _Heightmap.dx();
	//var  dy       = _Heightmap.dy();
	//for (var z = _Heightmap._Mybottom; z <= _Heightmap._Mytop; z += dy) {
	//	for (var x = _Heightmap._Myleft; x <= _Heightmap._Myright; x += dx) {
	//		var y = _Heightmap.get(x, z);
	//		if (_Pred(x, y, z)) continue;
	//		_Vertices[(z * _Heightmap._Mytexture_width + x) * 3 + 1] = y;
	//	}
	//}
	for (var i = 0, j = 0, l = _Vertices.length; i < l; i++, j += 3) {
		var x = _Vertices[j];
		var y = _Vertices[j + 1];
		var z = _Vertices[j + 2];
		if (_Pred(x, y, z)) continue;
		_Vertices[j + 1] = _Heightmap._Mytexture[i] * 10;
	}
	return _Geometry;
}

function init() {
	gContainer = document.getElementById('main_viewport');
	document.body.appendChild(gContainer);

	gRenderer = new THREE.WebGLRenderer({ antialias: true });
	gRenderer.setPixelRatio(window.devicePixelRatio);
	gRenderer.setSize(window.innerWidth, window.innerHeight);
	gRenderer.gammaInput = true;
	gRenderer.gammaOutput = true;
	gRenderer.shadowMap.enabled = true;

	gContainer.appendChild(gRenderer.domElement);

	window.addEventListener('resize', onWindowResize, false);

	//-----------------------------------------------------------------
	gCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
	gCamera.position.set(0, 1.7, -5);
	gCamera.lookAt(new THREE.Vector3(0, 1.7, -10));

	gScene            = new THREE.Scene();
	gScene.background = new THREE.Color(0x72645b);
	gScene.fog = new THREE.Fog(0x72645b, 2, 1000);

	gControl = new FlyControls(gCamera, gRenderer.domElement);
	gControl.rollSpeed = 0.2;
	gControl.movementSpeed = 5.0;
	//gControl.lookSpeed = 1.0;
	//gControl.movementSpeed = 2.0;

	gSunPosition = new THREE.Vector3(650000, 50000, 0);

	// objects...................................
	gSky = new Sky();
	gSky.scale.setScalar(450000.0);
	gSky.material.uniforms["turbidity"].value = 10;
	gSky.material.uniforms["rayleigh"].value  = 2;
	gSky.material.uniforms["mieCoefficient"].value  = 0.005;
	gSky.material.uniforms["mieDirectionalG"].value = 0.8;
	gSky.material.uniforms["luminance"].value = 1;
	gSky.material.uniforms["turbidity"].value = 10;
	gSky.material.uniforms["sunPosition"].value = gSunPosition.clone();
	gScene.add(gSky);

	// Ground
	var _Terrain_heightmap = new height_map(-750, 750, -750, 750, 32, 32);

	var _Terrain_geometry = terrain_geometry(_Terrain_heightmap,
		function (x, y, z) {
			if (z < 0) return true;// river
			if (Math.abs(x) <= 100 && Math.abs(z) <= 100) return true;// home
			return false;
		}
	);
	var _Terrain = new THREE.Mesh(_Terrain_geometry, gCommonMaterial);
	_Terrain.receiveShadow = true;
	//_Terrain.castShadow    = true;
	gScene.add(_Terrain);

	// PLY file
	var loader = new PLYLoader();
	gLoadInformation_fence100m = 'wait... fence100m';
	loader.load('../media/fence100m.ply', function (_Geometry) {
		_Geometry.computeVertexNormals();

		var _Fence_left = new THREE.Mesh(_Geometry, gCommonMaterial);
		_Fence_left.rotation.x = -Math.PI / 2;
		_Fence_left.rotation.z = -Math.PI / 2;
		_Fence_left.position.x = -50;
		_Fence_left.position.y = 0;
		_Fence_left.position.z = -50;
		_Fence_left.castShadow = true;
		_Fence_left.receiveShadow = true;
		var _Fence_right = new THREE.Mesh(_Geometry, gCommonMaterial);
		_Fence_right.rotation.x = -Math.PI / 2;
		_Fence_right.rotation.z = -Math.PI / 2;
		_Fence_right.position.x = 50;
		_Fence_right.position.y = 0;
		_Fence_right.position.z = -50;
		_Fence_right.castShadow = true;
		_Fence_right.receiveShadow = true;
		var _Fence_back = new THREE.Mesh(_Geometry, gCommonMaterial);
		_Fence_back.rotation.x = -Math.PI / 2;
		_Fence_back.position.x = -50;
		_Fence_back.position.y = 0;
		_Fence_back.position.z = 50;
		_Fence_back.castShadow = true;
		_Fence_back.receiveShadow = true;

		gScene.add(_Fence_left);
		gScene.add(_Fence_right);
		gScene.add(_Fence_back);

		gLoadInformation_fence100m = "OK fence100m";
		update_infotable();
	});

	gLoadInformation_fence47_5m = 'wait... fence47_5m';
	loader.load('../media/fence47_5m.ply', function (_Geometry) {
		_Geometry.computeVertexNormals();

		var _Fence_left = new THREE.Mesh(_Geometry, gCommonMaterial);
		_Fence_left.rotateX( -Math.PI / 2);
		_Fence_left.position.x = -50;
		_Fence_left.position.y = 0;
		_Fence_left.position.z = -50;
		_Fence_left.castShadow = true;
		_Fence_left.receiveShadow = true;
		var _Fence_right = new THREE.Mesh(_Geometry, gCommonMaterial);
		_Fence_right.rotateX(-Math.PI/2);
		_Fence_right.rotateZ(Math.PI);
		_Fence_right.position.x = 50;
		_Fence_right.position.y = 0;
		_Fence_right.position.z = -50;
		_Fence_right.castShadow = true;
		_Fence_right.receiveShadow = true;

		gScene.add(_Fence_left);
		gScene.add(_Fence_right);

		gLoadInformation_fence47_5m = ' OK fence47_5m';
		update_infotable();
	});

	gLoadInformation_home = 'wait... home';
	loader.load('../media/home_model.ply', function (_Geometry) {
		_Geometry.computeVertexNormals();
		var _Home = new THREE.Mesh(_Geometry, gCommonMaterial);

		_Home.rotation.x = -Math.PI / 2;
		_Home.rotation.z =  Math.PI / 2;
		_Home.castShadow = true;
		_Home.receiveShadow = true;
		gScene.add(_Home);

		gLoadInformation_home = 'OK home';
		update_infotable();
	});

	var _OBJloader = new OBJLoader();
	gLoadInformation_tree_leaf = 'wait... maple';
	_OBJloader.load("../media/tree_leaf_model.obj", function (_Maple) {
		gTreeGeometry = _Maple.children[0].geometry;

		var _Terrain_geometry = _Terrain.geometry.attributes.position.array;
		var _Maple_pos      = new Array(100);
		var _Maple_start    = 100;
		var _Maple_interval = 15.0;
		for (var i = 0; i < 100; _Maple_start += 8) {
			var count = Math.floor(_Maple_start * 3.14 / _Maple_interval);
			if (count >= 1) {
				var dphi = 3.14 / count;
				for (var phi = 0.0; phi < 3.14; phi += dphi) {
					var x = _Maple_start * Math.cos(phi);
					var z = _Maple_start * Math.sin(phi);
					var y = _Terrain_heightmap.get(x, z);
					_Maple_pos[i++] = new THREE.Vector3(x, y, z);
				}
			}
		}

		for (var i = 0; i < 100; ++i) {
			var _Maple = new THREE.Mesh(gTreeGeometry, gCommonMaterial);
			_Maple.position.set(_Maple_pos[i].x, _Maple_pos[i].y, _Maple_pos[i].z);
			_Maple.rotateY(Math.random() * 6.28);
			//_Maple.castShadow = true;
			gScene.add(_Maple);
		}

		gLoadInformation_tree_leaf = 'OK maple';
		update_infotable();
	});

	gLoadInformation_sunflower = 'wait... sunflower';
	_OBJloader.load('../media/sunflower_model.obj', function (_Sunflower) {
		gSunflowerGeometry = _Sunflower.children[0].geometry;

		//var count = 0;
		//while (count < 5000) {
		//	var x = Math.random() * 100 - 50;
		//	var z = Math.random() * 100 - 50;
		for (var z = -50; z < 50; ++z) {
			for (var x = -50; x < 50; ++x) {
				if (x <= 10 && x >= -10 && z <= 10 && z >= -10) {
					continue;
				}
				if (z < -10 && Math.abs(x) <= 7) {
					continue;
				}
				var _Sunflower = new THREE.Mesh(gSunflowerGeometry, gCommonMaterial);
				_Sunflower.position.set(x, 0, z);
				if (x < 0) {
					_Sunflower.rotateY(1.57);
				} else {
					_Sunflower.rotateY(-1.57);
				}
				_Sunflower.rotateX(Math.random() * 0.2);
				gScene.add(_Sunflower);
				//++count;
			}
		}

		gLoadInformation_sunflower = 'OK sunflower';
		update_infotable();
	});

	gLoadInformation_static_pond = 'wait... pond';
	_OBJloader.load('../media/static_pond_model.obj', function (_Pond) {
		var _Mesh = new THREE.Mesh(_Pond.children[0].geometry, gWaterMaterial);
		_Mesh.position.x = 0;
		_Mesh.position.z = -150;
		gScene.add(_Mesh);

		gLoadInformation_static_pond = 'OK pond';
		update_infotable();
	});

	gLoadInformation_crocodile = 'wait... crocodile';
	_OBJloader.load('../media/crocodile_modell.obj', function (_Crocodile) {
		gCrocodileGeometry = _Crocodile.children[0].geometry;
		for (var i = 0; i != 20; ++i) {
			var _Mesh = new THREE.Mesh(gCrocodileGeometry, gCommonMaterial);
			_Mesh.position.x = Math.random() * 100;
			_Mesh.position.z = Math.random() * 100 -100;
			_Mesh.rotateY(Math.random() * 6.28);
			if (_Mesh.position.z <= -50) {
				_Mesh.rotateX(Math.PI);
				_Mesh.position.y += 1.0;
			}
			gScene.add(_Mesh);
		}

		gLoadInformation_crocodile = 'OK crocodile';
		update_infotable();
	});

	// Lights
	addShadowedLight(gSunPosition.x, gSunPosition.y, gSunPosition.z, 0xD3D3D3, 1);

	update_infotable();
}

function addShadowedLight(x, y, z, color, intensity) {

	var directionalLight = new THREE.DirectionalLight(color, intensity);
	directionalLight.position.set(x, y, z);
	gScene.add(directionalLight);

	directionalLight.castShadow = true;

	var d = 1;
	directionalLight.shadow.camera.left = - d;
	directionalLight.shadow.camera.right = d;
	directionalLight.shadow.camera.top = d;
	directionalLight.shadow.camera.bottom = - d;

	directionalLight.shadow.camera.near = 1;
	directionalLight.shadow.camera.far = 4;

	directionalLight.shadow.mapSize.width = 1024;
	directionalLight.shadow.mapSize.height = 1024;

	directionalLight.shadow.bias = - 0.001;

}

function onWindowResize() {

	gCamera.aspect = window.innerWidth / window.innerHeight;
	gCamera.updateProjectionMatrix();

	gRenderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {
	requestAnimationFrame(animate);
	gControl.update(gClock.getDelta());
	gControl.object.position.y = 1.8;
	gRenderer.render(gScene, gCamera);
}
