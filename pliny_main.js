$(document).ready(function() {
    // Initialize Leaflet map
    var map = L.map('map').setView([51.505, -0.09], 13);

    // Add the base tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    // Initialize DataTable
    var datatable = $('#datatable').DataTable();

    // Variable to store the temporary marker
    var tempMarker = null;

    // Read the GeoJSON file
    $.getJSON('Pliny_Points.geojson', function(data) {
        // Initialize an empty array to store markers
        var markers = [];

        // Loop through each feature
        data.features.forEach(function(feature) {
            // Get the coordinates of the feature
            var coordinates = feature.geometry.coordinates;

            // Create a marker at the coordinates
            var marker = L.marker([coordinates[1], coordinates[0]]);
            
            // Add a popup to the marker with data from DataTables
            marker.bindPopup(feature.properties.Dir_entry1);

            // Add the marker to the map
            marker.addTo(map);

            // Store the marker in the markers array
            markers.push(marker);

            // Add a row to the DataTable
            datatable.row.add([feature.properties.Dir_entry1]).draw();
        });

        // Handle row click event
        $('#datatable tbody').on('click', 'tr', function() {
            // Remove the previous temporary marker if exists
            if (tempMarker) {
                map.removeLayer(tempMarker);
            }

            // Get the index of the clicked row
            var index = datatable.row(this).index();

            // Get the corresponding feature from the GeoJSON
            var feature = data.features[index];

            // Get the coordinates from DataTables
            var coordinates = feature.geometry.coordinates;

            // Create a temporary marker with an orange circle
            tempMarker = L.circleMarker([coordinates[1], coordinates[0]], {
                color: 'orange',
                radius: 8,
                fillOpacity: 1
            }).addTo(map);
            
            // Add a popup to the temporary marker with data from DataTables
            tempMarker.bindPopup(datatable.row(index).data()[0]);

            // Zoom to the temporary marker
            map.setView(tempMarker.getLatLng(), 13);

            // Open the popup of the temporary marker
            tempMarker.openPopup();
        });
    });

    // Toggle the DataTable visibility
    $('#toggle-datatable-btn').click(function() {
        $('#datatable-container').toggle();
    });
});
