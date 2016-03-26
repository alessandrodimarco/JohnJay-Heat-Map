// create and link 'MainController' controller to angular application
app.controller('MainController', mainController);

// inject dependencies into 'MainController' controller
mainController.$inject = ['$scope', '$http', 'leafletData', 'leafletBoundsHelpers', 'tableToMapService', 'mapInteraction'];

// controller function
function mainController($scope, $http, leafletData, leafletBoundsHelpers, tableToMapService, mapInteraction) {
    // save context
    var self = this;

    $scope.currentDate = "";

    // add map properties to scope
    initMap($scope);

    // post-processing
    postProcess($scope, $http, leafletData, mapInteraction);
}

// initialize and display map on webpage
var initMap = function(self) {
    // leaflet map settings
    angular.extend(self, {
        // default map properties
        defaults: {
            minZoom: 1,
            maxZoom: 3.6,
            crs: 'Simple'
        },

        // center map properties
        center: {
            lat: -190,
            lng: 150,
            zoom: 1
        },

        // set bounds
        // maxBounds: bounds,

        // layers
        layers: {
            baselayers: {
                tenthFloor: {
                    name: 'Tenth Floor',
                    type: 'imageOverlay',
                    url: 'app/assets/images/10thFloor.jpg',
                    // will fix this later
                    bounds: [
                        [0, 347.8552729775042],
                        [-374.5753081706553, 0]
                    ]
                }
            }
        }
    });
};

// get json files from local storage
var getJSON = function($scope, $http) {
    // function to make http call to get content of JSON
    return getRoomDataFromJson = new Promise(function(resolve, reject) {
        $http.get('app/assets/json/floor_10/room_num.json').then(function(response) {
            var roomNumbers = response;
            $http.get('app/assets/json/floor_10/vav.json').then(function(response) {
                resolve({'roomNumbers': roomNumbers, 'vavBoxes': response});
            });
        });
    });
};

// execute - will re-write this!
var postProcess = function($scope, $http, leafletData, mapInteraction) {
    leafletData.getMap('map').then(function(map) {
        var data = getJSON($scope, $http).then(function(response) {
            var roomNumbers = response.roomNumbers.data;
            var vavBoxes = response.vavBoxes.data;
            mapInteraction.addAllVavsToMap($scope, map, roomNumbers, vavBoxes);

            var info = L.control();

            info.onAdd = function(map) {
                this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"

                var html = "<div class='btn-group-vertical'>";
                for (var key in vavBoxes) {
                    if(key in mapInteraction.vectorLayers) {
                        state = 'checked';
                    } else {
                        state = 'unchecked';
                    }
                    html += "<input type='checkbox' class='vav' name='" + key + "'" + state + ">" + key + "</input><br>";
                }
                html += "</div>";

                this._div.innerHTML = html;
                return this._div;
            };

            info.addTo(map);

            function handleCommand() {
                if(this.checked) {
                    mapInteraction.addVavBoxToMap($scope, map, roomNumbers, vavBoxes, this.name);
                } else {
                    mapInteraction.removeVavBoxFromMap($scope, map, this.name);
                }
            };

            var checkboxes = document.getElementsByClassName('vav');
            for(var i = 0; i < checkboxes.length; i++) {
                checkboxes[i].addEventListener('click', handleCommand, false);
            }
        });
    });
};