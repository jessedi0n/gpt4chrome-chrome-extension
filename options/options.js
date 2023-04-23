
// get the send button api-key-save-btn
var saveBtn = document.getElementById('api-key-save-btn');

// get the input field api-key-input
var apiKeyInput = document.getElementById('api-key-input');

// disable the save button if the input field is empty
if (apiKeyInput.value.trim() == '') {
    saveBtn.disabled = true;
}

// add a keyup event listener to the input field to enable the save button if the input field is not empty
apiKeyInput.addEventListener('keyup', function () {
    if (apiKeyInput.value.trim() == '') {
        saveBtn.disabled = true;
    } else {
        saveBtn.disabled = false;
    }
});

// add a click event listener to the send button
saveBtn.addEventListener('click', function () {

    // get the value of the input field
    var apiKey = apiKeyInput.value.trim();

    // Save the API key to storage
    chrome.storage.local.set({ apiKey: apiKey }, function () {
        console.log('API key saved');
        // switch the save button icon to a check mark
        showCheckOnSave();
    });
});

// load the current API key from storage and display it in the input field
chrome.storage.local.get('apiKey', function (data) {
    if (data.apiKey) {
        // display the API key in the input field if it exists
        apiKeyInput.value = data.apiKey;
    }
});

// switch the save buttonn icon to a check mark
function showCheckOnSave() {
    // change the icon to a check mark
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    // change the icon back to a save icon after 3 second
    setTimeout(function () {
        saveBtn.innerHTML = '<i class="fas fa-save"></i>';
    }, 3000);
}

const showHideBtn = document.getElementById("api-key-show-hide-btn");

showHideBtn.addEventListener("click", function () {
    if (apiKeyInput.type === "password") {
        apiKeyInput.type = "text";
        showHideBtn.innerHTML = '<i class="fas fa-eye-slash"></i>'; // change the icon to a eye-slash
    } else {
        apiKeyInput.type = "password";
        showHideBtn.innerHTML = '<i class="fas fa-eye"></i>'; // change the icon to a eye
    }
});

// Get the select element
const modelSelect = document.getElementById('model-version-select');

// Load the saved API model setting from Chrome storage and set the dropdown to the saved value
chrome.storage.local.get('apiModel', ({ apiModel }) => {
    const defaultModel = 'gpt-3.5-turbo';
    if (!apiModel) {
        chrome.storage.local.set({ apiModel: defaultModel });
        modelSelect.value = defaultModel;
    } else {
        modelSelect.value = apiModel;
    }
});

// Save the selected API model to Chrome storage when the dropdown value changes
modelSelect.addEventListener('change', () => {
    chrome.storage.local.set({ apiModel: modelSelect.value });
});
