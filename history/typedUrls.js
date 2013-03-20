// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Event listner for clicks on links in a browser action popup.
// Open the link in a new tab of the current window.
function onAnchorClick(event) {
  chrome.tabs.create({
    selected: true,
    url: event.srcElement.href
  });
  return false;
}

function inNewTab(event){
//	var popupDiv = document.getElementById("typedUrl_div");
//	popupDiv.style.display = "none";
	var chartsDiv = document.getElementById("charts_div");
	chartsDiv.style.display = "";
	var p = document.getElementById("inp");
	if(p == undefined){
		p = document.createElement('p');
		p.id = "inp";
		p.appendChild(document.createTextNode("just a try"));
		chartsDiv.appendChild(p);
	}
	return false;
}

// Given an array of URLs, build a DOM list of those URLs in the
// browser action popup.
function buildPopupDom(divName, data,count) {
  var popupDiv = document.getElementById(divName);

  var ul = document.createElement('ul');
  popupDiv.appendChild(ul);

  for (var i = 0, ie = data.length; i < ie; ++i) {
    var p = document.createElement('span');
    p.appendChild(document.createTextNode(count[data[i]]));
    var a = document.createElement('a');
    a.href = data[i];
    a.appendChild(document.createTextNode(data[i]));
    a.addEventListener('click', onAnchorClick);

    var li = document.createElement('li');
    li.appendChild(a);
    li.appendChild(p);

    ul.appendChild(li);
  }
  var charts = document.createElement('a');
  charts.href = "./charts.html";
  charts.target = "_blank";
  charts.appendChild(document.createTextNode("vie the charts"));
  //charts.addEventListener('click',inNewTab);
  popupDiv.appendChild(charts);
}

// Search history to find up to ten links that a user has typed in,
// and show those links in a popup.
function buildTypedUrlList(divName) {
  // To look for history items visited in the last week,
  // subtract a week of microseconds from the current time.
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7*3;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;

  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;

  chrome.history.search({
      'text': '',              // Return every history item....
      'startTime': oneWeekAgo,  // that was accessed less than one week ago.
       'maxResults': 100000       //set the max to 1000
    },
    function(historyItems) {
      // For each history item, get details on all visits.
      for (var i = 0; i < historyItems.length; ++i) {
        var url = historyItems[i].url;
        var processVisitsWithUrl = function(url){ 
          // We need the url of the visited item to process the visit.
          // Use a closure to bind the  url into the callback's args.
          return function(visitItems) {
            processVisits(url, visitItems);
          };
        };
        //var tryfunction = function(){
         //   console.log("this is " + i + "times to call");
       // }
        chrome.history.getVisits({url: url}, processVisitsWithUrl(url));
        //chrome.history.getVisits({url:url},tryfunction);
        //if(i == 50){
         // console.log(numRequestsOutstanding);
       // }
        //if(i == 99){
         // console.log("i do first");
        //}
        numRequestsOutstanding++;
      }
      //in case historyItems.length = 0
      if (!numRequestsOutstanding) {
        onAllVisitsProcessed();
      }
    });


  // Maps URLs to a count of the number of times the user typed that URL into
  // the omnibox.
  var urlToCount = {};

  // Callback for chrome.history.getVisits().  Counts the number of
  // times a user visited a URL by typing the address.
  var processVisits = function(url, visititems) {
    console.log(url);
    //var pattern = /(.*?\.(com|cn|org|html|net|fm|se|me))/; 
    var pattern = /^(.*?:\/\/.*?\/)/;
    var mathes = pattern.exec(url);
    var shorturl = mathes[1] || url;
    //var shorturl = window.location.host(url);
    if(!urlToCount[shorturl]){
      urlToCount[shorturl] = 0;
    }
    urlToCount[shorturl] += visititems.length;
   // console.log(numRequestsOutstanding);

    // If this is the final outstanding call to processVisits(),
    // then we have the final results.  Use them to build the list
    // of URLs to show in the popup.
    if (!--numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
  };

  // This function is called when we have the final list of URls to display.
  var onAllVisitsProcessed = function() {
    // Get the top scorring urls.
    urlArray = [];
    for (var url in urlToCount) {
	    if(urlToCount[url] > 3)
      urlArray.push(url);
    }

    // Sort the URLs by the number of times the user typed them.
    urlArray.sort(function(a, b) {
      return urlToCount[b] - urlToCount[a];
    });

    buildPopupDom(divName, urlArray,urlToCount);
  };
}

document.addEventListener('DOMContentLoaded', function () {
  buildTypedUrlList("typedUrl_div");
});

