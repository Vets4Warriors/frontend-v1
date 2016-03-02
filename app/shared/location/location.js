/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('location-directives', []);

    app.service('locationService', [/*'$resource',*/ '$http',
        // Not currently using the resource. Want to be explicit. When I get better at angular.
        // Will probably be rewritten using $resource
        function(/*$resource,*/ $http) {
            "use strict";
            var baseApiUrl = 'http://localhost:8000/api/1.0/locations';
            var service = this;

            /**
             *
             * @type {LocationAddress}
             */
            this.LocationAddress = class LocationAddress {
                constructor(jsonData) {
                    this.address1 = jsonData['address1'];
                    this.address2 = jsonData['address2'];
                    this.city = jsonData['city'];
                    this.state = jsonData['state'];
                    this.country = jsonData['country'];
                    this.latLng = jsonData['latLng'];
                    this.zipcode = jsonData['zipcode'];
                }

                /**
                 *
                 * @returns {string}
                 */
                getFormatted() {
                    var addrLine = this.address1 + ((this.address2 === '') ? '' : ", " + this.address2);
                    return addrLine + ", " + this.city + ", " + this.state + ", " + this.country + ", " + this.zipcode;
                }
            };

            /**
             *
             * @type {LocationRating}
             */
            this.LocationRating = class LocationRating {
                constructor(jsonData) {
                    this.comment = jsonData['comment'];
                    this.ratedOn = new Date(jsonData['ratedOn'].$date);
                    this.user = jsonData['user'];
                    this.value = jsonData['value'];
                };

                static fromJsonArray (jsonArray) {
                    var ratings = [];
                    for (var i = 0; i < jsonArray.length; i++) {
                        ratings.push(new this(jsonArray[i]));
                    }
                    return ratings;
                }
            };

            /**
             *
             * @type {Location}
             */
            this.Location = class Location {
                constructor(jsonData) {
                    // Duplication but should make posting easy
                    this.rawData = jsonData;
                    this.id = jsonData['_id']['$oid'];
                    this.name = jsonData['name'];
                    this.phone = jsonData['phone'];
                    this.email = jsonData['email'];
                    this.address = new service.LocationAddress(jsonData['address']);
                    this.hqAddress = jsonData['hqAddress'] === undefined ?
                        jsonData['hqAddress'] : new service.LocationAddress(jsonData['hqAddress']);
                    this.locationType = jsonData['locationType'];
                    this.coverage = jsonData['coverage'];
                    this.services = jsonData['services'];
                    this.tags = jsonData['tags'];
                    this.comments = jsonData['comments'];
                    this.rating = jsonData['rating'];
                    this.ratings = service.LocationRating.fromJsonArray(jsonData['ratings']);
                    this.website = jsonData['website'];
                    this.addedOn = new Date(jsonData['addedOn'].$date);
                    this.addedBy = jsonData['addedBy'];
                }

                /**
                 * Format the phone number so it's nice and read-able
                 * @returns {string}
                 */
                getPhone() {
                    return this.phone;
                }

                /**
                 *
                 * @returns {string}
                 */
                getFormattedAddr() {
                    return this.address.getFormatted();
                }

                /**
                 *
                 * @returns {string}
                 */
                getFormattedHqAddr() {
                    return this.hqAddress.getFormatted();
                }

                /**
                 *
                 * @param locationsArray
                 * @returns {Array} of Locations
                 */
                static fromJsonArray (jsonArray) {
                    var locations = [];
                    for (var i = 0; i < jsonArray.length; i++) {
                        locations.push(new this(jsonArray[i]));
                    }
                    return locations;
                };
            };



            /**
             *
             * @param id
             * @returns {HttpPromise}
             */
            this.get = function(id) {
                return $http.get(baseApiUrl + '/' + id);
            };

            /**
             *
             * @param params
             * @returns {HttpPromise}
             */
            this.query = function(params) {
                var url = Arg.url(baseApiUrl, params);
                return $http.get(url);
            };

            /**
             *
             * @param id
             * @param rating
             * @returns {HttpPromise}
             */
            this.rate = function(id, rating) {
                return $http.post(baseApiUrl + '/' + id + '/rate', rating);
            };

            /**
             *
             * @param id
             * @param location
             * @returns {HttpPromise}
             */
            this.update = function(id, location) {
                return $http.put(baseApiUrl + '/' + id, location);
            };

            /**
             *
             * @param id
             * @returns {HttpPromise}
             */
            this.delete = function(id){
                return $http.delete(baseApiUrl + '/' + id);
            };

            /**
             *
             * @param location
             * @returns {HttpPromise}
             */
            this.add = function(location) {
                return $http.post(baseApiUrl, location);
            };
        }]);

    /**
     *  This controls the list as a whole
     */
    app.controller('LocationsController', ['$scope', '$log', 'locationService',
        function($scope, $log, locationService) {
        var list = this;
        list.locations = [];
        list.locationService = locationService;

        locationService.query({})
            .success(function(data) {
                list.locations = list.locationService.Location.fromJsonArray(angular.fromJson(data));
            })
            .error(function(data) {
                $log.error(data);
            });
    }]);

    /**
     *  The main container for each location.
     */
    app.directive('locationCard', function() {
       return {
           restrict: 'E',
           templateUrl: '../shared/location/location-card.html',
           controller: function() {
               this.tab = 0;

               this.isShowing = function(tabIndex) {
                   return tabIndex === this.tab;
               };

               this.setTab = function(tabIndex) {
                   this.tab = tabIndex;
               }
           },
           controllerAs: "card"
       };
    });

    /**
     *
     */
    app.directive('locationRating', function() {
        return {
            restrict: 'E',
            templateUrl: '../shared/location/location-rating.html',
            controller: ['$scope', function($scope) {
                $scope.averageRating = function(ratings) {
                    var sum = 0;
                    for (var i = 0; i < ratings.length; i++) {
                        sum += ratings[i].value;
                    }

                    return ratings.length != 0 ? sum/ratings.length : 0;
                };
            }]
        };
    });

    /**
     *  Part of the location card. Tab to display basic location info
     */
    app.directive('locationInfo', function() {
       return {
           restrict: 'E',
           templateUrl: '../shared/location/location-info.html'
       }
    });

    /**
     *  Part of the location card. Tab to display basic location info
     */
    app.directive('locationContact', function() {
        return {
            restrict: 'E',
            templateUrl: '../shared/location/location-contact.html'
        }
    });

})();