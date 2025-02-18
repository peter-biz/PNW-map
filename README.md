# PNWmap
# Possible development platform
* React, using Next.js

# In order to make changes and run the project locally, follow these steps:
* cd into pnw-map in the terminal
* run "npm i" to install the project dependencies
* then do "npm run dev" to run the project locally
* open your browser and go to "http://localhost:3000" to see the project

The main "page file" is the page.tsx file, this is the file that will be rendered when you go to "http://localhost:3000".
This project is in typescript, which is pretty similar to javascript. If you are not familiar with typescript, you can still write javascript code in the typescript files.

# NOTE:
When you push to the main branch, it will automaically deploy to the Vercel project an will be displayed publicly on https://www.pnwmap.app/

# Features to add

* Main Features:
General Map of the campus
Would include interactive buildings that you can “click”/”tap” into to see locations within the building
Routing
Campus Weather (Hammond)
Navbar if adding different pages
Possibly an event tab? MyPNWLIfe something called an “ICS” feed, calendar feed
https://mypnwlife.pnw.edu/ical/pnw/ical_pnw.ics
Current location, denoted by a pin on the map
Pins
Different colors for different uses, ie. maybe red pin is where you are and a blue pin is a pin placed by the user
* Database & its potential uses:
Think i'm just going to use MySQL
host on either AWS RDS, or figure out how Vercel databases work
User login?
Pins, markers on the map, could be save to a user account
Class schedule, shows where they are on the map
Show quickest route from location
Could store building information in the database, rooms, floors, etc.


# Test Coords for building detection: 
/*TEST COORDINATES:
Potter:  41.586511340457825, -87.47504375643874
    var latitude = 41.58629801363845; 
    var longitude = -87.47489613633094;
SULB: 41.58439176611451414, -87.47382380681304
    var latitude = 41.58439176611451414;
    var longitude = -87.47382380681304;
Gyte: 41.58535760929506, -87.47474165070558
    var latitude = 41.58535760929506;
    var longitude = -87.47474165070558;
Powers: 41.586212247304864, -87.47538538083892
    var latitude = 41.586212247304864;
    var longitude = -87.47538538083892;
CLO: 41.58692387606377, -87.4753879216367
    var latitude = 41.58692387606377;
    var longitude = -87.4753879216367;
NILS: 41.58347399433531, -87.47412780880333
    var latitude = 41.58347399433531;
    var longitude = -87.47412780880333;
Porter: 41.58520073648839, -87.47312967449056
    var latitude = 41.58520073648839;
    var longitude = -87.47312967449056;
Office of Admissions: 41.582880892778945, -87.4753650896866
    var latitude = 41.582880892778945;
    var longitude = -87.4753650896866;
Fitness: 41.58026844728949, -87.47405612921287
    var latitude = 41.58026844728949;
    var longitude = -87.47405612921287;
Counseling Center: 41.57940670824862, -87.47511291960083
    var latitude = 41.57940670824862;
    var longitude = -87.47511291960083;
Anderson: 41.58755263068507, -87.475474865609
    var latitude = 41.58755263068507;
    var longitude = -87.475474865609;
*/
