$(document).ready(function() {
    // Initialize Leaflet map
    var map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Initialize DataTables
    var table = $('#indexTable').DataTable();

    // Toggle button functionality
    $('#toggleBtn').on('click', function() {
        $('#indexContainer').toggle();
    });

    // Read GeoJSON file and add features to map and index
    $.getJSON('Pliny_Points.geojson', function(data) {
        L.geoJSON(data, {
            onEachFeature: function(feature, layer) {
                // Add feature to map
                layer.addTo(map);

                // Add feature to index
                table.row.add([
                    feature.properties.Dir_entry1,
                    feature.geometry.coordinates.toString()
                ]).draw();

                // Zoom and open popup on table row click
                layer.on('click', function() {
                    map.setView(layer.getBounds().getCenter());
                    layer.openPopup();
                });
            }
        });
    });
});
