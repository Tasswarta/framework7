// Let's register Template7 helper so we can pass json string in links
Template7.registerHelper('json_stringify', function (context) {
    return JSON.stringify(context);
});

// Export selectors engine
var $$ = Dom7;
var mainView ;
var json_type = 'rest'; // global

// Initialize your app
var myApp = new Framework7({
  debug: false,
  animateNavBackIcon: true,
// Enable templates auto precompilation
  precompileTemplates: true,
// Enabled pages rendering using Template7
  template7Pages: true,
  template7Data: {
        ncounter : {
          count: 10,
          total:100
              },
        about: {
                name: 'Michel',
                age: 62,
                position: 'Data Designer',
                company: 'xiligroup v 0.3',
                interests: ['garden', 'music', 'JavaScript', 'iMac', 'iOS apps', 'walk on snow']
              },
        'page:contacts': {
              email: 'contact@xiligroup.com',
              city: 'Lyon',
               country: 'Europe'
           }
      }
});

// global var datas from localStorage

var t7p4wpDataCount = localStorage.t7p4wpDataCount ? JSON.parse(localStorage.t7p4wpDataCount) : [0,0];

var t7p4wpDataSettings = localStorage.t7p4wpDataSettings ? JSON.parse(localStorage.t7p4wpDataSettings) :
{'uri': 'http://michel-i5-imac.local:8888/wp_svn41/',
'homequery':'wp-json/posts/',
'authentication':'none',
'user':'remotef7json',
'passwd':'f72(json',
};
Template7.data.t7p4wpDataSettings = t7p4wpDataSettings;


function make_base_auth(user, password) {
  var tok = user + ':' + password; //console.log("Basic Authentication " + tok);
  var hash = btoa(tok);
  //var hash = Base64.encode(tok);
  return "Basic " + hash;
}

function get_latest_posts() {
  var uri = Template7.data.t7p4wpDataSettings['uri'];
  var homequery = Template7.data.t7p4wpDataSettings['homequery'];
  var user = Template7.data.t7p4wpDataSettings['user'];
  var passwd = Template7.data.t7p4wpDataSettings['passwd'];
//console.log("Basic Authentication " + Template7.data.t7p4wpDataSettings['authentication']);
  if (Template7.data.t7p4wpDataSettings['authentication'] == 'on') {
    //console.log("Basic Authentication");
    var headersContent = {
        'Authorization': make_base_auth(user, passwd)
    };
  } else {
    var headersContent = {};
  }


  $$.ajax ({
    xhrFields: {
        withCredentials: true,
      },

    url: uri + homequery ,
    dataType: 'json',
    timeout:10000,
    crossDomain:true,
    headers: headersContent ,

    success: function(json, status, xhr) {

      console.log('inside success ' + status);

      if( status == 200 ) {

        if (json_type == 'rest') {
          Template7.data.posts = json; // WP REST API 'http://michel-i5-imac.local:8888/wp_svn41/wp-json/posts/'
        } else {
          Template7.data.posts = json['posts'];
        }
        var the_posts = Template7.data.posts;
        var index = -1;
        var ar_ID_to_index = {};
        var ar_ID = the_posts.map(function(a){index++; var nid = a['ID']; ar_ID_to_index[nid] = index; });
        Template7.data.ID_to_index = ar_ID_to_index;

        localStorage.t7p4wpData = JSON.stringify(Template7.data.posts); // as in todo7 example
        if (json_type == 'rest') {
          Template7.data.counter = { count: json.length, total_count: json.length }; // WP REST API
        } else {
          Template7.data.counter = { count: json['count'], total_count: json['count_total'] }; // JSON API
        }

        //var compiledTemplate = Template7.compile(template_counter);

        //$$('#posts_count').html(compiledTemplate(Template7.data.counter)); // not set in Safari of iPad but ok in WebApp (HTML5 iOS home screen)

        $$('#posts_count').html(Template7.templates.templateCounter(Template7.data.counter)); // automatically detected because precompile
        Template7.data.counter['saved'] = '*'; // to indicate local storage
        localStorage.t7p4wpDataCount = JSON.stringify(Template7.data.counter);

      } else {
          //
          console.log(xhr.status);
          console.log(xhr.response);
          console.log(xhr.responseText)
          console.log(xhr.statusText);
      }
    },

    error: function( jqXHR, status, error ) { // activated in iPad Safari as 200 ? w/o snd params
      console.log('error ' + jqXHR.statusText);
    }
  });
};
//console.log(typeof (localStorage.t7p4wpData));

if ( typeof (localStorage.t7p4wpData)  == 'undefined' || localStorage.t7p4wpData == '' ) {
    get_latest_posts();
} else {
    Template7.data.posts = JSON.parse (localStorage.t7p4wpData); // as in todo7 example
    var the_posts = Template7.data.posts;
    var index = -1;
    var ar_ID_to_index = {};
    var ar_ID = the_posts.map(function(a){index++; var nid = a['ID']; ar_ID_to_index[nid] = index; });
    Template7.data.ID_to_index = ar_ID_to_index;
    Template7.data.counter = t7p4wpDataCount;
    //var compiledTemplate = Template7.compile(template_counter);
    //document.getElementById('posts_count').innerHTML = compiledTemplate(Template7.data.counter); // not set in Safari of iPad but ok in WebApp (HTML5 iOS home screen)
     $$('#posts_count').html(Template7.templates.templateCounter(Template7.data.counter));
}

// Add main View
mainView = myApp.addView('.view-main', {
    // Enable dynamic Navbar
    dynamicNavbar: true,
    domCache: true
});

// Form management
$$('.edit-settings').on('click', function() {
  var settingsData = myApp.formToJSON("#settings");
  localStorage.t7p4wpDataSettings = JSON.stringify(settingsData);
  Template7.data.t7p4wpDataSettings = settingsData;
  myApp.closeModal('.popup');
});


$$('.popup').on('open', function () { // as in todo7 example
    $$('body').addClass('with-popup');
});

$$('.popup').on('opened', function () {
    myApp.formFromJSON("#settings", Template7.data.t7p4wpDataSettings); // fill form
});

$$('.popup').on('close', function () {
    $$('body').removeClass('with-popup');
    //$$(this).find('input[name="uri"]').blur().val('');
    //$$(this).find('input[name="homequery"]').blur().val('');
});

// Select Pull to refresh content
var ptrContent = $$('.pull-to-refresh-content');

// On refresh
ptrContent.on('refresh', function (e) {
  // Emulate 1s loading
  setTimeout(function () {
  //console.log('refreshing');
    // Execute get_latest_posts to get new Posts
    get_latest_posts();

  myApp.pullToRefreshDone();
  }, 1000);
});

// Update app when manifest updated
// http://www.html5rocks.com/en/tutorials/appcache/beginner/
// Check if a new cache is available on page load.
window.addEventListener('load', function (e) {
    window.applicationCache.addEventListener('updateready', function (e) {
        if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
            // Browser downloaded a new app cache.
            myApp.confirm('A new version of TP74WP is available. Do you want to load it right now?', function () {
                window.location.reload();
            });
        } else {
            // Manifest didn't changed. Nothing new to server.
        }
    }, false);
}, false);

