//TEST VERSION WITH DIFFERENT WEATHER API

/*Lines 40 and 41 are the only line I am playing with/uncertain of. Looking at whether or
 not I need [i] for Timeframes.*/

'use strict';

//fetch and api variables

const apiNPS ='IfcsBFYkZPOU1J024K3TaNhMYXtHZ7bCHqZhtxrP';
const urlNPS ='https://developer.nps.gov/api/v1/campgrounds';
const apiWthr ='bef3fc1d798647285a40a276507cf08a';
const urlWthr ='http://api.weatherunlocked.com/api/forecast/us.';
const idWthr ='133c3d86';


var parks = [];
class Park {
  constructor(park, weather) {
    this.park_data = park;
    this.weather_data = weather;
  }
}
//parks.push(new Park(parkObj, weatherObj)); // <-- this is how you would add parks to the 'global' object

function getParks() {
  let queryString = formatQueryParams({
    stateCode: $('#js-search-term').val(),
    limit: 5,
    fields: "addresses",
    api_key: apiNPS
  });
  let url = urlNPS + '?' + queryString;
  $('#js-error-message').text('');
  $('.title-wrap > .loader').addClass('loading');
  parks = []; // empty the list of parks

  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(function(response) {
      // console.log('lets view parkObj:');
      // console.log(parkObj);
      $('.title-wrap > .loader').removeClass('loading');
      $('#park_results').html('');

      /* Add a check to prevent 'Cannot find blah blah of undefined' errors */
      if(!response || !response.hasOwnProperty('data') || !response.data.hasOwnProperty('length')){
        // not the data we are expecting
        throw new Error('Returned data has no length!');
      }

      for (let i=0; i<response.data.length; i++) {
        let item = response.data[i];
        let name = '';
        name = item['name'];
        if(item && name){

          if(!item.hasOwnProperty('addresses')){
            console.log('this result is missing the "addresses" field!');
          }else{
            $('#park_results').append('<div class="row" data-park-id="'+i+'"></div>'); // this becomes our 'hook' to find where to insert html after getWeather() runs
            getWeather(item, i); // ** only passing this single 'item' to getWeather, not the entire parkObj list
          }


        }else{
          console.log('oops! something went wrong with this one:');
          console.log(item);
        }

        if(i === response.data.length - 1){
          // run this block after the last iteration has finished
          console.log('all park objects:');
          console.log(parks);
        }
      }
    })
    .catch(err => {
      console.log('error happened');
      console.log(err);
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

function getWeather(target_item, index){

  // when working inside this function, remember that this function
  // is getting iterated over with each park object returned, so
  // we are only interested in the single iteration being called once at a time -> target_item

  const queryString = formatQueryParams({
    app_id:idWthr,
    app_key:apiWthr
  });

  let location_zip;
  console.log('target_item:');
  console.log(target_item);
  if(target_item['addresses'].hasOwnProperty('postalCode')){
    location_zip = target_item['addresses']['postalCode'];// only a single postal code returned
  }else if(target_item['addresses'].hasOwnProperty('length') && target_item['addresses'].length > 0){
    location_zip = target_item['addresses'][0].postalCode; // there are more than 1 zip code supplied, we'll take the first one
  }
  if(!location_zip){
    console.log('Whoops! No zip code found!');
    console.log(target_item);
    return;
  }
  // safe to rely on the zip code
  const url = urlWthr + location_zip + '?' + queryString;
  fetch(url)
    .then( response => {

      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then ( json_resp => {

      /* Add a check to prevent 'Cannot find blah blah of undefined' errors */
      if(!json_resp || !json_resp.hasOwnProperty('Days') || !json_resp.Days.hasOwnProperty('length')){
        throw new Error('No forecast days!');
      }

      displayWeather(json_resp, target_item, index); // single target_item passed into display function

    })
    .catch( err => {
      console.log('error reported!');
      console.log(err);
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

function displayWeather(resp, item, index){

  // console.log(resp);
  // console.log(item);
  let forecast = resp['Days'];
  if(!forecast || !forecast.length){
    console.log('could not cypher forecast!');
    return;
  }
  let forecast_html = '';
  for (let i=0;i<forecast.length;i++){ // iterate over each day returned
    forecast_html += '<div class="col">';
    forecast_html += '<h5 class="">'+forecast[i]['date']+'</h5>';
    if(forecast[i].hasOwnProperty('Timeframes') && forecast[i].Timeframes.length > 0){ // iterate over each 'Timeframes' received within a day
      for ( let j=0;j<forecast[i].Timeframes.length;j++){
        let timeframe = forecast[i].Timeframes[j];
        forecast_html += '<div>'+timeframe['utctime']+': '+timeframe['wx_desc']+ '</div>';
      }
    }
    forecast_html += '</div>';
  }

  let html = `<div class="col"><h3>${item.name}</h3>
  <p>State: ${item.addresses[0].stateCode}
  <p>Designation: ${item.accessibility.classifications}</p>
  <p>Description: ${item.description}</p>
  <p>Weather Info: ${item.weatheroverview}</p>
  <p>Directions: ${item.directionsUrl}</p>
  <p>Website: ${item.reservationsurl}</p>
  <h4>7-Day Forecast</h4>
  <div class="row forecast-row">${forecast_html}</div>
  </div>`;
  $(html).appendTo('[data-park-id='+index+']');

  parks.push(new Park(item, resp)); // stash this in a variable

  $('#results_2').removeClass('hidden');
}

//function to format query format query parameters

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

//form watcher

$(function(){
  $('#js-form').submit(function(e) {
    e.preventDefault();
    // getNPSResults($('#js-search-term').val());
    getParks();
  });
})

/*To Do:
Establish pages navigation feature
Expand result information displayed
*/

// Existing code presently unused
/*

//function to render both parkObj and weatherObj

function displayResults(parkObj, weatherObj) {
  console.log(parkObj)
  console.log(weatherObj)
  $('#results-list').empty();
  for (let i=0; i <parkObj.data.length; i++){
    $('#results-list').append(
      `<li><h3>${parkObj.data[i].name}</h3>
      <p>State: ${parkObj.data[i].addresses.stateCode}
      <p>Designation: ${parkObj.data[i].accessibility.classifications}</p>
      <p>Description: ${parkObj.data[i].description}</p>
      <p>Weather Info: ${parkObj.data[i].weatherOverview}</p>
      <p>Forecast: ${weatherObj.Days[i].Timeframes[i].date}</p>
      <p>${weatherObj.Days[i].Timeframes[i].wx_desc}</p>
      <p>Directions: ${parkObj.data[i].directionsUrl}</p>
      <p>Website: ${parkObj.data[i].reservationsUrl}</p>
      </li>`
    )};
  $('#results_2').removeClass('hidden');
}

//function to set api 1 params and send GET request

function getNPSResults(query) {
  const params = {
    stateCode: query,
    limit: 5,
    fields: "addresses",
    api_key: apiNPS
  };
  const queryString1 = formatQueryParams(params)
  const url1 = urlNPS + '?' + queryString1;
  console.log(url1);
  $('#parkObjects > .loader').addClass('loading');
  fetch(url1)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(function(parkObj) {
    // console.log('lets view parkObj:');
    // console.log(parkObj);
      $('#parkObjects > .loader').removeClass('loading');
      $('#park_results').html('');

      for (let i=0; i<parkObj.data.length; i++) {
        $('#park_results').append('<p>'+parkObj.data[i].name+'</p>');
        getWeatherResults(parkObj.data[i].addresses[0].postalCode);

      }
      //pulling the same postal code every time
    })
    .catch(err => {
      console.log('error happened');
      console.log(err);
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
  }

  //function to set api 2 params and send GET request

function getWeatherResults(parkObj) {
  const zip = parkObj;
  const params = {
    app_id:idWthr,
    app_key:apiWthr
  };
  const queryString2= formatQueryParams(params)
  const url2= urlWthr + zip + '?' + queryString2;
  console.log(url2);
  fetch(url2)
    .then(response => {
      // console.log('response:');
      // console.log(response);
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then (weatherObj => {displayResults (parkObj, weatherObj);
    })
    .catch(err => {
      console.log('error reported!');
      console.log(err);
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
  }

*/
