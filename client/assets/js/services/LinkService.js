(function () {
  'use strict';

  angular
    .module('fusionSeedApp.services.link', ['rison'])
    .constant('BLANK_QUERY', blankQuery)
    .constant('QUERY_PARAM', 'query')
    .factory('LinkService', LinkService);

  var blankQuery = {
    q: '*:*',
    start: 0
  };

  function LinkService($log, $rison, $state, $location, QueryService, BLANK_QUERY,
    QUERY_PARAM) {
    'ngInject';
    return {
      setQuery: setQuery,
      getQueryFromUrl: getQueryFromUrl
    };

    function encodeSlashes(queryObject){
      var newQueryObject = {};
      _.forIn(queryObject, function(item, key){
        if(_.isArray(item) || _.isObject(item)){
          newQueryObject[key] = encodeSlashes(item);
        }
        else if(_.isString(item)){
          newQueryObject[key] = item.replace(/\//g,'%2F');
        }
        else{
          newQueryObject[key] = item;
        }
      });
      return newQueryObject;
    }

    function isArrayable(item){
      var stuff = _.keys(item);

      var stuffToCheck = _.chain(stuff).map(function(value){
        return parseInt(value);
      })
      .filter(function(value){
        return _.isNumber(value);
      })
      .value();
      return stuff.length === stuffToCheck.length;
    }

    function convertToArray(item){
      var newArray = [];
      var newArrayLength = 0;
      _.forIn(item, function(item, key){
        newArrayLength++;
        newArray[key] = item;
      });
      newArray.length = newArrayLength;
      return newArray;
    }

    function treatArrays(queryObject){
      var newQueryObject = _.isArray(queryObject)?[]:{};
      _.forIn(queryObject, function(item, key){
        if(_.isObject(item) || _.isArray(item)){
          //Checking if the object could be an array by checking all the keys are integers
          //Rison specs are inadequate to decide, hence this piece of function
          var tempObject = treatArrays(item);
          if(_.isObject(item) && isArrayable(item)){
            tempObject = convertToArray(item);
          }
          newQueryObject[key] = tempObject;
        }
        else{
          newQueryObject[key] = item;
        }
      });
      return newQueryObject;
    }

    function setQuery(queryObject) {
      QueryService.setQuery(queryObject);
      var queryObjectToBeStringed = _.clone(QueryService.getQueryObject(),true);
      //Only need the slashes to get encoded, so that app state doesn't change
      queryObjectToBeStringed = encodeSlashes(queryObjectToBeStringed);
      var queryObjectString = $rison.stringify(queryObjectToBeStringed);
      var newStateObject = {};
      newStateObject[QUERY_PARAM] = queryObjectString;
      // Adding reloadOnSearch:false for now fixes the double reload bug SU-60
      // @see http://stackoverflow.com/a/22863315
      $state.go('home', newStateObject, {notify: false, reloadOnSearch: false});
    }

    function getQueryFromUrl() {
      var queryString = $location.search()[QUERY_PARAM];
      var queryObject;
      try{
        queryObject = queryString ? $rison.parse(decodeURIComponent(queryString)):BLANK_QUERY;
      }
      catch(e){
        $log.info('Cannot parse query URL');
        queryObject = BLANK_QUERY;
      }
      return treatArrays(queryObject);
    }
  }
})();
