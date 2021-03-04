
/*<elements-tree>
	<body offsetParent='null' offsetLeft='this.x in window' offsetTop='this.y in window' offsetWidth='this.width' offsetHeight='this.height'>
		<table offsetParent='body' offsetLeft='this.x in body' offsetTop='this.y in body' offsetWidth='this.width' offsetHeight='this.height'>
			<tr offsetParent='table' offsetLeft='this.x in table' offsetTop='this.y in table' offsetWidth='this.width' offsetHeight='this.height'>
				<td offsetParent='tr' offsetLeft='this.x in tr' offsetTop='this.y in tr' offsetWidth='this.width' offsetHeight='this.height'>
					...
				</td>
				...
			</tr>
			...
		</table>
	</body>
</elements-tree> */

function ASSERT(flag, message) {
	if (flag != true) {
		throw message;
	}
}

// { class POINT }
function POINT(_X, _Y) {
	this.x = _X !== undefined ? _X : 0;
	this.y = _Y !== undefined ? _Y : 0;
}

// { class RECT }
function RECT(_Left, _Top, _Width, _Height) {
	this.left   = _Left !== undefined ? _Left : 0;
	this.top    = _Top  !== undefined ? _Top : 0;
	this.width  = _Width !== undefined ? _Width : 0;
	this.height = _Height !== undefined ? _Height : 0;

	this.Center = function () {
		return new POINT(this.left + this.width/2, this.top + this.height/2);
	};
}

function GetHTMLElementAbsoluteRect(element) {
	if ( element.offsetParent != null ) {
		var parentRect = GetHTMLElementAbsoluteRect(element.offsetParent);
		return new RECT(element.offsetLeft + parentRect.left,
					element.offsetTop  + parentRect.top,
					element.offsetWidth,
					element.offsetHeight);
	} else {
		return new RECT(element.offsetLeft, element.offsetTop, element.offsetWidth, element.offsetHeight);
	}
}



// { <polyline style='style' points='vertices'></polyline> }
function cast_svg_polyline(vertices, style) {
	var svg_polyline = "<polyline style='" + style + "' points='";
	for (let point of vertices) {
		svg_polyline += point.x + ',';
		svg_polyline += point.y + ' ';
	}
	svg_polyline += "'></polyline>";

	return svg_polyline;
}

// { <line style='style' x1='p1.x' y1='p1.y' x2='p2.x' y2='p2.y'></line> }
function cast_svg_line(p1, p2, style) {
	var svg_line = "<line style='" + style + "' ";
	svg_line += "x1='" + p1.x + "' ";
	svg_line += "y1='" + p1.y + "' ";
	svg_line += "x2='" + p2.x + "' ";
	svg_line += "y2='" + p2.y + "'></line>";

	return svg_line;
}

// { <rect style='style' x='p.x' y='p.y' width='w' height='h'></rect> }
function cast_svg_rect(p, w, h, style) {
	var svg_rect = "<rect style='" + style + "' ";
	svg_rect +=      "x='" + p.x + "' ";
	svg_rect +=      "y='" + p.y + "' ";
	svg_rect +=  "width='" + w   + "' ";
	svg_rect += "height='" + h   + "'></rect>";

	return svg_rect;
}

// { C * (t^i) * [(1-t)^(n-i)] }
function Bernstein(n, i, t, C){	
	//static_assert(std:: is_integral < _Tyn >, "invalid template argument, Bernstein(_Tyn, _Tyn, _in(_Ty))");
	return (C * Math.pow(t, i) * Math.pow(1-t, n-i));
}

// { ... }
function generate_bezier_vertices(p1, p3) {
	var p2 = { x: p1.x + 40, y: p1.y };
	// C: 1 2 1
	var vertices = Array(p1);
	for (var t = 0.1; t < 1.0; t += 0.1) {
		var b1 = Bernstein(2, 0, t, 1);
		var b2 = Bernstein(2, 1, t, 2);
		var b3 = Bernstein(2, 2, t, 1);
		vertices.push({ x: b1 * p1.x + b2 * p2.x + b3 * p3.x,
						y: b1 * p1.y + b2 * p2.y + b3 * p3.y });
	}
	vertices.push(p3);

	return vertices;
}



