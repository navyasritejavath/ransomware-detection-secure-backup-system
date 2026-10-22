java    
"use strict";


/*
=========================================================
RANSOMWARE PROTECTION WEB APPLICATION
=========================================================

This application uses the File System Access API.

Supported browsers:
- Google Chrome
- Microsoft Edge
- Other Chromium-based desktop browsers

The application does NOT upload files to a server.

Files remain on the user's computer.
=========================================================
*/


// =======================================================
// GLOBAL VARIABLES
// =======================================================

let selectedDirectory = null;

let selectedFolderName = "";

let lastScanResults = [];

let lastRansomwareResults = [];


// =======================================================
// FILE NAMES
// =======================================================

const BACKUP_FOLDER = "Backup";

const MANIFEST_FILE = "manifest.txt";

const LOG_FILE = "security_log.txt";


// =======================================================
// SUSPICIOUS EXTENSIONS
// =======================================================

const SUSPICIOUS_EXTENSIONS = [

    ".locked",

    ".encrypted",

    ".enc",

    ".ransom",

    ".crypt",

    ".locky"

];


// =======================================================
// DOM READY
// =======================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);


// =======================================================
// INITIALIZE APPLICATION
// =======================================================

function initializeApplication() {

    setupNavigation();

    setupButtons();

    updateDashboard();

}


// =======================================================
// NAVIGATION
// =======================================================

function setupNavigation() {

    const navItems =
        document.querySelectorAll(".nav-item");

    navItems.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;

                showSection(section);

            }
        );

    });


    const actionButtons =
        document.querySelectorAll(
            "[data-section-target]"
        );

    actionButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showSection(
                    button.dataset.sectionTarget
                );

            }
        );

    });

}


// =======================================================
// SHOW SECTION
// =======================================================

function showSection(sectionId) {

    const sections =
        document.querySelectorAll(".page-section");

    sections.forEach(section => {

        section.classList.remove("active");

    });


    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {

        selectedSection.classList.add("active");

    }


    const navItems =
        document.querySelectorAll(".nav-item");

    navItems.forEach(item => {

        item.classList.remove("active");

        if (
            item.dataset.section === sectionId
        ) {

            item.classList.add("active");

        }

    });


    updatePageTitle(sectionId);


    if (sectionId === "backup-info") {

        viewBackup();

    }


    if (sectionId === "logs") {

        viewLog();

    }

}


// =======================================================
// PAGE TITLE
// =======================================================

function updatePageTitle(sectionId) {

    const titles = {

        dashboard: [
            "Dashboard",
            "Ransomware detection and backup system"
        ],

        scan: [
            "Scan Files",
            "Analyze files in the selected folder"
        ],

        backup: [
            "Secure Backup",
            "Create a protected backup of your files"
        ],

        ransomware: [
            "Ransomware Check",
            "Detect suspicious file modifications"
        ],

        "backup-info": [
            "Backup Information",
            "View your backed up files"
        ],

        logs: [
            "Security Log",
            "View security activity"
        ],

        restore: [
            "Restore Backup",
            "Recover files from your backup"
        ]

    };


    const data =
        titles[sectionId] ||
        titles.dashboard;


    document.getElementById(
        "pageTitle"
    ).textContent = data[0];


    document.getElementById(
        "pageSubtitle"
    ).textContent = data[1];

}


// =======================================================
// BUTTON SETUP
// =======================================================

function setupButtons() {

    document.getElementById(
        "importFolderBtn"
    ).addEventListener(
        "click",
        importFolder
    );


    document.getElementById(
        "dashboardImportBtn"
    ).addEventListener(
        "click",
        importFolder
    );


    document.getElementById(
        "scanBtn"
    ).addEventListener(
        "click",
        scanFiles
    );


    document.getElementById(
        "createBackupBtn"
    ).addEventListener(
        "click",
        createBackup
    );


    document.getElementById(
        "ransomwareBtn"
    ).addEventListener(
        "click",
        checkForRansomware
    );


    document.getElementById(
        "refreshBackupBtn"
    ).addEventListener(
        "click",
        viewBackup
    );


    document.getElementById(
        "refreshLogsBtn"
    ).addEventListener(
        "click",
        viewLog
    );


    document.getElementById(
        "restoreBtn"
    ).addEventListener(
        "click",
        restoreBackup
    );

}


