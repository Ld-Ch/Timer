
/* TIMER VARIABLES */

let elapsedSeconds = 0;
let interval = null;

let triggerTimes = [];
let triggered = [];

/* DEFAULT PRESET */

if (!localStorage.getItem("timerPresets")) {

    const defaults = [
        {
            name: "Default",
            times: "7,1,2",
            accentColor: "#00c853",
            flashColor: "#ff1744"
        }
    ];

    localStorage.setItem(
        "timerPresets",
        JSON.stringify(defaults)
    );
}

/* FORMAT TIME */

function formatTime(seconds) {

    if (seconds < 0) seconds = 0;

    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;

    return (
        String(mins).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}

/* LOAD TRIGGERS */

function loadTriggers() {

    triggerTimes = document
        .getElementById("timesInput")
        .value
        .split(",")
        .map(x => parseFloat(x.trim()))
        .filter(x => !isNaN(x))
        .sort((a,b) => a - b);

    triggered =
        new Array(triggerTimes.length).fill(false);
}

/* UPDATE UI */

function updateUI() {

    const list = document.getElementById("triggerList");

    list.innerHTML = "";

    let nextIndex =
        triggerTimes.findIndex(
            (_, i) => !triggered[i]
        );

    if (nextIndex !== -1) {

        let nextSeconds =
            triggerTimes[nextIndex] * 60;

        let remaining =
            nextSeconds - elapsedSeconds;

        document.getElementById(
            "mainCountdown"
        ).textContent = formatTime(remaining);

        document.getElementById(
            "nextTriggerText"
        ).textContent =
            `Next Trigger: ${triggerTimes[nextIndex]} min`;

        // Progress
        let previous = 0;

        if (nextIndex > 0) {
            previous =
                triggerTimes[nextIndex - 1] * 60;
        }

        let section =
            nextSeconds - previous;

        let progress =
            ((elapsedSeconds - previous)
            / section) * 100;

        progress =
            Math.max(0, Math.min(progress,100));

        document.getElementById(
            "progressBar"
        ).style.width = progress + "%";

    } else {

        pauseTimer();

        document.getElementById(
            "mainCountdown"
        ).textContent = "DONE";

        document.getElementById(
            "nextTriggerText"
        ).textContent =
            "All triggers completed";

        document.getElementById(
            "progressBar"
        ).style.width = "100%";
    }

    // Small timers
    triggerTimes.forEach((time, i) => {

        let total = time * 60;
        let remaining = total - elapsedSeconds;

        let div = document.createElement("div");

        div.className =
            "trigger-item " +
            (triggered[i]
                ? "done"
                : "upcoming");

        div.innerHTML = `
            <div>Trigger at ${time} min</div>
            <div>
                ${
                    triggered[i]
                    ? "✓ DONE"
                    : formatTime(remaining)
                }
            </div>
        `;

        list.appendChild(div);
    });
}

/* FLASH */
const audio = new Audio("bell-chime.mp3");
audio.preload = "auto";
let audioUnlocked = false;

document.addEventListener("touchstart", unlockAudio, { once: true });
document.addEventListener("click", unlockAudio, { once: true });

function unlockAudio() {
    audio.play()
        .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audioUnlocked = true;
            console.log("Audio unlocked");
        })
        .catch(err => console.log(err));
}

function flashScreen() {

    document.body.classList.add("flash");

    setTimeout(() => {
        document.body.classList.remove("flash");
    }, 5000);
    
    audio.currentTime = 0;
    audio.play();
}

/* START */

function startTimer() {

    if (!audioUnlocked) {

        audio.play()
            .then(() => {
    
                audio.pause();
                audio.currentTime = 0;
    
                audioUnlocked = true;
            });
    }

    document.documentElement.style
        .setProperty(
            "--accent",
            document.getElementById(
                "accentColor"
            ).value
        );

    document.documentElement.style
        .setProperty(
            "--bgFlash",
            document.getElementById(
                "flashColor"
            ).value
        );

    const allDone =
        triggered.length > 0 &&
        triggered.every(t => t);

    if (triggerTimes.length === 0) {
        loadTriggers();
    }

    if (allDone) {

        elapsedSeconds = 0;

        triggered =
            new Array(triggerTimes.length)
            .fill(false);
    }

    if (triggerTimes.length === 0) {
        loadTriggers();
    }

    if (interval) return;

    interval = setInterval(() => {

        elapsedSeconds++;

        triggerTimes.forEach((time, i) => {

            if (
                elapsedSeconds >= time * 60 &&
                !triggered[i]
            ) {

                triggered[i] = true;

                flashScreen();
            }
        });

        updateUI();

    }, 1000);

    updateUI();
}

