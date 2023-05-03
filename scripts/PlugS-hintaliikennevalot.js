// 2023 syncro16@outlook.com

/* Muuta näitä */ 
let lights = [
    {
        "priceMin":0.00,
        "priceMax":0.04,
        "color":{ "rgb": [0, 100, 0], "brightness": 100 }
    },
    {
        "priceMin":0.04,
        "priceMax":0.07,
        "color":{ "rgb": [80, 50, 0], "brightness": 100 }
    },
    {
        "priceMin":0.10,
        "priceMax":0.15,
        "color":{ "rgb": [100, 25, 0], "brightness": 100 }
    },
    {
        "priceMin":0.15,
        "priceMax":100,
        "color":{ "rgb": [100, 0, 0], "brightness": 100 }
    }
];

/* Älä muuta tästä eteenpäin mitään jos et tiedä mitä teet! */

let conf = {
    "config": {
        "leds": {
             "mode": "switch",
             "colors": { 
                 "switch:0": { 
                     "on": { "rgb": [0, 0, 0], "brightness": 100 }, 
                     "off": { "rgb": [0, 0, 0], "brightness": 100 }, 
                     "power": { "brightness": 100 }
                 }
            }, 
        },
        "controls": { "switch:0": { "in_mode": "momentary" } }
    }
};
 
let diagnosticBlinkOn = { "rgb": [0, 10, 10], "brightness": 10 };
let diagnosticBlinkOff = { "rgb": [0, 0,  0], "brightness": 0 };

let diagnosticBlinks = 1;
let diagnosticTick = 0;
let currentPrice = null;

let oldState = diagnosticBlinkOff;

// Background routine for blinking light for diagnostic trouble codes
Timer.set(500,true,function() {
    if (diagnosticBlinks === 0)
        return;
    if ((diagnosticTick % 2) === 0 && diagnosticBlinks > (diagnosticTick >> 1)) {
        conf.config.leds.colors['switch:0'].on = diagnosticBlinkOn;
    } else {
        conf.config.leds.colors['switch:0'].on = diagnosticBlinkOff;
    }
    // make call only if status is really changed
    if (conf.config.leds.colors['switch:0'].on !== oldState) {
        Shelly.call("PLUGS_UI.SetConfig", conf );
        oldState = conf.config.leds.colors['switch:0'].on;
    }
    diagnosticTick++;   
    if (diagnosticTick>10)
        diagnosticTick = 0;
    }
,"");

function setDiagnosticBlink(noOfBlinks) {
  diagnosticBlinks = noOfBlinks;
  diagnosticTick = 0;
}

function applyLights() {
    if (currentPrice !== null) {
        for (let i=0;i<lights.length;i++) {
            if (currentPrice >= lights[i].priceMin && currentPrice <= lights[i].priceMax) {
                //print("setting color to ",lights[i].rgb[0]," ",lights[i].rgb[1]," ",lights[i].rgb[2]," ")
                conf.config.leds.colors['switch:0'].on = lights[i].color;
                Shelly.call("PLUGS_UI.SetConfig", conf );
                return;
            }
        }
    }
}

let pollPricesRetryTimer = null;
// poll prices from external api
function pollPrices() {
    print("polling");
    Shelly.call("HTTP.GET", 
        { url: "https://api.spot-hinta.fi/JustNow" },
        function (res, error_code, error_msg, ud) {
            print("pollPrices",error_code,error_msg);
            if (res.code === 200 && error_code === 0) {
                // all ok
                setDiagnosticBlink(0);
                currentPrice = JSON.parse(res.body).PriceWithTax;
                print("pollPrices, price is now:",currentPrice);
                // update lights
                applyLights();
                // update status after a while
                setupTimer();
            } else {
                print("pollPrices failed, retrying after 1 minute.")
                setDiagnosticBlink(3);
                Timer.set(1000*60, false, pollPrices);
            }
        }
    );
}

let nextPollTimer = null;
// Get system time, set up timer to shoot at next full 15min period (0,15,30,45).
function setupTimer() {
    Timer.clear(nextPollTimer);
    Timer.clear(pollPricesRetryTimer);
    Shelly.call("Shelly.GetStatus",{},function (res, error_code) {
        if (error_code === 0) {           
            setDiagnosticBlink(0);
            // poll every 0,15,30,45 minutes
            // Using JSON.parse as "parseInt"
            let mins = JSON.parse(res.sys.time.slice(3));
            let nextSync = 15-(mins % 15);
            print("setupTimer: next poll triggers after ",nextSync*60," seconds");
            nextPollTimer = Timer.set(nextSync*60*1000, false, pollPrices);
        } else {
            print("setupTimer failed, retrying after 1 minute.")
            setDiagnosticBlink(2);
            // retry with one minute
            Timer.set(1000*60, false, setupTimer);
        }
    })
}

/* main program starts here! */
pollPrices();