// =======================================================
// 1. IMPORT FOLDER
// =======================================================

async function importFolder() {

    if (
        !window.showDirectoryPicker
    ) {

        showToast(
            "Browser Not Supported",
            "Use Chrome or Edge on desktop.",
            "error"
        );

        return;
    }


    try {

        selectedDirectory =
            await window.showDirectoryPicker({
                mode: "readwrite"
            });


        selectedFolderName =
            selectedDirectory.name;


        document.getElementById(
            "selectedFolder"
        ).textContent =
            selectedFolderName;


        document.getElementById(
            "folderAccessStatus"
        ).textContent =
            "Folder selected and accessible";


        writeLog(
            "Folder imported: "
            + selectedFolderName
        );


        showToast(
            "Folder Imported",
            selectedFolderName,
            "success"
        );


        updateDashboard();

    } catch (error) {

        if (
            error.name === "AbortError"
        ) {

            return;
        }


        console.error(error);


        showToast(
            "Import Failed",
            error.message,
            "error"
        );

    }

}


// =======================================================
// CHECK FOLDER
// =======================================================

function checkFolderSelected() {

    if (!selectedDirectory) {

        showToast(
            "Folder Required",
            "Please import a folder first.",
            "error"
        );

        showSection("dashboard");

        return false;
    }

    return true;
}


// =======================================================
// GET FILES FROM FOLDER
// =======================================================

async function getFilesFromDirectory() {

    const files = [];


    for await (
        const entry
        of selectedDirectory.values()
    ) {

        if (
            entry.kind === "file"
        ) {

            files.push(entry);

        }

    }


    return files;
}


// =======================================================
// 2. SCAN FILES
// =======================================================

async function scanFiles() {

    if (!checkFolderSelected()) {
        return;
    }


    try {

        const files =
            await getFilesFromDirectory();


        let totalSize = 0;

        lastScanResults = [];


        for (
            const fileHandle
            of files
        ) {

            const file =
                await fileHandle.getFile();


            totalSize += file.size;


            lastScanResults.push({

                name: file.name,

                size: file.size,

                modified:
                    file.lastModified

            });

        }


        document.getElementById(
            "scanFileCount"
        ).textContent =
            files.length;


        document.getElementById(
            "scanTotalSize"
        ).textContent =
            formatBytes(totalSize);


        renderScanResults(
            lastScanResults
        );


        document.getElementById(
            "dashboardFiles"
        ).textContent =
            files.length;


        writeLog(
            "File scan completed. Files found: "
            + files.length
        );


        showToast(
            "Scan Complete",
            `${files.length} files found.`,
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Scan Failed",
            error.message,
            "error"
        );

    }

}


// =======================================================
// RENDER SCAN RESULTS
// =======================================================

