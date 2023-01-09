import * as fs from "fs";
import * as os from 'os';
import * as path from "path";
import * as process from "process";
import * as childProcess from 'child_process';
import { gsetting } from "./src/modules/gsetting.h";
import * as readline from 'readline';

//create template for user argument parsing
//only flags that require aditional arguments will be assigned here
let knownFlags:string[] = ["--help", "-h", "-L", "--setup-light", "-D", "--setup-dark", "--reset-targets"];

//conf
const configPath = path.join(os.homedir(), ".config/better-theme-switcher");

//watch
const watchTargetLocation:string = "org.gnome.desktop.interface";
const watchTargetProperty:string = "color-scheme";
//adw theming
const gtk3TargetFile:string = path.join(os.homedir(), ".config/gtk-3.0/gtk.css");
const gtk4TargetFile:string = path.join(os.homedir(), ".config/gtk-4.0/gtk.css");

//store process arguments
let args = {
    "getLight": false,
    "getDark": false,
    "resetTargets":false
}

//main function
Main();
function Main(): void {
    //parse process arguments
    for(let i:number = 0; i < process.argv.length; i++) {
        if(process.argv[i].startsWith("-") && !knownFlags.includes(process.argv[i])) {
            console.log(`[WARNING]: Unknown option "${process.argv[i]}"`);
        }
        switch(process.argv[i]) {
            case "--help":
            case "-h":
                console.log(fs.readFileSync(path.join(__dirname, "./src/HelpFile")).toString());
                process.exit(0);
            break;

            //get light
            case "-L":
            case "--setup-light":
                args.getLight = true;
            break;

            //get dark
            case "-D":
            case "--setup-dark":
                args.getDark = true;
            break;

            //reset targets
            case "--reset-targets":
                args.resetTargets = true;
            break;
        }
    }
    
    //confirm config path existance
    if(!configPathExists()) {
        createConfigPath();
    }

    //switch mode
    if(args.getLight || args.getDark) {
        const targetTheme:string = (args.getLight)? "light" : "dark";

        let settingsCache:gsetting[] = [];

        //confirm target file existance
        if(!fs.existsSync(path.join(configPath, "targets"))) {
            console.log(`ERROR: Could not find the targets file in the configuration path "${configPath}"`);
            console.log("To create this file, run this program with the --reset-targets flag.");
            process.exit(1);
        }

        let targets:readline.Interface = readline.createInterface({
            'input':fs.createReadStream(path.join(configPath, "targets"))
        })

        targets.on('line', function(line:string): void {
            if(!line.startsWith("#") && line !== "" && line !== "\n" && line.length > 1) {

                let result:string = childProcess.execSync(`gsettings get ${line}`).toString();
                if(result.includes("No such schema")) {
                    console.log(`Could not get value of "${line}", schema does not exist`);
                } else if (result.includes("No such key")) {
                    console.log(`Could not get value of "${line}", key does not exist`);
                } else {
                    let thisPath = line.split(" ")[0];
                    let thisProperty = line.split(" ")[1];

                    //special rule for picture-uri due to it having two different keys
                    if(thisProperty === "picture-uri" && targetTheme === "dark") {
                        thisProperty = "picture-uri-dark";
                    }
                    if(thisProperty === "picture-uri" && targetTheme === "light") {
                        thisProperty = "picture-uri";
                    }

                    settingsCache.push({
                        'path':thisPath,
                        'property':thisProperty,
                        'value':result.toString().replace(/\n/g, "")
                    })
                }
            }
        })

        //finished getting properties from targets file
        targets.on('close', function(): void {
            fs.writeFileSync(path.join(configPath, `${targetTheme}.gset.json`), JSON.stringify(settingsCache, null, 2));
            console.log(`Wrote ${settingsCache.length} settings to ${targetTheme}.gset.json`);

            //copy css files (gtk4)
            fs.copyFileSync(gtk4TargetFile, path.join(configPath, `css/${targetTheme}.gtk4.css`));

            //copy css files (gtk3)
            fs.copyFileSync(gtk3TargetFile, path.join(configPath, `css/${targetTheme}.gtk3.css`));
        })

    //reset targets file
    } else if(args.resetTargets) {
        fs.writeFileSync(path.join(configPath, "targets"), fs.readFileSync(path.join(__dirname, "src/assets/defaults/targets")));
        console.log(`Wrote targets file to "${path.join(configPath, "targets")}"`);
        process.exit(0);
    } else {
        //main target, watch
        //confirm that both presets exist
        if(!fs.existsSync(path.join(configPath, "dark.gset.json"))) {
            console.log(`ERROR: Could not find the dark preset (dark.gset.json) in the configuration path "${configPath}"`);
            console.log("To create it, run this program with the --setup-dark flag.");
            process.exit(1);
        }
        if(!fs.existsSync(path.join(configPath, "light.gset.json"))) {
            console.log(`ERROR: Could not find the light preset (light.gset.json) in the configuration path "${configPath}"`);
            console.log("To create it, run this program with the --setup-light flag.");
            process.exit(1);
        }
        if(!fs.existsSync(path.join(configPath, "targets"))) {
            console.log(`ERROR: Could not find the targets file in the configuration path "${configPath}"`);
            console.log("To create this file, run this program with the --reset-targets flag.");
            process.exit(1);
        }

        //log target
        console.log(`Watching target: "${watchTargetLocation} ${watchTargetProperty}"`);
        let watchParams:string[] = ['monitor', watchTargetLocation, watchTargetProperty];
        console.log(`exec: gsettings ${watchParams.join(" ")}`);
        let watchProcess = childProcess.spawn('gsettings', watchParams);

        watchProcess.stdout.on('data', function(message:any): void {
            let currentScheme = message.toString().replace(/\n/g, "").split(" ")[1];
            console.log(`Property updated to: ${currentScheme}`);

            //switch current property
            switch(currentScheme) {
                //activate dark mode
                case "'prefer-dark'": {
                    applyTheme("dark");
                }
                break;

                //activate light mode
                case "'default'": {
                    applyTheme("light");
                }
                break;

                //unknown response
                default: {
                    console.log(`Unknown property value: ${currentScheme}`);
                    console.log(`Recieved: ${message.toString()}`);
                }
            }
        })
    }
}

//apply theme
function applyTheme (targetTheme: "light" | "dark"): void {
     //write css files (gtk4)
     fs.writeFileSync(gtk4TargetFile, fs.readFileSync(path.join(configPath, `css/${targetTheme}.gtk4.css`)));
     //write css files (gtk3)
     fs.writeFileSync(gtk3TargetFile, fs.readFileSync(path.join(configPath, `css/${targetTheme}.gtk3.css`)));

    //read gset file
    let targetSettings:gsetting[] = JSON.parse(fs.readFileSync(path.join(configPath, `${targetTheme}.gset.json`)).toString());

    //apply all settings in targetSettings
    for(let i = 0; i < targetSettings.length; i++) {
         let thisSetting:gsetting = targetSettings[i];
         childProcess.execSync(`gsettings set ${thisSetting.path} ${thisSetting.property} ${thisSetting.value}`);
    }
 }

//confirm config path exists
function configPathExists(): boolean {
    return fs.existsSync(path.join(os.homedir(), ".config/better-theme-switcher"));
}

//create config path
function createConfigPath(): number {
    fs.mkdirSync(configPath, {'recursive':true});
    fs.mkdirSync(path.join(configPath, "css"));

    //drop files
    fs.copyFileSync(path.join(__dirname, "src/assets/defaults/targets"), path.join(configPath, "targets"));
    return 0;
}