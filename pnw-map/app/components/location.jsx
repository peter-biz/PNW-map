var building = "Searching";

function getLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => showPosition(position, callback),
            showError,
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 17000
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position, callback) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var accuracy = position.coords.accuracy;

    if (accuracy > 100) {
        var accWarning = document.createElement("h2");
        accWarning.textContent = "WARNING! Results will not be accurate, accuracy radius is too high!";
        document.body.appendChild(accWarning);
    }

    // SULB Building Coordinates
    const SULBP1 = { lat: 41.584527, lng: -87.474722 }; // Top Left
    const SULBP2 = { lat: 41.584527, lng: -87.473389 }; // Top Right
    const SULBP3 = { lat: 41.584083, lng: -87.473306 }; // Bot Right

    // Gyte Building Coordinates
    const GYTEP1 = { lat: 41.58559579963701, lng: -87.47565221109035 }; // Top Left
    const GYTEP2 = { lat: 41.58550752684843, lng: -87.47417029072048 }; // Top Right
    const GYTEP3 = { lat: 41.585075189061406, lng: -87.47414615084114 }; // Bot Right

    // Potter Building Coordinates
    const POTTERP1 = { lat: 41.586511340457825, lng: -87.47504375643874 }; // Top Left
    const POTTERP2 = { lat: 41.586513346627704, lng: -87.47474066684273 }; // Top Right
    const POTTERP3 = { lat: 41.58616728139962, lng: -87.47474334905155 }; // Bot Right

    // Powers Building Coordinates
    const POWERSP1 = { lat: 41.58648626332894, lng: -87.47561372581177 }; // Top Left
    const POWERSP2 = { lat: 41.58648726641429, lng: -87.47516311473098 }; // Top Right
    const POWERSP3 = { lat: 41.58604691045072, lng: -87.47516445583538 }; // Bot Right

    // CLO Building Coordinates
    const CLOP1 = { lat: 41.58719204054566, lng: -87.47575650012156 }; // Top Left
    const CLOP2 = { lat: 41.58721109895614, lng: -87.47507119576952 }; // Top Right
    const CLOP3 = { lat: 41.58653000805287, lng: -87.4750483969933 }; // Bot Right

    // Anderson Building Coordinates
    const ANDERSONP1 = { lat: 41.58802407130252, lng: -87.47562641050784 }; // Top Left
    const ANDERSONP2 = { lat: 41.58802106211808, lng: -87.47498670370564 }; // Top Right
    const ANDERSONP3 = { lat: 41.5874262439056, lng: -87.47493440063377 }; // Bot Right

    // NILS Building Coordinates
    const NILSP1 = { lat: 41.58361944832225, lng: -87.47458185241473 }; // Top Left
    const NILSP2 = { lat: 41.58361042015047, lng: -87.47343252589033 }; // Top Right
    const NILSP3 = { lat: 41.58337819513019, lng: -87.47355926026957 }; // Bot Right

    // Porter Building Coordinates
    const PORTERP1 = { lat: 41.58540983454981, lng: -87.47351260108323 }; // Top Left
    const PORTERP2 = { lat: 41.58540180973273, lng: -87.47274548936234 }; // Top Right
    const PORTERP3 = { lat: 41.5850868348742, lng: -87.47274280715354 }; // Bot Right

    // Office of Admissions Building Coordinates
    const OFFICEP1 = { lat: 41.58324415257033, lng: -87.47560494597836 }; // Top Left
    const OFFICEP2 = { lat: 41.583293306201845, lng: -87.4751798158813 }; // Top Right
    const OFFICEP3 = { lat: 41.58267336581933, lng: -87.47517445146507 }; // Bot Right

    // Fitness Building Coordinates
    const FITNESSP1 = { lat: 41.58063765045891, lng: -87.4745391853471 }; // Top Left
    const FITNESSP2 = { lat: 41.580620596461095, lng: -87.47340863433189 }; // Top Right
    const FITNESSP3 = { lat: 41.579953480651504, lng: -87.47348105396162 }; // Bot Right

    // Counseling Center Building Coordinates
    const COUNSELINGP1 = { lat: 41.579594338742616, lng: -87.47526740499988 }; // Top Left
    const COUNSELINGP2 = { lat: 41.57959132916529, lng: -87.47498174976117 }; // Top Right
    const COUNSELINGP3 = { lat: 41.579230178868485, lng: -87.47500454853608 }; // Bot Right

    if (latitude >= SULBP3.lat && latitude <= SULBP1.lat && longitude >= SULBP1.lng && longitude <= SULBP2.lng) {
        building = "SULB";
    } else if (latitude >= GYTEP3.lat && latitude <= GYTEP1.lat && longitude >= GYTEP1.lng && longitude <= GYTEP2.lng) {
        building = "Gyte";
    } else if (latitude >= POTTERP3.lat && latitude <= POTTERP1.lat && longitude >= POTTERP1.lng && longitude <= POTTERP2.lng) {
        building = "Potter";
    } else if (latitude >= POWERSP3.lat && latitude <= POWERSP1.lat && longitude >= POWERSP1.lng && longitude <= POWERSP2.lng) {
        building = "Powers";
    } else if (latitude >= CLOP3.lat && latitude <= CLOP1.lat && longitude >= CLOP1.lng && longitude <= CLOP2.lng) {
        building = "CLO";
    } else if (latitude >= NILSP3.lat && latitude <= NILSP1.lat && longitude >= NILSP1.lng && longitude <= NILSP2.lng) {
        building = "NILS";
    } else if (latitude >= PORTERP3.lat && latitude <= PORTERP1.lat && longitude >= PORTERP1.lng && longitude <= PORTERP2.lng) {
        building = "Porter";
    } else if (latitude >= OFFICEP3.lat && latitude <= OFFICEP1.lat && longitude >= OFFICEP1.lng && longitude <= OFFICEP2.lng) {
        building = "Office of Admissions";
    } else if (latitude >= FITNESSP3.lat && latitude <= FITNESSP1.lat && longitude >= FITNESSP1.lng && longitude <= FITNESSP2.lng) {
        building = "Fitness Center";
    } else if (latitude >= COUNSELINGP3.lat && latitude <= COUNSELINGP1.lat && longitude >= COUNSELINGP1.lng && longitude <= COUNSELINGP2.lng) {
        building = "Counseling Center";
    } else if (latitude >= ANDERSONP3.lat && latitude <= ANDERSONP1.lat && longitude >= ANDERSONP1.lng && longitude <= ANDERSONP2.lng) {
        building = "Anderson";
    } else {
        building = "Outside";
    }

    if (callback) {
        callback(building);
    }
}

function showError(error) {
    console.log(error);
    building = "Location access denied.";
}

export { getLocation, building };