function renderScanResults(files) {

    const container =
        document.getElementById(
            "scanResults"
        );


    if (!files.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span>📄</span>

                <p>
                    No files found.
                </p>

            </div>

        `;

        return;
    }


    let html = `

        <table>

            <thead>

                <tr>

                    <th>File Name</th>

                    <th>Size</th>

                    <th>Last Modified</th>

                </tr>

            </thead>

            <tbody>

    `;


    files.forEach(file => {

        html += `

            <tr>

                <td class="file-name">
                    ${escapeHtml(file.name)}
                </td>

                <td>
                    ${formatBytes(file.size)}
                </td>

                <td>
                    ${formatDate(file.modified)}
                </td>

            </tr>

        `;

    });


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML = html;

}


// =======================================================
// 3. CREATE BACKUP
// =======================================================

async function createBackup() {

    if (!checkFolderSelected()) {
        return;
    }


    const results =
        document.getElementById(
            "backupResults"
        );


    results.innerHTML = "";


    try {

        const files =
            await getFilesFromDirectory();


        if (!files.length) {

            results.innerHTML = `

                <div class="empty-state">

                    <span>📁</span>

                    <p>
                        No files available for backup.
                    </p>

                </div>

            `;

            return;
        }


        const backupDirectory =
            await selectedDirectory.getDirectoryHandle(
                BACKUP_FOLDER,
                {
                    create: true
                }
            );


        const manifestEntries = [];


        let count = 0;


        for (
            const fileHandle
            of files
        ) {

            const file =
                await fileHandle.getFile();


            const hash =
                await calculateSHA256(file);


            const destination =
                await backupDirectory.getFileHandle(
                    file.name,
                    {
                        create: true
                    }
                );


            const writable =
                await destination.createWritable();


            await writable.write(file);

            await writable.close();


            manifestEntries.push(

                file.name
                + "|"
                + file.size
                + "|"
                + hash

            );


            addOperationResult(
                results,
                "success",
                "✓",
                "Backed up: "
                + file.name
            );


            count++;

        }


        await writeTextFile(
            selectedDirectory,
            MANIFEST_FILE,
            manifestEntries.join("\n")
        );


        document.getElementById(
            "backupStatus"
        ).textContent =
            `Backup completed: ${count} files`;


        writeLog(
            "Backup created. Files: "
            + count
        );


        document.getElementById(
            "dashboardBackup"
        ).textContent =
            count;


        showToast(
            "Backup Created",
            `${count} files backed up successfully.`,
            "success"
        );


        updateBackupInformation();

    } catch (error) {

        console.error(error);


        addOperationResult(
            results,
            "error",
            "✕",
            "Backup failed: "
            + error.message
        );


        showToast(
            "Backup Failed",
            error.message,
            "error"
        );

    }

}


// =======================================================
// SHA-256
// =======================================================

async function calculateSHA256(file) {

    const buffer =
        await file.arrayBuffer();


    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            buffer
        );


    const hashArray =
        Array.from(
            new Uint8Array(hashBuffer)
        );


    return hashArray
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");

}


// =======================================================
// WRITE TEXT FILE
// =======================================================

async function writeTextFile(
    directory,
    fileName,
    content
) {

    const fileHandle =
        await directory.getFileHandle(
            fileName,
            {
                create: true
            }
        );


    const writable =
        await fileHandle.createWritable();


    await writable.write(content);

    await writable.close();

}


// =======================================================
// READ TEXT FILE
// =======================================================

async function readTextFile(
    directory,
    fileName
) {

    try {

        const fileHandle =
            await directory.getFileHandle(
                fileName
            );


        const file =
            await fileHandle.getFile();


        return await file.text();

    } catch (error) {

        return null;

    }

}


// =======================================================
// 4. RANSOMWARE DETECTION
// =======================================================

async function checkForRansomware() {

    if (!checkFolderSelected()) {
        return;
    }


    try {

        const files =
            await getFilesFromDirectory();


        if (!files.length) {

            showToast(
                "No Files",
                "There are no files to scan.",
                "error"
            );

            return;
        }


        const manifest =
            await loadManifest();


        const manifestExists =
            manifest.size > 0;


        let suspiciousFiles = 0;

        let changedFiles = 0;

        let newFiles = 0;


        lastRansomwareResults = [];


        for (
            const fileHandle
            of files
        ) {

            const file =
                await fileHandle.getFile();


            const fileName =
                file.name.toLowerCase();


            // -----------------------------------------
            // SUSPICIOUS EXTENSION
            // -----------------------------------------

            if (
                isSuspiciousExtension(fileName)
            ) {

                suspiciousFiles++;


                lastRansomwareResults.push({

                    name: file.name,

                    status: "Suspicious",

                    className: "status-warning",

                    message:
                        "Suspicious extension"

                });


                continue;
            }


            // -----------------------------------------
            // NO MANIFEST
            // -----------------------------------------

            if (!manifestExists) {

                newFiles++;


                lastRansomwareResults.push({

                    name: file.name,

                    status: "New",

                    className: "status-changed",

                    message:
                        "No backup record"

                });


                continue;
            }


            const oldHash =
                manifest.get(file.name);


            // -----------------------------------------
            // NEW FILE
            // -----------------------------------------

            if (!oldHash) {

                newFiles++;


                lastRansomwareResults.push({

                    name: file.name,

                    status: "New",

                    className: "status-changed",

                    message:
                        "Not found in manifest"

                });


                continue;
            }


            // -----------------------------------------
            // CURRENT HASH
            // -----------------------------------------

            const currentHash =
                await calculateSHA256(file);


            // -----------------------------------------
            // CHANGED
            // -----------------------------------------

            if (
                oldHash !== currentHash
            ) {

                changedFiles++;


                lastRansomwareResults.push({

                    name: file.name,

                    status: "Changed",

                    className: "status-changed",

                    message:
                        "SHA-256 mismatch"

                });

            } else {

                lastRansomwareResults.push({

                    name: file.name,

                    status: "OK",

                    className: "status-ok",

                    message:
                        "File unchanged"

                });

            }

        }


        renderRansomwareResults(
            lastRansomwareResults
        );


        updateRiskLevel(
            suspiciousFiles,
            changedFiles,
            newFiles
        );


        document.getElementById(
            "suspiciousCount"
        ).textContent =
            suspiciousFiles;


        document.getElementById(
            "changedCount"
        ).textContent =
            changedFiles;


        document.getElementById(
            "newCount"
        ).textContent =
            newFiles;


        document.getElementById(
            "dashboardChanged"
        ).textContent =
            changedFiles;


        if (
            suspiciousFiles > 0
            ||
            changedFiles >= 2
        ) {

            writeLog(
                "HIGH RISK: Possible ransomware activity detected."
            );

        } else if (
            changedFiles === 1
        ) {

            writeLog(
                "MEDIUM RISK: File modification detected."
            );

        } else {

            writeLog(
                "LOW RISK: Scan completed."
            );

        }


        showToast(
            "Ransomware Check Complete",
            "File integrity analysis completed.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Scan Failed",
            error.message,
            "error"
        );

    }

}


// =======================================================
// SUSPICIOUS EXTENSION
// =======================================================

function isSuspiciousExtension(
    fileName
) {

    return SUSPICIOUS_EXTENSIONS.some(
        extension =>
            fileName.endsWith(extension)
    );

}


// =======================================================
// LOAD MANIFEST
// =======================================================

async function loadManifest() {

    const hashes =
        new Map();


    const content =
        await readTextFile(
            selectedDirectory,
            MANIFEST_FILE
        );


    if (!content) {

        return hashes;

    }


    const lines =
        content.split(/\r?\n/);


    for (
        const line
        of lines
    ) {

        if (!line.trim()) {
            continue;
        }


        const parts =
            line.split("|");


        if (parts.length >= 3) {

            const fileName =
                parts[0];


            const hash =
                parts[2];


            hashes.set(
                fileName,
                hash
            );

        }

    }


    return hashes;

}


// =======================================================
// UPDATE RISK LEVEL
// =======================================================

function updateRiskLevel(
    suspiciousFiles,
    changedFiles,
    newFiles
) {

    const banner =
        document.getElementById(
            "riskBanner"
        );


    const level =
        document.getElementById(
            "riskLevel"
        );


    const message =
        document.getElementById(
            "riskMessage"
        );


    banner.className =
        "risk-banner";


    if (
        suspiciousFiles > 0
        ||
        changedFiles >= 2
    ) {

        banner.classList.add("high");


        level.textContent =
            "HIGH";


        message.textContent =
            "Suspicious activity detected. Review your files and consider restoring from backup.";


    } else if (
        changedFiles === 1
    ) {

        banner.classList.add("medium");


        level.textContent =
            "MEDIUM";


        message.textContent =
            "A file has been modified since the backup.";


    } else {

        banner.classList.add("low");


        level.textContent =
            "LOW";


        message.textContent =
            "No major suspicious activity detected.";

    }

}


// =======================================================
// RENDER RANSOMWARE RESULTS
// =======================================================

function renderRansomwareResults(
    results
) {

    const container =
        document.getElementById(
            "ransomwareResults"
        );


    if (!results.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span>🛡️</span>

                <p>
                    No files found.
                </p>

            </div>

        `;

        return;

    }


    let html = `

        <table>

            <thead>

                <tr>

                    <th>File</th>

                    <th>Status</th>

                    <th>Details</th>

                </tr>

            </thead>

            <tbody>

    `;


    results.forEach(result => {

        html += `

            <tr>

                <td class="file-name">
                    ${escapeHtml(result.name)}
                </td>

                <td class="${result.className}">
                    ${result.status}
                </td>

                <td>
                    ${escapeHtml(result.message)}
                </td>

            </tr>

        `;

    });


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML = html;

}


