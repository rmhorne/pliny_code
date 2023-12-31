$(document).ready(function() {
    // Initialize Leaflet map
    var map = L.map('map').setView([51.505, -0.09], 13);

    var mapBounds = new L.LatLngBounds(
        new L.LatLng(-85.051129, -180),
        new L.LatLng(85.051129, 180));
    var mapMinZoom = 1;
    var mapMaxZoom = 11;

    // Add the base tile layer to the map
    L.tileLayer('https://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png', {
        minZoom: mapMinZoom, maxZoom: mapMaxZoom,
        bounds: mapBounds,
        opacity: 0.85
    }).addTo(map);

    // Initialize DataTable
    var datatable = $('#datatable').DataTable();

    // Variable to store the temporary marker
    var tempMarker = null;

    // Create a new GeoJSON layer for lines
    var linesLayer = L.geoJSON(null, {
        style: function(feature) {
            return {
                color: 'blue',
                weight: 2
            };
        },
        onEachFeature: function(feature, layer) {
            layer.bindPopup(feature.properties.Dir_entry1);
        }
    }).addTo(map);

    // Variable to store the point features
    var pointFeatures;

    // Variable to store the lines GeoJSON data
    var linesData;

    // Read the Points GeoJSON file
    $.getJSON('Pliny_Points.geojson', function(pointsData) {
        // Create a new empty SVG layer
        var svgLayer = L.svg();
        svgLayer.addTo(map);

        // Create a D3 selection for the SVG layer
        var svg = d3.select('#map').select('svg').select('g');

        // Bind data to SVG elements for points
        pointFeatures = svg.selectAll('path')
            .data(pointsData.features)
            .enter()
            .append('path')
            .attr('d', function(d) {
                // Customize the shape based on the Ftr_Type property
                var ftrType = d.properties.Ftr_Type;
                if (ftrType === 'town') {
                    return d3.symbol().type(d3.symbolCircle)();
                } else if (ftrType === 'mountain') {
                    return d3.symbol().type(d3.symbolSquare)();
                } else {
                    return d3.symbol().type(d3.symbolTriangle)();
                }
            })
            .style('fill', function(d) {
                // Customize the fill color based on the Ftr_Type property
                var ftrType = d.properties.Ftr_Type;
                if (ftrType === 'town') {
                    return 'white';
                } else if (ftrType === 'mountain') {
                    return 'brown';
                } else {
                    return 'red';
                }
            })
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .style("pointer-events", "auto");

        // Attach feature properties to the corresponding SVG markers for points
        pointFeatures.each(function(d, i) {
            var marker = d3.select(this);
            marker.node().__data__.properties = d.properties;
        });

        // Handle click events on the SVG markers for points
        pointFeatures.on('click', function(d) {
            // Remove the previous temporary marker if exists
            if (tempMarker) {
                map.removeLayer(tempMarker);
            }

            // Get the coordinates of the clicked feature
            var coordinates = d.currentTarget.__data__.geometry.coordinates;

            // Create a temporary marker with a customized shape and style
            tempMarker = L.marker([coordinates[1], coordinates[0]], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: '<div style="background-color: orange;"></div>',
                    iconSize: [16, 16]
                })
            }).addTo(map);

            // Open the popup
            tempMarker.bindPopup(d.currentTarget.__data__.properties.Dir_entry1).openPopup();
        });

        // Update the SVG elements for points on map move/zoom
        map.on('moveend', update);

        // Initial update of the SVG elements for points
        update();

        // Loop through each point feature
        pointsData.features.forEach(function(feature) {
            // Add a row to the DataTable
            datatable.row.add([feature.properties.Dir_entry1]).draw();
        });
    });

    // Read the Lines GeoJSON file
    $.getJSON('Pliny_Lines.geojson', function(data) {
        // Store the lines GeoJSON data
        linesData = data;

        // Add the line features to the lines GeoJSON layer
        linesLayer.addData(linesData);

        // Loop through each line feature
        linesData.features.forEach(function(feature) {
            // Add a row to the DataTable
            datatable.row.add([feature.properties.Dir_entry1]).draw();
        });
    });