/* PAUSE */

function pauseTimer() {

    clearInterval(interval);
    interval = null;
}

/* RESET */

function resetTimer() {

    pauseTimer();

    elapsedSeconds = 0;
    triggerTimes = [];
    triggered = [];

    document.getElementById(
        "mainCountdown"
    ).textContent = "00:00";

    document.getElementById(
        "nextTriggerText"
    ).textContent = "Waiting...";

    document.getElementById(
        "progressBar"
    ).style.width = "0%";

    document.getElementById(
        "triggerList"
    ).innerHTML = "";
}

/* PRESETS */

function savePreset() {

    const name = prompt("Preset name?");

    if (!name) return;

    const preset = {
        name: name,
        
        times: document.getElementById(
            "timesInput"
        ).value,

        accentColor: document.getElementById(
            "accentColor"
        ).value,

        flashColor: document.getElementById(
            "flashColor"
        ).value

    };
        
    const presets = JSON.parse(
        localStorage.getItem(
            "timerPresets"
        )
    );

    
    console.log(presets);

    presets.push(preset);

    localStorage.setItem(
        "timerPresets",
        JSON.stringify(presets)
    );

    renderPresets();
}

function deletePreset(index) {

    const presets = JSON.parse(
        localStorage.getItem("timerPresets")
    );

    presets.splice(index, 1);

    localStorage.setItem(
        "timerPresets",
        JSON.stringify(presets)
    );

    renderPresets();
}

function renamePreset(index) {

    const presets = JSON.parse(
        localStorage.getItem("timerPresets")
    );

    const newName = prompt(
        "New preset name:",
        presets[index].name
    );

    if (!newName) return;

    presets[index].name = newName;

    localStorage.setItem(
        "timerPresets",
        JSON.stringify(presets)
    );

    renderPresets();
}

function renderPresets() {

    const presetList =
        document.getElementById(
            "presetList"
        );

    presetList.innerHTML = "";

    const presets =
        JSON.parse(
            localStorage.getItem(
                "timerPresets"
            )
        );

    presets.forEach((preset, index) => {

        const div =
            document.createElement("div");

        div.className = "preset";

        div.innerHTML = `
            <strong>${preset.name}</strong>
            <br>
            ${preset.times}

            <div class="preset-buttons">
        
                <button onclick="event.stopPropagation(); renamePreset(${index})">
                    Rename
                </button>
        
                <button onclick="event.stopPropagation(); deletePreset(${index})">
                    Delete
                </button>
        
            </div>
        `;

        div.onclick = () => {

            document.getElementById(
                "timesInput"
            ).value = preset.times;

            document.getElementById(
                "accentColor"
            ).value = preset.accentColor;

            document.getElementById(
                "flashColor"
            ).value = preset.flashColor;
        };

        presetList.appendChild(div);
    });
}

/* SIDEBAR */

function toggleSidebar() {

    document.getElementById("sidebar")
        .classList.toggle("open");

    document.getElementById("sidebarOverlay")
        .classList.toggle("show");
}

    /*
    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    //const button =
    //    document.querySelector(".toggle-btn");

    if (window.innerWidth <= 1080) {

        sidebar.classList.remove("hidden");

        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");

        /*if (sidebar.classList.contains("open")) {

            button.style.left = "270px";

        } else {

            button.style.left = "10px";
        }

    } else {

        sidebar.classList.toggle("hidden");

        /*if (sidebar.classList.contains("hidden")) {

            button.style.left = "10px";

        } else {

            button.style.left = "270px";
        }
    }
}*/


/* INIT */

renderPresets();

document.getElementById(
    "timesInput"
).value = "";

document.getElementById(
    "sidebarOverlay"
).addEventListener("click", () => {

    document.getElementById(
        "sidebar"
    ).classList.remove("open");

    document.getElementById(
        "sidebarOverlay"
    ).classList.remove("show");
});

document.getElementById(
    "timesInput"
).addEventListener("keydown", function(event) {

    if (event.key == "Enter") {

        event.preventDefault();
//        console.log("ENTER DETECTED");

        startTimer();
    }
});