// =======================================================
// 5. VIEW BACKUP
// =======================================================

async function viewBackup() {

    if (!checkFolderSelected()) {

        return;

    }


    await updateBackupInformation();

}


// =======================================================
// UPDATE BACKUP INFORMATION
// =======================================================

async function updateBackupInformation() {

    if (!selectedDirectory) {
        return;
    }


    const container =
        document.getElementById(
            "backupFileList"
        );


    try {

        const backupDirectory =
            await selectedDirectory.getDirectoryHandle(
                BACKUP_FOLDER
            );


        const files = [];


        for await (
            const entry
            of backupDirectory.values()
        ) {

            if (
                entry.kind === "file"
            ) {

                const file =
                    await entry.getFile();


                files.push({

                    name: file.name,

                    size: file.size,

                    modified:
                        file.lastModified

                });

            }

        }


        document.getElementById(
            "backupFileCount"
        ).textContent =
            `${files.length} files`;


        document.getElementById(
            "backupLocation"
        ).textContent =
            `${selectedFolderName}/Backup`;


        document.getElementById(
            "manifestLocation"
        ).textContent =
            `${selectedFolderName}/${MANIFEST_FILE}`;


        document.getElementById(
            "dashboardBackup"
        ).textContent =
            files.length;


        if (!files.length) {

            container.innerHTML = `

                <div class="empty-state">

                    <span>💾</span>

                    <p>
                        Backup is empty.
                    </p>

                </div>

            `;

            return;

        }


        let html = `

            <table>

                <thead>

                    <tr>

                        <th>Backup File</th>

                        <th>Size</th>

                        <th>Modified</th>

                    </tr>

                </thead>

                <tbody>

        `;


        files.forEach(file => {

            html += `

                <tr>

                    <td class="file-name">
                        ${escapeHtml(file.name)}
                    </td>

                    <td>
                        ${formatBytes(file.size)}
                    </td>

                    <td>
                        ${formatDate(file.modified)}
                    </td>

                </tr>

            `;

        });


        html += `

                </tbody>

            </table>

        `;


        container.innerHTML = html;

    } catch (error) {

        document.getElementById(
            "backupFileCount"
        ).textContent =
            "0 files";


        document.getElementById(
            "backupLocation"
        ).textContent =
            "No Backup folder";


        container.innerHTML = `

            <div class="empty-state">

                <span>💾</span>

                <p>
                    No backup has been created yet.
                </p>

            </div>

        `;

    }

}


