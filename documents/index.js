
function not(_Flag) {
	return (!_Flag);
}

// @_Equaltion: C * (t^i) * [(1-t)^(n-i)]
function Bernstein(n, i, t, /*binomial*/ C){	
	//static_assert(std:: is_integral < _Tyn >, "invalid template argument, Bernstein(_Tyn, _Tyn, _in(_Ty))");
	return (C * Math.pow(t, i) * Math.pow(1-t, n-i));
}

// return _Val or null
function condition_v(_Val) {
	return _Val !== undefined ? _Val : null;
}

function _Is_typeX(_Object, _String) {
	if ( _Object != undefined && _Object != null && _Object.type != undefined ) {
		if ( _String == _Object.type ) {
			return true;
		}
	}
	return false;
}

function is_filter(_File) {
	return _Is_typeX(_File, 'filter');
}

function is_source(_File) {
	return _Is_typeX(_File, 'source');
}

function cast_svg_polyline(v, style) {
	// get <polyline style='style' points='v'> </polyline>
	var _Str = "<polyline style='" + style + "' ";

	_Str += "points='";
	for (let p of v) {
		_Str += p.x + ',';
		_Str += p.y + ' ';
	}
	_Str += "'>";

	return (_Str + "</polyline>");
}

function cast_svg_line(p1, p2, style) {
	// get <line style='style' x1='p1.x' y1='p1.y' x2='p2.x' y2='p2.y'> </line>
	var _Str = "<line style='" + style + "' ";
	_Str += "x1='" + p1.x + "' ";
	_Str += "y1='" + p1.y + "' ";
	_Str += "x2='" + p2.x + "' ";
	_Str += "y2='" + p2.y + "'>";
	return (_Str + "</line>")
}

function cast_svg_rect(p, w, h, style) {
	// get <rect style='style' x='p.x' y='p.y' width='w' height='h'> </rect>
	var _Str = "<rect style='" + style + "' ";
	_Str += "x='" + p.x + "' ";
	_Str += "y='" + p.y + "' ";
	_Str += "width='"  + w + "' ";
	_Str += "height='" + h + "'>";

	return (_Str + "</rect>");
}


function four_point_polyline(p1, p2, off) {
	if (p1.x == p2.x) {
		var mid_x = (p2.x - p1.x) / 2 + p1.x + off;
		return Array(
			{ x: p1.x, y: p1.y },
			{ x: mid_x, y: p1.y },
			{ x: mid_x, y: p2.y },
			{ x: p2.x,  y: p2.y } );
	}

	var mid_y = (p2.y - p1.y) / 2 + p1.y + off;
	return Array(
		{ x: p1.x, y: p1.y },
		{ x: p1.x, y: mid_y },
		{ x: p2.x, y: mid_y },
		{ x: p2.x, y: p2.y });
}

function bezier_polyline(p1, p3) {
	var p2 = { x: p1.x + 40, y: p1.y };
	// C: 1 2 1
	var v = Array(p1);
	for (var t = 0.05; t < 1.0; t += 0.05) {
		var b1 = Bernstein(2, 0, t, 1);
		var b2 = Bernstein(2, 1, t, 2);
		var b3 = Bernstein(2, 2, t, 1);
		v.push({
			x: b1 * p1.x + b2 * p2.x + b3 * p3.x,
			y: b1 * p1.y + b2 * p2.y + b3 * p3.y
		});
	}
	v.push(p3);
	return v;
}


// class file
function file(/*string*/ _Name, /*file?*/ _Parent) {
	this.type     = 'file';
	this.name     = _Name; 
	this.parent   = condition_v(_Parent);
	this.position = -1;
}

// class source
function source(/*string*/ _Name, /*filter*/ _Filter) {
	if (_Filter !== undefined) {// is filter
		if ( not('filter' == _Filter.type) ) {
			alert('->[source]');
		}
	}

	file.call(this, _Name, _Filter);

	this.type     = 'source';
	this.includes = Array();// item[]

	this.Include = function (_Source) {
		//for (let _Source of _Sources) {
			if (is_source(_Source)) {
				var _Exist = false;
				for (let _Include of this.includes) {
					if (_Include.name == _Source.name) {
						_Exist = true;
						break;
					}
				}

				if (!_Exist) {
					this.includes.push(_Source);
				}
			}
		//}
	};
}