// { class tree file information, base class }
function TREEFILE(/*string*/ _Name, /*file?*/ _Parent) {
	this.type     = 'file';
	this.name     = _Name; 
	this.parent   = _Parent !== undefined ? _Parent : null;
	this.position = -1;

	this.FullPath = function () {
		if (this.parent != null) {
			return this.parent.FullPath() + '/' + this.name;
		} else {
			return this.name;
		}
	};
}

// { class tree source information, concrete class }
function TREESOURCE(/*string*/ _Name, /*filter*/ filterInformation) {
	ASSERT(_Name !== undefined, "SOURCEINF::constructor(##undefined##, filterInformation)");
	ASSERT(filterInformation !== undefined, "SOURCEINF::constructor(_Name, ##undefined##)");
	ASSERT(IsFilterInformation(filterInformation), "SOURCEINF::constructor(_Name, ##ERROR##)");

	TREEFILE.call(this, _Name, filterInformation);

	this.type       = 'source';
	this.visibility = true;
	this.includes   = Array();// item[]

	this.IsIncluded = function (sourceInformation) {
		ASSERT(IsSourceInformation(sourceInformation), "void SOURCEINF::Include(##ERROR##)");

		for (let x of this.includes) {
			if (x.name == sourceInformation.name) {
				return true;
			}
		}

		return false;
	}

	this.Include = function (sourceInformation) {
		ASSERT(IsSourceInformation(sourceInformation), "void SOURCEINF::Include(##ERROR##)");
		ASSERT(sourceInformation != this, "void SOURCEINF::Include(##circular##)");

		if (!this.IsIncluded(sourceInformation)) {
			this.includes.push(sourceInformation);
		}
	};
}