// Zoom to a feature and open a popup when a row is clicked
$('#datatable tbody').on('click', 'tr', function() {
    // Get the index of the clicked row
    var index = datatable.row(this).index();

    // Get the corresponding feature from the GeoJSON
    var feature;
    if (index < pointFeatures.size()) {
        feature = pointFeatures.data()[index];
    } else {
        feature = linesData.features[index - pointFeatures.size()];
    }

    // Get the coordinates from the feature
    var coordinates;
    if (feature.geometry.type === 'Point') {
        coordinates = feature.geometry.coordinates;
    } else if (feature.geometry.type === 'LineString') {
        coordinates = getLineStringMiddlePoint(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'MultiLineString') {
        coordinates = getMultiLineStringMiddlePoint(feature.geometry.coordinates);
    }

    // Create a temporary marker with a customized shape and style
    tempMarker = L.marker([coordinates[1], coordinates[0]], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: orange;"></div>',
            iconSize: [16, 16]
        })
    }).addTo(map);

    // Open the popup
    tempMarker.bindPopup(feature.properties.Dir_entry1).openPopup();

    // Zoom to the feature
    map.setView(tempMarker.getLatLng(), 13);
});

    // Toggle the DataTable visibility
    $('#toggle-datatable-btn').click(function() {
        $('#datatable-container').toggle();
    });

    // Add the GeoJSON layer to the Leaflet layer selector
    var baseLayers = {
        'Base Layer': L.tileLayer('https://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png', {
            minZoom: mapMinZoom,
            maxZoom: mapMaxZoom,
            bounds: mapBounds,
            opacity: 0.85
        })
    };

    var overlayLayers = {
        'Lines': linesLayer
    };

    L.control.layers(baseLayers, overlayLayers).addTo(map);

    function update() {
        // Update the position of SVG elements based on map coordinates for points
        pointFeatures.attr('transform', function(d) {
            var point = map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]);
            return 'translate(' + point.x + ',' + point.y + ')';
        });
    }

    function getLineStringMiddlePoint(coordinates) {
        var length = coordinates.length;
        var middleIndex = Math.floor(length / 2);
        return coordinates[middleIndex];
    }

    function getMultiLineStringMiddlePoint(coordinates) {
        var totalLength = 0;
        var segmentLengths = [];
        coordinates.forEach(function(lineString) {
            var lineStringLength = lineString.length;
            totalLength += lineStringLength;
            segmentLengths.push(totalLength);
        });

        var middleLength = totalLength / 2;

        var targetLineStringIndex = 0;
        for (var i = 0; i < segmentLengths.length; i++) {
            if (middleLength <= segmentLengths[i]) {
                targetLineStringIndex = i;
                break;
            }
        }

        var targetLineString = coordinates[targetLineStringIndex];
        var targetLineStringLength = targetLineString.length;
        var targetSegmentLength = segmentLengths[targetLineStringIndex];

        var middleSegmentLength = middleLength - (targetSegmentLength - targetLineStringLength);
        var middleIndex = 0;
        for (var j = 0; j < targetLineStringLength; j++) {
            var segmentStart = targetLineString[j];
            var segmentEnd = targetLineString[j + 1];
            var segmentLength = distance(segmentStart[1], segmentStart[0], segmentEnd[1], segmentEnd[0]);
            if (middleSegmentLength <= segmentLength) {
                middleIndex = j;
                break;
            } else {
                middleSegmentLength -= segmentLength;
            }
        }

        var middleSegmentStart = targetLineString[middleIndex];
        var middleSegmentEnd = targetLineString[middleIndex + 1];
        var interpolatedCoordinates = interpolate(middleSegmentStart[1], middleSegmentStart[0], middleSegmentEnd[1], middleSegmentEnd[0], middleSegmentLength);
        return interpolatedCoordinates;
    }

    function distance(lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p) / 2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p)) / 2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }

    function interpolate(lat1, lon1, lat2, lon2, fraction) {
        var lat = (1 - fraction) * lat1 + fraction * lat2;
        var lon = (1 - fraction) * lon1 + fraction * lon2;
        return [lat, lon];
    }
});
