// Example of Upsilon.js usage from the CLI, can be used headless
// const Numworks = require('upsilon.js')
const Numworks = require('./Numworks.js')
const usb = require('usb');

// Init webusb
navigator = {}
navigator.usb = usb.webusb

// Add navigator to Numworks
Numworks.navigator = navigator

// Create calculator object
var calculator = new Numworks()

navigator.usb.addEventListener('disconnect', function (e) {
    calculator.onUnexpectedDisconnect(e, function () {
        console.log("Disconnected from calculator")
    })
})

// Disable WebDFU logging to avoid spamming the console
function disableWebDFULogging(calculator) {
    // calculator.device.logDebug = function () { }
    // calculator.device.logInfo = function () { }
    // calculator.device.logWarning = function () { }
    // calculator.device.logError = function () { }
    // calculator.device.logProgress = function () { }
    calculator.device.logDebug = function (msg) { console.log("DEBUG:", msg) }
    calculator.device.logInfo = function (msg) { console.log("INFO :", msg) }
    calculator.device.logWarning = function (msg) { console.log("WARN:", msg) }
    calculator.device.logError = function (msg) { console.log("ERROR:", msg) }
    calculator.device.logProgress = function (msg) { console.log("PROG:", msg) }
}

// Called when calculator is connected
function onConnect() {
    disableWebDFULogging(calculator)
}

// Connect to calculator
async function connect() {
    console.log("Connecting to calculator...")

    // While calculator is not connected, try to connect
    while (calculator.device == null) {
        await calculator.detect(onConnect, function () { })
    }
    console.log("Connected to calculator")
    return {status: "connected"}
}

async function disconnect() {
    console.log("Disconnecting from calculator...")
    if (calculator.device != null) {
        calculator.device.close()
    }
    // Create a new calculator object to avoid any error
    calculator = new Numworks()
    console.log("Disconnected from calculator")
    return {status: "disconnected"}
}

async function status() {
    if (calculator.device == null) {
        return {status: "disconnected"}
    } else {
        return {status: "connected"}
    }
}

function addScriptToStorage(storage, script) {
    let index = 0;
    for (const _ in storage.records) {
        const record = storage.records[index]
        // delete storage.records[index]
        if (record.name === script.name) {
            delete storage.records[index]
        } else {
            index++;
        }
    }
    storage.records.push(script)
}

async function main() {
    await connect();
    console.log(await status())

    let model = calculator.getModel()
    console.log("Calculator Model:", model)

    let platformInfo = await calculator.getPlatformInfo()
    console.log("PlatformInfo:", platformInfo)

    let storage = await calculator.backupStorage()
    console.log("Storage:", storage)

    addScriptToStorage(storage, {
        name: "hello_world",
        type: "py",
        autoImport: false,
        code: 'print("It\'s working perfectly!!! :tada:")'
    })

    await calculator.installStorage(storage, function () { })
    console.log("Storage Installed")

    // console.log("Crashing the calculator")
    // if (!await calculator.crash()) {
    //     console.error("Failed to crash the calculator")
    // }

    await disconnect()

    console.log("Exiting")
    process.exit(0)
}

main()