// =======================================================
// 6. VIEW SECURITY LOG
// =======================================================

async function viewLog() {

    if (!checkFolderSelected()) {
        return;
    }


    const content =
        await readTextFile(
            selectedDirectory,
            LOG_FILE
        );


    const container =
        document.getElementById(
            "logResults"
        );


    if (!content) {

        container.innerHTML = `

            <div class="empty-state">

                <span>📜</span>

                <p>
                    No security log available.
                </p>

            </div>

        `;

        return;
    }


    const lines =
        content
            .split(/\r?\n/)
            .filter(
                line => line.trim()
            )
            .reverse();


    let html = "";


    lines.forEach(line => {

        html += `

            <div class="log-entry">
                ${escapeHtml(line)}
            </div>

        `;

    });


    container.innerHTML = html;

}


// =======================================================
// 7. RESTORE BACKUP
// =======================================================

async function restoreBackup() {

    if (!checkFolderSelected()) {
        return;
    }


    const confirmed =
        window.confirm(
            "Restore backup files?\n\n" +
            "Existing files with the same names " +
            "will be replaced."
        );


    if (!confirmed) {

        return;

    }


    const results =
        document.getElementById(
            "restoreResults"
        );


    results.innerHTML = "";


    try {

        const backupDirectory =
            await selectedDirectory.getDirectoryHandle(
                BACKUP_FOLDER
            );


        let count = 0;


        for await (
            const entry
            of backupDirectory.values()
        ) {

            if (
                entry.kind !== "file"
            ) {

                continue;

            }


            const backupFile =
                await entry.getFile();


            const destination =
                await selectedDirectory.getFileHandle(
                    backupFile.name,
                    {
                        create: true
                    }
                );


            const writable =
                await destination.createWritable();


            await writable.write(
                backupFile
            );


            await writable.close();


            addOperationResult(
                results,
                "success",
                "✓",
                "Restored: "
                + backupFile.name
            );


            count++;

        }


        document.getElementById(
            "restoreStatus"
        ).textContent =
            `Restore completed: ${count} files`;


        writeLog(
            "Backup restored. Files: "
            + count
        );


        showToast(
            "Restore Complete",
            `${count} files restored.`,
            "success"
        );

    } catch (error) {

        console.error(error);


        addOperationResult(
            results,
            "error",
            "✕",
            "Restore failed: "
            + error.message
        );


        showToast(
            "Restore Failed",
            error.message,
            "error"
        );

    }

}


