const NOTIFICATION_TITLE = 'Title'
const NOTIFICATION_BODY = 'Notification from the Renderer process. Click to log to console.'
const CLICK_MESSAGE = 'Notification clicked!'


function notify() {
    new Notification(NOTIFICATION_TITLE, { body: NOTIFICATION_BODY })
        .onclick = () => document.getElementById("output").innerText = CLICK_MESSAGE
}

function exit() {
    myAPI.ipcRenderer.send('bye', 2000);
}

console.log(myAPI.getUserName());