// class filter
function filter(/*string*/ _Name, /*file?*/ _Parent) {
	file.call(this, _Name, _Parent);

	this.type    = 'filter';
	this.filters = Array();// filter[]
	this.sources = Array();// source[]

	this.Size = function () {
		var _Size = this.sources.length;
		for (let _Filter of this.filters) {
			_Size += _Filter.Size();
		}
		return _Size;
	}

	this.Find = function (_Name) {
		for (let _Filter of this.filters) {
			if (_Filter.name == _Name) {
				return _File;
			}
		}

		for (let _Source of this.sources) {
			if (_Source.name == _Name) {
				return _Source;
			}
		}

		return null;
	};

	this.Push = function (/*file[]*/ _File) {
		if (_File == undefined || _File == null) {
			return;
		}

		if (_File.type == 'filter') {
			var _Exist = false;
			for (let _Filter of this.filters) {
				if (_Filter.name == _File.name) {
					_Exist = true;
					break;
				}
			}

			if (!_Exist) {
				this.filters.push(_File);
			}
		} else if (_File.type == 'filter') {
			var _Exist = false;
			for (let _Source of this.sources) {
				if (_Source.name == _File.name) {
					_Exist = true;
					break;
				}
			}

			if (!_Exist) {
				this.sources.push(_File);
			}
		}
	};

	this.Filter = function (/*string*/ _Name) {
		var _Ref = null;
		for (let _Filter of this.filters) {
			if (_Filter.name == _Name) {
				_Ref = _Filter;
			}
		}

		if (_Ref == null) {
			_Ref = new filter(_Name, this);
			this.filters.push(_Ref);
		}
		return _Ref;
	};

	this.Source = function (/*string*/ _Name) {
		var _Ref = null;
		for (let _Source of this.sources) {
			if (_Source.name == _Name) {
				_Ref = _Source;
			}
		}

		if (_Ref == null) {
			_Ref = new source(_Name, this);
			this.sources.push(_Ref);
		}
		return _Ref;
	}
};

// class source_incdices
function source_position(/*source*/ _Source) {
	var _Temp = _Source.position % 40;

	this.position = _Source.position;
	this.row   = Math.trunc(_Source.position / 40);
	this.col   = Math.trunc(_Temp / 10);
	this.line  = Math.trunc(_Temp % 10);
	this.links = Array();

	for (let _Include of _Source.includes) {
		this.links.push(new source_position(_Include));
	}
}


var RowHeight  = 0;
var CellHeight = 0;
var CellWidth  = 0;
function cast_svg_links(_Pos) {
	var x1 = _Pos.col * CellWidth;
	var y1 = _Pos.row * RowHeight + _Pos.line * CellHeight;

	var _Str = "";
	for (let _Link of _Pos.links) {
		var x2 = _Link.col * CellWidth;
		var y2 = _Link.row * RowHeight + _Link.line * CellHeight;
		var halfx = CellWidth / 2;
		var halfy = CellHeight / 2;

		_Str += cast_svg_rect({ x: x2+5, y: y2+2.5 }, CellWidth-10, CellHeight-5, "fill:none; stroke:green");
		_Str += cast_svg_polyline(bezier_polyline({ x: x1+halfx, y: y1+halfy }, { x: x2+halfx, y: y2+halfy }), "fill:none; stroke:green;");
		_Str += cast_svg_links(_Link);
	}
	return _Str;
}

function source_onclick(_Source_position) {// LongJiangnan 2020.06.05
	var content = document.getElementById('content');
	var paint   = document.getElementById('paint');

	RowHeight = content.rows[0].cells[0].clientHeight;
	CellHeight = RowHeight / 10;
	CellWidth  = window.innerWidth / 4;
	var x1 = _Source_position.col * CellWidth;
	var y1 = _Source_position.row * RowHeight + _Source_position.line * CellHeight;

	paint.innerHTML = cast_svg_rect({ x: x1, y: y1 }, CellWidth, CellHeight, "fill:none; stroke:blue") +
		cast_svg_links(_Source_position);
}


function _Cast_svg_source(_Source) {
	var _Str = '';
	if (_Source.position != -1) {
		var _Onclick = "onclick='source_onclick(" + JSON.stringify(new source_position(_Source)) + ")' ";
		_Str += '<span ' + _Onclick + '><em>' + _Source.name + '</em></span> </br></br>';

		if ((_Source.position + 1) % 40 == 0) {// next-line
			_Str += '</td></tr> <tr><td valign="top">';
		} else if ((_Source.position + 1) % 10 == 0) {
			_Str += '</td> <td valign="top">';
		}
	}
	return _Str;
}

function _Cast_svg_filter(_Filter) {
	var _Str = '';
	if (_Filter.position != -1) {
		_Str += "<span> + <strong>" + _Filter.name + "</strong></span> </br></br>";
		if ((_Filter.position + 1) % 40 == 0) {// next-line
			_Str += '</td></tr> <tr><td valign="top">';
		} else if ((_Filter.position + 1) % 10 == 0) {
			_Str += '</td> <td valign="top">';
		}
	}
	return _Str;
}