// =======================================================
// WRITE SECURITY LOG
// =======================================================

async function writeLog(
    message
) {

    if (!selectedDirectory) {

        return;

    }


    try {

        const existing =
            await readTextFile(
                selectedDirectory,
                LOG_FILE
            );


        const timestamp =
            new Date().toLocaleString(
                "en-IN",
                {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                }
            );


        const newEntry =
            `[${timestamp}] ${message}`;


        const updated =
            existing
                ? existing + "\n" + newEntry
                : newEntry;


        await writeTextFile(
            selectedDirectory,
            LOG_FILE,
            updated
        );


    } catch (error) {

        console.error(
            "Logging error:",
            error
        );

    }

}


// =======================================================
// DASHBOARD
// =======================================================

async function updateDashboard() {

    if (!selectedDirectory) {

        return;

    }


    try {

        const files =
            await getFilesFromDirectory();


        document.getElementById(
            "dashboardFiles"
        ).textContent =
            files.length;


    } catch (error) {

        console.error(error);

    }


    try {

        const backupDirectory =
            await selectedDirectory.getDirectoryHandle(
                BACKUP_FOLDER
            );


        let count = 0;


        for await (
            const entry
            of backupDirectory.values()
        ) {

            if (
                entry.kind === "file"
            ) {

                count++;

            }

        }


        document.getElementById(
            "dashboardBackup"
        ).textContent =
            count;


    } catch (error) {

        document.getElementById(
            "dashboardBackup"
        ).textContent =
            "0";

    }

}


// =======================================================
// OPERATION RESULT
// =======================================================

function addOperationResult(
    container,
    type,
    icon,
    message
) {

    const element =
        document.createElement("div");


    element.className =
        `operation-item ${type}`;


    element.innerHTML = `

        <span>
            ${icon}
        </span>

        <span>
            ${escapeHtml(message)}
        </span>

    `;


    container.appendChild(element);

}


// =======================================================
// FORMAT BYTES
// =======================================================

function formatBytes(bytes) {

    if (bytes === 0) {
        return "0 B";
    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB"
    ];


    const index =
        Math.floor(
            Math.log(bytes)
            /
            Math.log(1024)
        );


    return (
        bytes /
        Math.pow(1024, index)
    ).toFixed(2)
    + " "
    + units[index];

}


// =======================================================
// FORMAT DATE
// =======================================================

function formatDate(timestamp) {

    return new Date(
        timestamp
    ).toLocaleString(
        "en-IN"
    );

}


// =======================================================
// HTML ESCAPE
// =======================================================

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =======================================================
// TOAST
// =======================================================

function showToast(
    title,
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const icon =
        document.getElementById(
            "toastIcon"
        );


    document.getElementById(
        "toastTitle"
    ).textContent =
        title;


    document.getElementById(
        "toastMessage"
    ).textContent =
        message;


    icon.textContent =
        type === "error"
            ? "!"
            : "✓";


    toast.classList.add("show");


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3500
    );

}
