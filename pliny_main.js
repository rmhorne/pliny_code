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

    // Read the GeoJSON file
    $.getJSON('Pliny_Points.geojson', function(data) {
        // Create a new empty SVG layer
        var svgLayer = L.svg();
        svgLayer.addTo(map);

        // Create a D3 selection for the SVG layer
        var svg = d3.select('#map').select('svg').select('g');

        // Bind data to SVG elements
        var features = svg.selectAll('path')
            .data(data.features)
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

        // Attach feature properties to the corresponding SVG markers
        features.each(function(d, i) {
            var marker = d3.select(this);
            marker.node().__data__.properties = d.properties;
        });

        // Handle click events on the SVG markers
        features.on('click', function(d) {
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

        // Update the SVG elements on map move/zoom
        map.on('moveend', update);

        // Initial update of the SVG elements
        update();

        function update() {
            // Update the position of SVG elements based on map coordinates
            features.attr('transform', function(d) {
                var point = map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]);
                return 'translate(' + point.x + ',' + point.y + ')';
            });
        }

        // Loop through each feature
        data.features.forEach(function(feature) {
            // Add a row to the DataTable
            datatable.row.add([feature.properties.Dir_entry1]).draw();
        });

        // Zoom to a feature and open a popup when the row is clicked
        $('#datatable tbody').on('click', 'tr', function() {
            // Get the index of the clicked row
            var index = datatable.row(this).index();

            // Get the corresponding feature from the GeoJSON
            var feature = data.features[index];

            // Get the coordinates from the feature
            var coordinates = feature.geometry.coordinates;

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
    });

    // Toggle the DataTable visibility
    $('#toggle-datatable-btn').click(function() {
        $('#datatable-container').toggle();
    });
});