function cast_svg_tag(_File) {
	if (_File.type !== undefined) {
		if ( is_source(_File) ) {
			return _Cast_svg_source(_File);
		} else if ( is_filter(_File) ) {
			var _This_str = _Cast_svg_filter(_File);

			for (let _Source of _File.sources) {
				_This_str += cast_svg_tag(_Source);
			}
			for (let _Filter of _File.filters) {
				_This_str += cast_svg_tag(_Filter);
			}
			return _This_str;
		}
	}

	return '';
}




var clmagic = new filter('clmagic', null);
clmagic.position = 0;

function expand_all(_File){
	var seq = _File.position + 1;
	for (let _Source of _File.sources) {
		_Source.position = seq++;
	}

	for (let _Filter of _File.filters) {
		_Filter.position = seq;
		seq = expand_all(_Filter);
	}

	return seq;
}

function initializer() {
	var clmagic_basic_h     = clmagic.Source('basic.h');
	var clmagic_math_h      = clmagic.Source('math.h');

	// <clmagic/basic/>
	var clmagic_basic = clmagic.Filter('basic');
	{
		var algorithm_h   = clmagic_basic.Source('algorithm.h');
		var chrono_h      = clmagic_basic.Source('chrono.h');
		var functional_h  = clmagic_basic.Source('functional.h');
		var fileproxy_h   = clmagic_basic.Source('fileproxy.h');
		var fstream_h     = clmagic_basic.Source('fstream.h');
		var logstream_h   = clmagic_basic.Source('logstream.h');
		var logcout_h     = clmagic_basic.Source('logcout.h');
		var string_h      = clmagic_basic.Source('string.h');
		var timer_wheel_h = clmagic_basic.Source('timer_wheel.h');
		var concurrent_resource_h = clmagic_basic.Source('concurrent_resource.h');
		var winapi_util_h = clmagic_basic.Source('winapi_util.h');
		var renderable_h  = clmagic_basic.Source('renderable.h');
	}

	var clmagic_calculation = clmagic.Filter('calculation');
	{
		var general = clmagic_calculation.Filter('general');
		{
			var clmagic_h  = general.Source('clmagic.h');
			var general_h  = general.Source('general.h');
			var bitset_h   = general.Source('bitset.h');
			var rational_h = general.Source('rational.h');
			var unit_h     = general.Source('unit.h');
			var real_h     = general.Source('real.h');
			var simd_h     = general.Source('simd.h');
			rational_h.Include(bitset_h);
			unit_h.Include(    rational_h);
		}

		var lapack = clmagic_calculation.Filter('lapack');
		{
			var vector_h    = lapack.Source('vector.h');
			var matrix_h    = lapack.Source('matrix.h');
			var geometry_h  = lapack.Source('geometry.h');
			var Euler_h     = lapack.Source('Euler.h');
			var Rodrigues_h = lapack.Source('Rodrigues.h');

			vector_h.Include( general.Source('clmagic.h') );
			vector_h.Include( general.Source('bitset.h') );
			vector_h.Include( general.Source('real.h') );
			vector_h.Include( general.Source('simd.h') );

			matrix_h.Include( vector_h );

			Euler_h.Include( general.Source('unit.h') );
			Euler_h.Include( matrix_h );

			Rodrigues_h.Include( general.Source('unit.h') );
			Rodrigues_h.Include( matrix_h );

			geometry_h.Include( vector_h );
			geometry_h.Include( matrix_h );
			geometry_h.Include( Euler_h );
			geometry_h.Include( Rodrigues_h );
		}

		var complex = clmagic_calculation.Filter('complex');
		{
			var WilliamRowanHamilton_h = complex.Source('WilliamRowanHamilton.h');

			WilliamRowanHamilton_h.Include( general.Source('unit.h') );
			WilliamRowanHamilton_h.Include( lapack.Source('vector.h') );
			WilliamRowanHamilton_h.Include( lapack.Source('matrix.h') );
			lapack.Source('geometry.h').Include(WilliamRowanHamilton_h);// 
		}

		var physics = clmagic_calculation.Filter('physics');
		{
			var atmosphere_scattering_h = physics.Source('atmosphere_scattering.h');
		}

		var fraction = clmagic_calculation.Filter('fraction');
		{
			var fraction_h = fraction.Source('fraction.h'); 
			var Perlin_h   = fraction.Source('Perlin.h'); 
			var Worley_h   = fraction.Source('Worley.h'); 
		}
	}

	// <DirectX>
	var clmagic_DirectX = clmagic.Filter('DirectX');
	{
		var hlsl_h      = clmagic_DirectX.Source('hlsl.h');
		var d3d12core   = clmagic_DirectX.Filter('d3d12core');
		var d3d12core_h = clmagic_DirectX.Source('d3d12core.h');
		{
			var d3dx12_h              = d3d12core.Source('d3dx12.h');
			var enum_string_h         = d3d12core.Source('enum_string.h');
			var packaged_comptr_h     = d3d12core.Source('packaged_comptr.h');
			var IDXGIFactory_h        = d3d12core.Source('IDXGIFactory.h');
			var ID3D12Device_h        = d3d12core.Source('ID3D12Device.h');
			var ID3D12CommandObjects_h = d3d12core.Source('ID3D12CommandObjects.h');
			var ID3D12Fence_h         = d3d12core.Source('ID3D12Fence.h');
			var ID3D12RootSignature_h = d3d12core.Source('ID3D12RootSignature.h');
			var ID3D12PipelineState_h = d3d12core.Source('ID3D12PipelineState.h');
			var ID3D12Resource_h      = d3d12core.Source('ID3D12Resource.h');
			var ID3D12Resource_b_h    = d3d12core.Source('ID3D12Resource_b.h');
			var ID3D12Resource_t_h    = d3d12core.Source('ID3D12Resource_t.h');
			var IDXGISwapChain_h      = d3d12core.Source('IDXGISwapChain.h');
			var ID3D12DescriptorHeap_h = d3d12core.Source('ID3D12DescriptorHeap.h');

			IDXGIFactory_h.Include(       packaged_comptr_h);
			ID3D12Device_h.Include(       IDXGIFactory_h);
			ID3D12Device_h.Include(       d3dx12_h);
			ID3D12CommandObjects_h.Include(ID3D12Device_h);
			ID3D12Fence_h.Include(        ID3D12Device_h);
			ID3D12Fence_h.Include(        ID3D12CommandObjects_h);
			ID3D12RootSignature_h.Include(ID3D12Device_h);
			ID3D12RootSignature_h.Include(enum_string_h);
			ID3D12PipelineState_h.Include(ID3D12RootSignature_h);
			ID3D12Resource_h.Include(     ID3D12Device_h);
			ID3D12Resource_h.Include(     ID3D12Fence_h);
			ID3D12Resource_h.Include(     ID3D12CommandObjects_h);
			ID3D12Resource_h.Include(     enum_string_h);
			ID3D12Resource_b_h.Include(   ID3D12Resource_h);
			ID3D12Resource_t_h.Include(   ID3D12Resource_h);
			IDXGISwapChain_h.Include(     IDXGIFactory_h);
			IDXGISwapChain_h.Include(     ID3D12Resource_t_h);
			ID3D12DescriptorHeap_h.Include(ID3D12Resource_t_h);
			d3d12core_h.Include(d3dx12_h);
			d3d12core_h.Include(enum_string_h);
			d3d12core_h.Include(packaged_comptr_h);
			d3d12core_h.Include(IDXGIFactory_h);
			d3d12core_h.Include(ID3D12Device_h);
			d3d12core_h.Include(ID3D12CommandObjects_h);
			d3d12core_h.Include(ID3D12Fence_h);
			d3d12core_h.Include(ID3D12RootSignature_h);
			d3d12core_h.Include(ID3D12PipelineState_h);
			d3d12core_h.Include(ID3D12Resource_h);
			d3d12core_h.Include(ID3D12Resource_b_h);
			d3d12core_h.Include(ID3D12Resource_t_h);
			d3d12core_h.Include(IDXGISwapChain_h);
		}
		var d3d12window_h        = clmagic_DirectX.Source('d3d12window.h');
		var d3d12renderable_h    = clmagic_DirectX.Source('renderable.h');
		var d3d12frameresource_h = clmagic_DirectX.Source('frame_resource.h');
		d3d12window_h.Include(    d3d12core_h);
		d3d12window_h.Include(    clmagic_basic.Source("winapi_util.h"));
		d3d12renderable_h.Include(d3d12core_h);
		d3d12renderable_h.Include(clmagic_basic.Source("renderable.h"));
		d3d12frameresource_h.Include(d3d12core_h);
	}
	// </DirectX>
}

function display() {
	var SVG = '';
	var svg_begin = "<tr><td>";
	var svg_end   = "</td></tr>";

	SVG += svg_begin;
	SVG += cast_svg_tag(clmagic);
	SVG += svg_end;

	document.getElementById('content').innerHTML = SVG;
}


initializer();
expand_all(clmagic);
display();