// { class tree filter information, concrete class }
function TREEFILTER(/*string*/ _Name, /*file?*/ _Parent) {
	TREEFILE.call(this, _Name, _Parent);

	this.type    = 'filter';
	this.filters = Array();// filter[]
	this.sources = Array();// source[]
	this.x = 0;
	this.y = 0;

	this.Size = function () {
		var _Size = this.sources.length;
		for (let _Filter of this.filters) {
			_Size += _Filter.Size();
		}
		return _Size;
	}

	this.Find = function (_Name) {
		for (let x of this.sources) {
			if (x.name == _Name) {
				return x;
			}
		}

		return null;
	};

	this.RecursionFind = function (_Name) {
		for (let x of this.sources) {
			if (x.name == _Name) {
				return x;
			}
		}

		for (let x of this.filters) {
			var _Where = x.RecursionFind(_Name);
			if (_Where != null) {
				return _Where;
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
			_Ref = new TREEFILTER(_Name, this);
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
			_Ref = new TREESOURCE(_Name, this);
			this.sources.push(_Ref);
		}
		return _Ref;
	}
};

function _Is_typeX(_Object, _String) {
	if ( _Object != undefined && _Object != null && _Object.type != undefined ) {
		if ( _String == _Object.type ) {
			return true;
		}
	}
	return false;
}

function IsFilterInformation(_File) {
	return _Is_typeX(_File, 'filter');
}

function IsSourceInformation(_File) {
	return _Is_typeX(_File, 'source');
}



// { class SourceInformation }
function SourceInformation(_Name) {
	this.name     = _Name;
	this.includes = Array();// SOURCE[]
}

function ToSourceInformationFromTreesource(sourceInformation) {
	var source = new SourceInformation(sourceInformation.FullPath());
	for (let x of sourceInformation.includes) {
		source.includes.push(ToSourceInformationFromTreesource(x));
	}

	return source;
}

function ToSVGPolylineFromSourceInformation(prevCenter, sourceInformation) {
	var element = document.getElementById(sourceInformation.name);
	var rect    = GetHTMLElementAbsoluteRect(element);
	var center  = rect.Center();

	var SVG = cast_svg_rect({ x: rect.left, y: rect.top }, rect.width, rect.height, "fill:none; stroke:green");
	    SVG += cast_svg_polyline(generate_bezier_vertices(prevCenter, center), "fill:none; stroke:green;");

	for (let x of sourceInformation.includes) {
		SVG += ToSVGPolylineFromSourceInformation(center, x);
	}

	return SVG;
}

function SourceInformationOnclick(sourceElement, sourceInformation) {// LongJiangnan 2020.06.05
	var paint = document.getElementById('paint');

	var rect = GetHTMLElementAbsoluteRect(sourceElement);

	//paint.innerHTML = cast_svg_rect({ x: x1, y: y1 }, CellWidth, CellHeight, "fill:none; stroke:blue") +
	//	cast_svg_links(_Source_position);
	paint.innerHTML = cast_svg_rect({ x: rect.left-5, y: rect.top-5 }, rect.width+10, rect.height+10, "fill:none; stroke:blue");
	paint.innerHTML += ToSVGPolylineFromSourceInformation(rect.Center(), sourceInformation);
}

function ToHTMLElementFromSourceInformation(sourceInformation) {
	ASSERT(IsSourceInformation(sourceInformation), 'String clmagic::ToHTMLElementFromSourceInformation(##ERROR##)');

	var elementString = '';
	if (sourceInformation.visibility) {
		elementString = '<div id="' + sourceInformation.FullPath() + '" onclick=\'SourceInformationOnclick(this, ' + JSON.stringify(ToSourceInformationFromTreesource(sourceInformation)) + ')\'><em>'
				      + sourceInformation.name
					  + '</em></div>';
	}

	return elementString;
}

function ToHTMLElementFromFilterInformation(filterInformation) {
	ASSERT(IsFilterInformation(filterInformation), 'String clmagic::ToHTMLElementFromFilterInformation(##ERROR##)');

	// 1. Create FILTER-HTMLElement from filterInformation
	var elementString = "<div style='position: absolute; left:" + filterInformation.x + "px; top:" + filterInformation.y + "px;'> <div><strong>" + filterInformation.name + "</strong></div>";
	// 2. Create many SOURCE-HTMLElement from filterInformation.sources
	for (let x of filterInformation.sources) {
		elementString += ToHTMLElementFromSourceInformation(x);
	}
	// 3. Create many FILTER-HTMLElement from filterInformation.filters
	for (let x of filterInformation.filters) {
		elementString += ToHTMLElementFromFilterInformation(x);
	}

	elementString += "</div>";
	return elementString;
}

function ToHTMLElementFromFileInformation( fileInfomation ) {
	ASSERT(fileInfomation.type !== undefined, 'String clmagic::ToHTMLElementFromFileInformation(##undefined##)');

	if ( IsSourceInformation(fileInfomation) ) {
		return ToHTMLElementFromSourceInformation(fileInfomation);
	} else /*if ( IsFilterInformation(fileInfomation) )*/ {
		return ToHTMLElementFromFilterInformation(fileInfomation);
	}
}





var clmagic = new TREEFILTER('clmagic', null);

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
	clmagic_calculation.x = 300;
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
		lapack.x = 120;
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
		complex.x = 240;
		{
			var WilliamRowanHamilton_h = complex.Source('WilliamRowanHamilton.h');

			WilliamRowanHamilton_h.Include( general.Source('unit.h') );
			WilliamRowanHamilton_h.Include( lapack.Source('vector.h') );
			WilliamRowanHamilton_h.Include( lapack.Source('matrix.h') );
			lapack.Source('geometry.h').Include(WilliamRowanHamilton_h);// 
		}

		var physics = clmagic_calculation.Filter('physics');
		physics.x = 240;
		physics.y = 50;
		{
			var atmosphere_scattering_h = physics.Source('atmosphere_scattering.h');
		}

		var fraction = clmagic_calculation.Filter('fraction');
		fraction.x = 480;
		{
			var fraction_h = fraction.Source('fraction.h'); 
			var Perlin_h   = fraction.Source('Perlin.h'); 
			var Worley_h   = fraction.Source('Worley.h'); 
		}
	}

	// <DirectX>
	var clmagic_DirectX = clmagic.Filter('DirectX');
	clmagic_DirectX.x = 600;
	clmagic_DirectX.y = 200;
	{
		var hlsl_h      = clmagic_DirectX.Source('hlsl.h');
		var d3d12core   = clmagic_DirectX.Filter('d3d12core');
		d3d12core.x = 100;
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

function expand(_File){
	//var seq = _File.position + 1;
	//for (let _Source of _File.sources) {
	//	_Source.position = seq++;
	//}

	//for (let _Filter of _File.filters) {
	//	_Filter.position = seq;
	//	seq = expand_all(_Filter);
	//}

	//return seq;
}

function display() {
	document.body.innerHTML += ToHTMLElementFromFileInformation(clmagic);
}


initializer();
expand(clmagic);
display();
