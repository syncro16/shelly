// curl "https://api.porssisahko.net/v1/latest-prices.json"

let asetukset = {
    "hinta":
        {"min":0.00,
        "max":0.05},
}


let conf = {
    "config":
    {
        "leds":
        {
            "mode": "switch",
            "colors": { 
                "switch:0": { 
                    "on": { "rgb": [100, 100, 0], "brightness": 100 }, 
                    "off": { "rgb": [20, 30, 0], "brightness": 100 } }, 
                    "power": { "brightness": 100 } }, 
                    "night_mode": { "enable": true, "brightness": 10, 
                    "active_between": ["22:00", "06:00"] }
        }, "controls": { "switch:0": { "in_mode": "detached" } }
    }
};
