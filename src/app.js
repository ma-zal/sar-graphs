"use strict";

const express = require('express');
const exec = require('child_process').exec;
const fs = require('fs');


// CONSTS
const exportParams = '-b -q -r -S -u ALL -v';
// -q    Report queue length and load averages. The following values are displayed:
const SARLOGS_DIR = '/var-log-sa';
const SARARCHIVE_DIR = '/storage/sar-archive';
const GRAPHS_DIR = '/storage/img-graphs';


const app = express();
app.use('/img-graphs', express.static(GRAPHS_DIR));
app.use('/', express.static('public'));

const server = app.listen(1080, () => console.log('App listening on port 1080!'));

 generateGraphs();
const intervalId = setInterval(() => {
    generateGraphs();
}, 600000);
process.on('SIGTERM', () => {
    console.log('Stopping app...');
    clearInterval(intervalId);
    server.close((err) => {
        if (err) {
            console.error('Express server closing error:', err.message);
        } else {
            console.log('Express server closed.');
        }
    });
});

async function generateGraphs() {
    // Process files of last 28 days
    for (let i = 0; i <= 27; i++) {

        const date = (new Date());
        date.setDate(date.getDate() - i);
        const day = date.getDate();

        const sourceSarFile = `${SARLOGS_DIR}/sa${day<10?'0':''}${day}`;
        const destSarFile = `${SARARCHIVE_DIR}/sar-${date.toISOString().substring(0,10)}`;
        const svgFile = `${GRAPHS_DIR}/graph-${date.toISOString().substring(0,10)}.svg`;

        let destSarFileExists = false;
        try {
            destSarFileExists = fs.lstatSync(destSarFile).isFile();
        } catch (ignore) {}

        if (!destSarFileExists || i < 2) {
            // Convert SAR info new version and copy to archive dir.
            await new Promise((resolve, reject) => {
                const command = `sadf -c ${sourceSarFile} >${destSarFile}`;
                console.log("Converting SAR file by:", command);
                const run = exec(command, function(err, stdout, stderr) {
                    if (err) {
                        console.error('EXEC ERROR:');
                        console.error('-----------');
                        console.error('Exit code:', err.code);
                        console.error(err.message);
                    }
                });
                run.on('exit', function (ignore_code) {
                    resolve();
                });
            });
        }
        
        let svgFileExists = false;
        try {
            svgFileExists = fs.lstatSync(svgFile).isFile();
        } catch (ignore) {}

        if (!svgFileExists || i < 2) {

            // Generate SVG file
            await new Promise((resolve, reject) => {
                const command = `sadf -T -g ${destSarFile} -- ${exportParams} >${svgFile}`;
                // Note: -t     Display timestamp in the original local time of the data file creator instead of UTC (Coordinated Universal Time).
                console.log("Generating SVG by:", command);
                const run = exec(command, function(err, stdout, stderr) {
                    if (err) {
                        console.error('EXEC ERROR:');
                        console.error('-----------');
                        console.error('Exit code:', err.code);
                        console.error(err.message);
                    }
                });
                run.on('exit', function (ignore_code) {
                    resolve();
                });
            });
        }

    }

}
