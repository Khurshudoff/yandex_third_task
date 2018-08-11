const inputData = require('./data/input');

const smartHouse = function(input) {
    const rates = new Array(24).fill(0);

    input.rates.forEach(function(rate) {
        let from = rate.from;

        if (from === 24) {
            from = 0;
        }

        while (from !== rate.to) {
            rates[from] = rate.value;
            from += 1;
            if (from === 24) {
                from = 0;
            }
        }
    });

    const result = {
        'schedule': {
            '0': [],
            '1': [],
            '2': [],
            '3': [],
            '4': [],
            '5': [],
            '6': [],
            '7': [],
            '8': [],
            '9': [],
            '10': [],
            '11': [],
            '12': [],
            '13': [],
            '14': [],
            '15': [],
            '16': [],
            '17': [],
            '18': [],
            '19': [],
            '20': [],
            '21': [],
            '22': [],
            '23': []
        },
        'consumedEnergy': {
            'value': 0,
            'devices': {}
        }
    };

    const devicesCanStart = [];

// this block creates array in which is written all hours when every device can start work
    input.devices.forEach((device) => {
        const tmpArray = [];

        if (device.duration === 24) {
            tmpArray.push(0);
        } else if (device.mode === 'day') {
            let startTime = 7;

            while (startTime + device.duration <= 21) {
                tmpArray.push(startTime);
                startTime += 1;
            }
        } else if (device.mode === 'night') {
            let startTime = 21;

            while (startTime + device.duration <= 31) {
                if (startTime < 24) {
                    tmpArray.push(startTime);
                } else {
                    tmpArray.push(startTime - 24);
                }
                startTime += 1;
            }
        } else {
            for (let hour = 0; hour < 24; hour += 1) {
                tmpArray.push(hour);
            }
        }

        devicesCanStart.push([
            device.id,
            tmpArray,
            device.power,
            device.duration
        ]);
    });

// this function takes (startTime and deviceId) and returns power
    const calculatePower = function(startTime, deviceCanStart) {
        let device = null;
        const deviceId = deviceCanStart[0];

        for (const key in input.devices) {
            if (input.devices[key].id === deviceId) {
                device = input.devices[key];
                break;
            }
        }

        let power = 0;

        let duration = deviceCanStart[3];

        while (duration > 0) {
            duration -= 1;
            power += rates[(startTime + duration) % 24];
        }

        return power;
    };

// make all combinations of startTIme of all devices
    const f = (a, b) => [].concat(...a.map(ai => b.map(bi => ai.concat([bi]))));
    const cartesian = (arrays) => arrays.reduce((a, b) => f(a, b[1]), [[]]);
    const startTimeCombinations = cartesian(devicesCanStart);


// this function checks if hour power is more then max power
    const useMorePower = function(startTimeArray) {
        const matr = [];

        for (let hour = 0; hour < 24; hour += 1) {
            matr[hour] = new Array(startTimeArray.length).fill(0);
            for (let index = 0; index < startTimeArray.length; index += 1) {
                if (startTimeArray[index] + devicesCanStart[index][3] < 24) {
                    if (hour >= startTimeArray[index] && hour < startTimeArray[index] + devicesCanStart[index][3]) {
                        matr[hour][index] = devicesCanStart[index][2];
                    }
                } else if ((hour >= startTimeArray[index] && hour < 24) ||
                    (hour >= 0 && hour < (startTimeArray[index] + devicesCanStart[index][3]) % 24)) {
                    matr[hour][index] = devicesCanStart[index][2];
                }
            }
        }

        for (let hour = 0; hour < 24; hour += 1) {
            const sum = matr[hour].reduce((a, b) => a + b, 0);

            if (sum > input.maxPower) {
                return false;
            }
        }

        return true;
    };

    startTimeCombinations.forEach((startTimeArray, index, array) => {
        if (useMorePower(startTimeArray)) {
            array[index] = null;
        }
    });

    let minPowerArray = [Number.MAX_VALUE];
    let minPowerStartTimeArray = null;

    startTimeCombinations.forEach((startTimeArray) => {
        const powerArray = [];

        if (startTimeArray) {
            startTimeArray.forEach((startTime, index) => {
                powerArray.push(calculatePower(startTime, devicesCanStart[index]));
            });

            const powerSum = powerArray.reduce((a, b) => a + b, 0);
            const minPowerSum = minPowerArray.reduce((a, b) => a + b, 0);

            if (powerSum < minPowerSum) {
                minPowerArray = powerArray;
                minPowerStartTimeArray = startTimeArray;
            }
        }
    });

    minPowerStartTimeArray.forEach((startTime, index) => {
        const id = devicesCanStart[index][0];
        let duration = devicesCanStart[index][3];
        while (duration > 0) {
            duration -= 1;
            const hour = (startTime + duration) % 24;

            result.schedule[hour.toString()].push(id);
        }
    });

    result.consumedEnergy.value = minPowerArray.reduce((a, b) => a + b, 0);
    for (const index in devicesCanStart) {
        result.consumedEnergy[devicesCanStart[index][0]] = minPowerArray[index];
    }

    return devicesCanStart;
};

console.log(smartHouse(inputData));
