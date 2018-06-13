"use strict";

const express = require('express');
const exec = require('child_process').exec;
const fs = require('fs');


// CONSTS
const exportParams = '-b -r -S -u ALL -v';
const SARLOGS_DIR = '/var-log-sa';
const SARARCHIVE_DIR = '/storage/sar';
const GRAPHS_DIR = '/storage/graphs';


const app = express();
app.use('/img-graphs', express.static(GRAPHS_DIR));
app.use('/', express.static('public'));

app.listen(1080, () => console.log('App listening on port 1080!'));

generateGraphs();
setInterval(() => {
    generateGraphs();
}, 600000);

async function generateGraphs() {
    // Process files of last 28 days
    for (let i=0; i <= 27; i++) {
        await new Promise((resolve, reject) => {
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
                    const command = `sadf -c ${sourceSarFile} >/${destSarFile}`;
                    console.log("Converting SAR file by:", command);
                    const run = exec(command, function(err, stdout, stderr) {
                        if (err) {
                            console.error(err);
                        }
                    });
                    run.on('exit', function (code) {
                        // exit code is code
                        if (code !== 0) {
                            console.error(`Exec failed with exit code ${code}`);
                        }
                        resolve();
                    });
                });
            }
            
            let destSvgFileExists = false;
            try {
                destSvgFileExists = fs.lstatSync(svgFile).isFile();
            } catch (ignore) {}

            if (!destSvgFileExists || i < 2) {

                // Generate SVG file
                await new Promise((resolve, reject) => {
                    const command = `sadf -g ${sourceSarFile} -- ${exportParams} >${svgFile}`;
                    console.log("Generating SVG by:", command);
                    const run = exec(command, function(err, stdout, stderr) {
                        if (err) {
                            console.error(err);
                        }
                    });
                    run.on('exit', function (code) {
                        // exit code is code
                        if (code !== 0) {
                            console.error(`Exec failed with exit code ${code}`);
                        }
                        resolve();
                    });
                });
            }

        });
    }

}
